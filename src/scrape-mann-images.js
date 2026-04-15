/**
 * MANN-FILTER Ürün Resim URL Scraper
 * 
 * Kullanım:
 *   node scrape-mann-images.js
 * 
 * products.json dosyasını okur, her ürünün MANN sitesindeki sayfasını çeker,
 * resim URL'sini bulur ve products.json'ı mann_url ile güncelleyerek kaydeder.
 * 
 * Not: products.json bu script ile aynı klasörde olmalı.
 */

const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, 'products.json');
const OUTPUT_FILE = path.join(__dirname, 'products.json');

// MANN ürün kodundan sayfa URL'si oluştur
function buildPageUrl(code) {
  const c = code.split(" / ")[0].replace(/\s+/g, "").toLowerCase();
  return `https://www.mann-filter.com/en/catalog/international/search-results/product.html/${c}_mann-filter.html`;
}

// HTML'den scene7 resim URL'sini çıkar
function extractImageUrl(html) {
  // "filter-with-box" içeren scene7 URL'lerini ara
  const regex = /https:\/\/s7g10\.scene7\.com\/is\/image\/mannhummel\/[^\s"']+filter-with-box[^\s"']*/g;
  const matches = html.match(regex);
  if (matches && matches.length > 0) {
    let url = matches[0];
    url = url.replace(/[)"'\s]+$/, '');
    return url;
  }
  return null;
}

// Bir URL'yi fetch et (basit retry mekanizması ile)
async function fetchPage(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      });
      if (response.ok) {
        return await response.text();
      }
      console.log(`  ⚠ HTTP ${response.status} for ${url}`);
    } catch (err) {
      if (i < retries) {
        console.log(`  ↻ Retry ${i + 1} for ${url}`);
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
  }
  return null;
}

async function main() {
  const raw = fs.readFileSync(INPUT_FILE, 'utf-8');
  const products = JSON.parse(raw);

  const uniqueCodes = [...new Set(products.map(p => p.mann))];
  const alreadyHaveUrl = new Set(
    products.filter(p => p.mann_url).map(p => p.mann)
  );

  const toScrape = uniqueCodes.filter(c => !alreadyHaveUrl.has(c));
  console.log(`\n📦 Toplam ürün: ${products.length}`);
  console.log(`🔑 Benzersiz MANN kodu: ${uniqueCodes.length}`);
  console.log(`✅ Zaten URL'si olan: ${alreadyHaveUrl.size}`);
  console.log(`🔍 Scrape edilecek: ${toScrape.length}\n`);

  const imageMap = {};

  // Zaten olan URL'leri map'e ekle
  products.forEach(p => {
    if (p.mann_url) imageMap[p.mann] = p.mann_url;
  });

  for (let i = 0; i < toScrape.length; i++) {
    const code = toScrape[i];
    const pageUrl = buildPageUrl(code);
    const progress = `[${i + 1}/${toScrape.length}]`;

    process.stdout.write(`${progress} ${code} ... `);

    const html = await fetchPage(pageUrl);
    if (html) {
      const imgUrl = extractImageUrl(html);
      if (imgUrl) {
        imageMap[code] = imgUrl;
        console.log(`✅ Bulundu`);
      } else {
        console.log(`❌ Resim bulunamadı`);
      }
    } else {
      console.log(`❌ Sayfa yüklenemedi`);
    }

    // Rate limit - 500ms bekle
    await new Promise(r => setTimeout(r, 500));
  }

  // products.json güncelle
  const updated = products.map(p => {
    if (imageMap[p.mann] && !p.mann_url) {
      return { mann: p.mann, mann_url: imageMap[p.mann], filtron: p.filtron };
    }
    return p;
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(updated, null, 2), 'utf-8');

  const found = Object.keys(imageMap).length;
  console.log(`\n✅ Tamamlandı!`);
  console.log(`📸 Toplam resim URL: ${found} / ${uniqueCodes.length}`);
  console.log(`💾 ${OUTPUT_FILE} güncellendi.\n`);
}

main().catch(err => {
  console.error('Hata:', err);
  process.exit(1);
});