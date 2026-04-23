import pandas as pd
import json
import re

print("SCRIPT BAŞLADI")

EXCEL_FILE = "model_year.xlsx"
JSON_FILE = "mann-filter-data.json"
OUTPUT_FILE = "output.json"


# -----------------------------
# YEAR SHORTENER
# -----------------------------
def shorten_year(value):
    if pd.isna(value):
        return None

    value = str(value).strip()

    match = re.findall(r"\d{4}", value)

    if not match:
        return value

    years = match

    if len(years) == 1:
        return years[0][2:] + value[len(years[0]):]

    shortened = [y[2:] for y in years]

    if "-" in value:
        return f"{shortened[0]}-{shortened[1]}"
    if "→" in value:
        return f"{shortened[0]} →"

    return value


# -----------------------------
# NORMALIZE
# -----------------------------
def norm(x):
    if pd.isna(x):
        return None
    return str(x).strip().upper()


# -----------------------------
# EXCEL READ
# -----------------------------
df = pd.read_excel(EXCEL_FILE)
df.columns = [c.strip().lower() for c in df.columns]

df = df.rename(columns={
    "marka": "make",
    "model": "model",
    "model yılı": "model_year"
})


# -----------------------------
# JSON READ
# -----------------------------
with open(JSON_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

if isinstance(data, dict):
    data = [data]


# -----------------------------
# PROCESS
# -----------------------------
updated = 0

for _, row in df.iterrows():

    make = norm(row.get("make"))
    model = norm(row.get("model"))
    year = row.get("model_year")

    if not make or not model:
        continue

    if pd.isna(year):
        continue

    year = shorten_year(year)

    if not year:
        continue

    # JSON içinde TÜM eşleşmeleri güncelle
    for item in data:

        j_make = norm(item.get("make"))
        j_model = norm(item.get("model"))

        if j_make == make and j_model == model:

            item["model_year"] = year
            updated += 1


# -----------------------------
# SAVE
# -----------------------------
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Tamamlandı. Güncellenen kayıt sayısı: {updated}")