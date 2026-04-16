const fs = require("fs");
const XLSX = require("xlsx");

// ============================================================
// Kullanım:
//   node update_filtron.js <mapping_excel> [products_json]
//
// Parametreler:
//   mapping_excel  : MANN → Filtron eşleştirmelerini içeren Excel dosyası
//                    İlk sütun: MANN kodu, İkinci sütun: Filtron kodu
//   products_json  : (opsiyonel) Güncellenecek JSON dosyası, varsayılan: products.json
//
// Excel formatı (ilk satır başlık):
//   mann          filtron
//   C 3210        AP 035/4
//   C 34 002      AP 158/6
//   ...
// ============================================================

const mappingFile = process.argv[2];
const jsonFile = process.argv[3] || "products.json";

if (!mappingFile) {
  console.error("Kullanım: node update_filtron.js <mapping_excel> [products_json]");
  console.error("Örnek:   node update_filtron.js mann_filtron.xlsx products.json");
  process.exit(1);
}

// --- 1) Excel'den MANN → Filtron eşleştirmesini oku ---
const wb = XLSX.readFile(mappingFile);
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

// Sütun isimlerini normalize et (büyük/küçük harf, boşluk farketmez)
function findColumn(obj, keywords) {
  return Object.keys(obj).find((k) =>
    keywords.some((kw) => k.trim().toLowerCase().includes(kw))
  );
}

const sampleRow = rows[0];
const mannCol = findColumn(sampleRow, ["mann"]);
const filtronCol = findColumn(sampleRow, ["filtron"]);

if (!mannCol || !filtronCol) {
  console.error("Excel'de 'mann' ve 'filtron' sütunları bulunamadı.");
  console.error("Bulunan sütunlar:", Object.keys(sampleRow));
  process.exit(1);
}

// Normalize: boşlukları tek boşluğa düşür, trim, uppercase
function normalize(str) {
  return String(str).trim().replace(/\s+/g, " ").toUpperCase();
}

// Eşleştirme haritası oluştur
const mapping = {};
for (const row of rows) {
  const mann = normalize(row[mannCol]);
  const filtron = String(row[filtronCol]).trim();
  if (mann && filtron) {
    mapping[mann] = filtron;
  }
}

console.log(`✓ Excel'den ${Object.keys(mapping).length} adet eşleştirme okundu.`);

// --- 2) products.json dosyasını oku ---
if (!fs.existsSync(jsonFile)) {
  console.error(`Hata: ${jsonFile} bulunamadı.`);
  process.exit(1);
}

const products = JSON.parse(fs.readFileSync(jsonFile, "utf-8"));
console.log(`✓ ${jsonFile} dosyasından ${products.length} ürün okundu.`);

// --- 3) Eşleştirmeleri uygula ---
let updated = 0;
let notFound = 0;
const notFoundList = [];

for (const product of products) {
  if (product.filtron && product.filtron.trim() !== "") continue; // zaten dolu, atla
  const mannNorm = normalize(product.mann);
  if (mapping[mannNorm]) {
    product.filtron = mapping[mannNorm];
    updated++;
  } else {
    product.filtron = null;
  }
}

// Excel'deki hangi MANN kodları JSON'da bulunamadı?
for (const [mann, filtron] of Object.entries(mapping)) {
  const found = products.some((p) => normalize(p.mann) === mann);
  if (!found) {
    notFoundList.push(mann);
    notFound++;
  }
}

// --- 4) Güncellenen JSON'u kaydet ---
fs.writeFileSync(jsonFile, JSON.stringify(products, null, 2), "utf-8");

console.log(`\n--- Sonuç ---`);
console.log(`✓ ${updated} ürünün filtron karşılığı güncellendi.`);

if (notFound > 0) {
  console.log(`✗ ${notFound} MANN kodu JSON'da bulunamadı:`);
  notFoundList.forEach((m) => console.log(`  - ${m}`));
}

const emptyFiltron = products.filter((p) => !p.filtron).length;
console.log(`○ ${emptyFiltron} üründe hâlâ filtron karşılığı boş.`);
