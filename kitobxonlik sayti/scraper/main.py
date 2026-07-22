"""
Main scraper for library.ziyonet.uz

Usage:
    python main.py [--pages N] [--delay SECONDS] [--output DIR] [--verbose]

Examples:
    python main.py --pages 5
    python main.py --pages 100 --delay 2 --output ./data
    python main.py --pages 10 --verbose
"""

import argparse
import sys
from pathlib import Path
from typing import Optional

import requests
from tqdm import tqdm

from models import Book
from parser import parse_list_page, parse_detail_page, BASE_URL
from utils import (
    setup_logging,
    log_page,
    delay,
    save_json,
    save_csv,
    print_summary,
)

# Default headers to mimic a real browser
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "uz,ru;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
}


def create_session() -> requests.Session:
    """Create a requests session with default headers."""
    session = requests.Session()
    session.headers.update(HEADERS)
    return session


def fetch_page(session: requests.Session, url: str, logger) -> Optional[str]:
    """
    Fetch a single page with error handling.
    Returns HTML content or None on failure.
    """
    try:
        response = session.get(url, timeout=30)
        response.raise_for_status()
        return response.text

    except requests.exceptions.HTTPError as e:
        status = e.response.status_code if e.response else "N/A"
        if status == 429:
            logger.warning(f"429 Too Many Requests — 30 soniya kutish...")
            delay(30)
            return None
        elif status == 404:
            logger.debug(f"404 — Sahifa topilmadi: {url}")
            return None
        else:
            logger.error(f"HTTP {status} xatosi: {url} — {e}")
            return None

    except requests.exceptions.ConnectionError:
        logger.error(f"Ulanish xatosi: {url}")
        delay(5)
        return None

    except requests.exceptions.Timeout:
        logger.error(f"Vaqt tugadi: {url}")
        return None

    except Exception as e:
        logger.error(f"Kutilmagan xato: {url} — {e}")
        return None


def scrape_list_page(
    session: requests.Session,
    page: int,
    delay_sec: float,
    logger,
):
    """Scrape a single listing page."""
    if page == 1:
        url = BASE_URL
    else:
        url = f"{BASE_URL}/?page={page}"
    html = fetch_page(session, url, logger)

    if not html:
        return [], {"page": page, "lastPage": 1, "total": 0, "perPage": 6}

    books, pagination = parse_list_page(html, page)
    delay(delay_sec)

    return books, pagination


def scrape_detail(
    session: requests.Session,
    book: Book,
    delay_sec: float,
    logger,
) -> None:
    """Enrich a book with detail page data (description, category, pages)."""
    url = book.kitob_sahifasi_url
    html = fetch_page(session, url, logger)

    if not html:
        return

    detail = parse_detail_page(html, book.kitob_id)
    if detail:
        if detail.get("tavsif"):
            book.tavsif = detail["tavsif"]
        if detail.get("kategoriya"):
            book.kategoriya = detail["kategoriya"]
        if detail.get("sahifalar_soni"):
            book.sahifalar_soni = detail["sahifalar_soni"]
        if detail.get("nashr_yili") and not book.nashr_yili:
            book.nashr_yili = detail["nashr_yili"]

    delay(delay_sec)


def main():
    parser = argparse.ArgumentParser(
        description="library.ziyonet.uz kitoblar skraperi"
    )
    parser.add_argument(
        "--pages",
        type=int,
        default=5,
        help="Skanerlash kerak bo'lgan sahifalar soni (default: 5)",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=1.5,
        help="So'rovlar orasidagi kutish vaqti (soniya, default: 1.5)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="./data",
        help="Chiqish fayllari papkasi (default: ./data)",
    )
    parser.add_argument(
        "--detail",
        action="store_true",
        help="Har bir kitob uchun detail sahifasini ham skanerlash (sekinroq)",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Batafsil logging chiqarish",
    )

    args = parser.parse_args()
    logger = setup_logging(args.verbose)

    logger.info("=" * 50)
    logger.info("library.ziyonet.uz SKRAPERI BOSHLANMOQDA")
    logger.info("=" * 50)
    logger.info(f"Sahifalar soni: {args.pages}")
    logger.info(f"Kutish vaqti: {args.delay}s")
    logger.info(f"Chiqish papkasi: {args.output}")
    detail_label = "Ha" if args.detail else "Yo'q"
    logger.info(f"Detail sahifalar: {detail_label}")
    logger.info("")

    session = create_session()
    all_books = []  # type: list[Book]
    total_pagination = {"lastPage": args.pages, "total": 0}

    # Phase 1: Scrape listing pages
    logger.info("1-FAZA: Kitoblar ro'yxatini yig'ish")
    logger.info("-" * 40)

    for page in tqdm(range(1, args.pages + 1), desc="Sahifalar", unit="sahifa"):
        books, pagination = scrape_list_page(session, page, args.delay, logger)

        if page == 1:
            total_pagination = pagination
            logger.info(
                f"Jami sahifalar: {pagination.get('lastPage', '?')} | "
                f"Jami kitoblar: {pagination.get('total', '?')}"
            )

        log_page(
            page,
            min(args.pages, total_pagination.get("lastPage", args.pages)),
            len(books),
            logger,
        )
        all_books.extend(books)

    logger.info("")
    logger.info(f"1-faza tugadi: {len(all_books)} ta kitob yig'ildi")

    # Phase 2: Enrich with detail pages (optional)
    if args.detail and all_books:
        logger.info("")
        logger.info("2-FAZA: Kitob tafsilotlarini yig'ish")
        logger.info("-" * 40)

        for book in tqdm(all_books, desc="Tafsilotlar", unit="kitob"):
            scrape_detail(session, book, args.delay, logger)

    # Phase 3: Export
    logger.info("")
    logger.info("3-FAZA: Ma'lumotlarni saqlash")
    logger.info("-" * 40)

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    json_path = output_dir / "books.json"
    csv_path = output_dir / "books.csv"

    books_data = [b.to_dict() for b in all_books]

    save_json(books_data, str(json_path))
    logger.info(f"JSON saqlandi: {json_path} ({len(books_data)} ta kitob)")

    save_csv(books_data, str(csv_path))
    logger.info(f"CSV saqlandi: {csv_path}")

    print_summary(books_data)
    logger.info("SKRAPER TO'LIQ TUGADI!")


if __name__ == "__main__":
    main()
