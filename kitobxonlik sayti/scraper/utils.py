"""
Utility functions for the scraper.

Handles JSON/CSV export, logging, and progress display.
"""

import json
import csv
import time
import logging
import sys
from pathlib import Path
from typing import List

from tqdm import tqdm


def setup_logging(verbose: bool = False) -> logging.Logger:
    """Configure logging for the scraper."""
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%H:%M:%S",
        handlers=[logging.StreamHandler(sys.stdout)],
    )
    return logging.getLogger("scraper")


def log_page(page: int, total_pages: int, books_found: int, logger: logging.Logger) -> None:
    """Log current page progress."""
    logger.info(
        f"Sahifa {page}/{total_pages} — {books_found} ta kitob topildi"
    )


def delay(seconds: float = 1.5) -> None:
    """Wait between requests."""
    time.sleep(seconds)


def save_json(books: List[dict], filepath: str) -> None:
    """Save books list to JSON file."""
    path = Path(filepath)
    path.parent.mkdir(parents=True, exist_ok=True)

    with open(path, "w", encoding="utf-8") as f:
        json.dump(books, f, ensure_ascii=False, indent=2)


def save_csv(books: List[dict], filepath: str) -> None:
    """Save books list to CSV file."""
    if not books:
        return

    path = Path(filepath)
    path.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = list(books[0].keys())

    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(books)


def print_summary(books: List[dict]) -> None:
    """Print scraping summary."""
    print("\n" + "=" * 50)
    print("SKRAPER STATISTIKASI")
    print("=" * 50)
    print(f"Jami yig'ilgan kitoblar: {len(books)}")

    if books:
        categories = set()
        for b in books:
            cat = b.get("kategoriya", "Noma'lum")
            if cat:
                categories.add(cat)

        print(f"Kategoriyalar soni: {len(categories)}")

        with_pdf = sum(1 for b in books if b.get("pdf_yuklab_olish_url"))
        print(f"PDF mavjud kitoblar: {with_pdf}")

    print("=" * 50)
