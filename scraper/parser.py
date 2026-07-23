"""
HTML parser for library.ziyonet.uz.

Extracts book data from __NEXT_DATA__ JSON embedded in page HTML.
"""

import json
import re
import logging
from typing import Optional, Tuple, List
from bs4 import BeautifulSoup

from models import Book

logger = logging.getLogger("scraper")

BASE_URL = "https://library.ziyonet.uz"
DEFAULT_COVER = "https://api.ziyonet.uz/images/default/default_cover.png"


def extract_next_data(html: str) -> Optional[dict]:
    """
    Extract __NEXT_DATA__ JSON from page HTML.
    This is the primary data source for Next.js SSR pages.
    """
    soup = BeautifulSoup(html, "html.parser")
    script = soup.find("script", id="__NEXT_DATA__")
    if script and script.string:
        try:
            return json.loads(script.string)
        except json.JSONDecodeError as e:
            logger.warning(f"__NEXT_DATA__ JSON parse xatosi: {e}")
    return None


def parse_list_page(html: str, page: int) -> Tuple[List[Book], dict]:
    """
    Parse a library listing page.
    Returns (list_of_books, pagination_info).
    """
    books = []
    pagination = {"page": 1, "lastPage": 1, "total": 0, "perPage": 6}

    data = extract_next_data(html)
    if not data:
        logger.warning(f"Sahifa {page}: __NEXT_DATA__ topilmadi")
        return books, pagination

    try:
        props = data.get("props", {}).get("pageProps", {})
        books_obj = props.get("books", {})

        # Pagination info
        pagination_raw = books_obj.get("pagination", {})
        pagination = {
            "page": pagination_raw.get("page", page),
            "lastPage": pagination_raw.get("lastPage", 1),
            "total": pagination_raw.get("total", 0),
            "perPage": pagination_raw.get("perPage", 6),
        }

        # Books list
        items = books_obj.get("data", [])

        for item in items:
            book = _parse_book_from_list(item)
            if book:
                books.append(book)

    except Exception as e:
        logger.error(f"Sahifa {page} parse xatosi: {e}")

    return books, pagination


def parse_detail_page(html: str, book_id: int) -> Optional[dict]:
    """
    Parse a book detail page to get additional info (description, category, pages).
    Returns a dict with extra fields.
    """
    data = extract_next_data(html)
    if not data:
        return None

    try:
        props = data.get("props", {}).get("pageProps", {})
        detail_obj = props.get("bookDetail", {}).get("data", {})

        result = {}

        # Description
        desc = detail_obj.get("description", "")
        if desc:
            result["tavsif"] = _clean_html(str(desc))

        # Categories
        categories = detail_obj.get("category", [])
        if categories and isinstance(categories, list):
            cat_names = [c.get("name", "") for c in categories if isinstance(c, dict)]
            result["kategoriya"] = ", ".join(cat_names) if cat_names else ""

        # Pages
        pages = detail_obj.get("pages", "")
        if pages:
            result["sahifalar_soni"] = str(pages)

        # Publisher
        pub = detail_obj.get("publishment", "")
        if pub:
            result["nashriyot"] = str(pub)

        # Issued year
        issued = detail_obj.get("issued_at", "")
        if issued:
            result["nashr_yili"] = str(issued)

        return result

    except Exception as e:
        logger.debug(f"Detail page {book_id} parse xatosi: {e}")
        return None


def _parse_book_from_list(item: dict) -> Optional[Book]:
    """Parse a single book from list page data."""
    try:
        book_id = item.get("id")
        if not book_id:
            return None

        title = item.get("title", "Noma'lum")
        author = item.get("author", "Noma'lum")
        book_type = item.get("type", "")
        level = item.get("level", "")
        cover = item.get("cover", DEFAULT_COVER) or DEFAULT_COVER
        file_url = item.get("file", "")
        rating = item.get("rating", 0) or 0
        created = item.get("created_at", "")
        published = item.get("published_at", "")

        # Determine language from title/author (heuristic)
        lang = _detect_language(title + " " + author)

        return Book(
            kitob_id=book_id,
            kitob_nomi=_clean_text(title),
            muallif=_clean_text(author),
            kategoriya="",  # Filled from detail page
            tavsif="",  # Filled from detail page
            til=lang,
            nashr_yili=str(published) if published else None,
            muqova_rasmi_url=cover if cover else DEFAULT_COVER,
            kitob_sahifasi_url=f"{BASE_URL}/book/{book_id}",
            pdf_yuklab_olish_url=file_url if file_url else None,
            tur=book_type,
            daraja=level,
            reyting=float(rating),
            yaratilgan=created,
        )
    except Exception as e:
        logger.debug(f"Book parse xatosi: {e}")
        return None


def _clean_text(text: str) -> str:
    """Clean and normalize text content."""
    if not text:
        return ""
    # Remove extra whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _clean_html(html: str) -> str:
    """Remove HTML tags from text."""
    if not html:
        return ""
    soup = BeautifulSoup(html, "html.parser")
    return soup.get_text(separator=" ", strip=True)


def _detect_language(text: str) -> str:
    """Detect language from text content using character analysis."""
    if not text:
        return "Noma'lum"

    # Count Cyrillic characters
    cyrillic = sum(1 for c in text if "\u0400" <= c <= "\u04FF")

    # Count Latin characters (basic Latin + extended)
    latin = sum(1 for c in text if "a" <= c.lower() <= "z")

    if cyrillic > latin:
        return "Rus"
    elif latin > 0:
        return "O'zbek"
    else:
        return "Noma'lum"
