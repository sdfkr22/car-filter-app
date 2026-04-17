const fs = require("fs");

// ============================================================
// Kullanım:
//   node add_mann.js <mann_listesi.txt> [products.json]
//
// mann_listesi.txt formatı (her satırda bir MANN kodu):
//   C 15 250
//   C 3210
//   C 34 002
//   ...
// ============================================================

const listFile = process.argv[2];
const jsonFile = process.argv[3] || "products.json";

if (!listFile) {
  console.error("Kullanım: node add_mann.js <mann_listesi.txt> [products.json]");
  process.exit(1);
}

// --- 1) MANN listesini oku ---
const lines = fs.readFileSync(listFile, "utf-8")
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l.length > 0);

console.log(`✓ Listeden ${lines.length} MANN kodu okundu.`);

// --- 2) products.json oku ---
let products = [];
if (fs.existsSync(jsonFile)) {
  products = JSON.parse(fs.readFileSync(jsonFile, "utf-8"));
}
console.log(`✓ ${jsonFile} dosyasından ${products.length} mevcut ürün okundu.`);

// Normalize
function normalize(str) {
  return String(str).trim().replace(/\s+/g, " ").toUpperCase();
}

// Mevcut MANN kodları seti
const existing = new Set(products.map((p) => normalize(p.mann)));

// --- 3) Tüm mevcut ürünlere filtron_url yoksa ekle ---
let fixedUrl = 0;
for (const product of products) {
  if (!product.hasOwnProperty("filtron_url")) {
    product.filtron_url = "";
    fixedUrl++;
  }
}

// --- 4) Yeni ürünleri ekle ---
let added = 0;
let skipped = 0;
for (const mann of lines) {
  if (existing.has(normalize(mann))) {
    skipped++;
    continue;
  }
  products.push({
    mann: mann,
    mann_url: "",
    filtron: "",
    filtron_url: ""
  });
  existing.add(normalize(mann));
  added++;
}

// --- 5) Kaydet ---
fs.writeFileSync(jsonFile, JSON.stringify(products, null, 2), "utf-8");

console.log(`\n--- Sonuç ---`);
console.log(`✓ ${added} yeni ürün eklendi.`);
console.log(`○ ${skipped} ürün zaten mevcut, atlandı.`);
console.log(`✓ ${fixedUrl} mevcut ürüne filtron_url alanı eklendi.`);
console.log(`Toplam: ${products.length} ürün.`);
