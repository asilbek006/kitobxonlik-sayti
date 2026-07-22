# Library.ziyonet.uz Scraper

[library.ziyonet.uz](https://library.ziyonet.uz) saytidan kitoblar ma'lumotlarini yig'uvchi Python skraperi.

## O'rnatish

```bash
cd scraper
pip install -r requirements.txt
```

## Ishlatish

### Oddiy ishga tushirish (5 sahifa)

```bash
python main.py
```

### 100 sahifa skanerlash

```bash
python main.py --pages 100
```

### Batafsil logging bilan

```bash
python main.py --pages 10 --verbose
```

### Detail sahifalar ham (kategoriya, tavsif, sahifalar soni)

```bash
python main.py --pages 50 --detail
```

### Barcha variantlar

```bash
python main.py --pages 200 --delay 2 --output ./my_data --detail --verbose
```

## Parametrlar

| Parametr | Default | Tavsif |
|----------|---------|--------|
| `--pages` | 5 | Skanerlash kerak bo'lgan sahifalar soni |
| `--delay` | 1.5 | So'rovlar orasidagi kutish vaqti (soniya) |
| `--output` | ./data | Chiqish fayllari papkasi |
| `--detail` | Yo'q | Detail sahifalarni ham skanerlash |
| `--verbose` | Yo'q | Batafsil logging |

## Chiqish fayllari

- `books.json` — JSON formatida barcha kitoblar
- `books.csv` — CSV formatida (Excel bilan ochish mumkin)

## Yig'iladigan ma'lumotlar

| Maydon | Tavsif |
|--------|--------|
| `kitob_id` | Kitob ID raqami |
| `kitob_nomi` | Kitob nomi |
| `muallif` | Muallif |
| `kategoriya` | Kategoriya (detail sahifadan) |
| `tavsif` | Tavsif (detail sahifadan) |
| `til` | Til (avtomatik aniqlash) |
| `nashr_yili` | Nashr yili |
| `muqova_rasmi_url` | Muqova rasm URL |
| `kitob_sahifasi_url` | Kitob sahifasi URL |
| `pdf_yuklab_olish_url` | PDF yuklab olish URL |
| `tur` | Kitob turi |
| `daraja` | Ta'lim darajasi |
| `sahifalar_soni` | Sahifalar soni (detail) |
| `reyting` | Reyting (0-5) |
| `yaratilgan` | Yaratilgan sana |

## Eslatmalar

- Sayt Next.js asosida qurilgan, ma'lumotlar `__NEXT_DATA__` JSON dan olinadi
- Har bir so'rov orasida kechikish qo'yilgan (1.5s default)
- 429 xatosi avtomatik ushlanadi va 30 soniya kutadi
- Faqat ochiq ma'lumotlar yig'iladi
