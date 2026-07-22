"""
Data models for the library.ziyonet.uz scraper.

Defines dataclasses for representing book data.
"""

from dataclasses import dataclass, field, asdict
from typing import Optional


@dataclass
class Book:
    """Represents a single book from library.ziyonet.uz."""

    kitob_id: int
    kitob_nomi: str
    muallif: str
    kategoriya: str
    tavsif: str
    til: str
    nashr_yili: Optional[str]
    muqova_rasmi_url: str
    kitob_sahifasi_url: str
    pdf_yuklab_olish_url: Optional[str]
    tur: Optional[str] = None
    daraja: Optional[str] = None
    sahifalar_soni: Optional[str] = None
    reyting: float = 0.0
    yaratilgan: Optional[str] = None

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return asdict(self)
