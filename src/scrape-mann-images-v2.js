/**
 * MANN-FILTER Ürün Resim URL Scraper v2
 * 
 * Kullanım:
 *   node scrape-mann-images-v2.js
 * 
 * Geliştirmeler:
 *   - Birden fazla bölge URL'si dener (en, ph-en, br-pt, tr-tr, us-en)
 *   - Daha geniş resim URL pattern eşleştirmesi
 *   - Bulunamayan ürünleri raporlar
 */

const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, 'products.json');
const OUTPUT_FILE = path.join(__dirname, 'products.json');
const REPORT_FILE = path.join(__dirname, 'scrape-report.txt');

// Farklı bölge URL pattern'leri
const REGIONS = [
  { prefix: 'en/catalog/international/search-results/product.html', },
  { prefix: 'ph-en/catalog/search-results/product.html' },
  { prefix: 'us-en/catalog/search-results/product.html' },
  { prefix: 'tr-tr/katalog/arama-sonuclar%C4%B1/urun.html' },
  { prefix: 'br-pt/catalogo/resultados-da-pesquisa/produto.html' },
];

function buildPageUrls(code) {
  const c = code.split(" / ")[0].replace(/\s+/g, "").toLowerCase();
  return REGIONS.map(r => `https://www.mann-filter.com/${r.prefix}/${c}_mann-filter.html`);
}

// HTML'den scene7 resim URL'sini çıkar (daha geniş pattern)
function extractImageUrl(html) {
  // 1) "filter-with-box" pattern
  const regex1 = /https:\/\/s7g10\.scene7\.com\/is\/image\/mannhummel\/[^\s"'<>]+filter-with-box[^\s"'<>]*/g;
  const matches1 = html.match(regex1);
  if (matches1 && matches1.length > 0) {
    return cleanUrl(matches1[0]);
  }

  // 2) Herhangi bir "Product Image" alt text'li scene7 URL
  const regex2 = /https:\/\/s7g10\.scene7\.com\/is\/image\/mannhummel\/[A-Z0-9_.\-]+[^\s"'<>]*/gi;
  const matches2 = html.match(regex2);
  if (matches2) {
    // Menü/logo/genel görselleri filtrele
    const productImgs = matches2.filter(u => 
      !u.includes('logo') && 
      !u.includes('catalog-mockup') && 
      !u.includes('dealer') && 
      !u.includes('contact') && 
      !u.includes('teaser') &&
      !u.includes('merchandis') &&
      !u.includes('visual-explosion') &&
      !u.includes('online-catalog') &&
      !u.includes('hydraulics') &&
      !u.includes('webshop')
    );
    if (productImgs.length > 0) {
      return cleanUrl(productImgs[0]);
    }
  }

  return null;
}

function cleanUrl(url) {
  return url.replace(/[)"'\s]+$/, '').replace(/&amp;/g, '&');
}

async function fetchPage(url, retries = 1) {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html',
        }
      });
      clearTimeout(timeout);
      if (response.ok) return await response.text();
    } catch (err) {
      if (i < retries) await new Promise(r => setTimeout(r, 800));
    }
  }
  return null;
}

async function main() {
  const raw = fs.readFileSync(INPUT_FILE, 'utf-8');
  const products = JSON.parse(raw);

  const uniqueCodes = [...new Set(products.map(p => p.mann))];
  const alreadyHaveUrl = new Set(products.filter(p => p.mann_url).map(p => p.mann));
  const toScrape = uniqueCodes.filter(c => !alreadyHaveUrl.has(c));

  console.log(`\n📦 Toplam: ${products.length} | Benzersiz: ${uniqueCodes.length} | Zaten var: ${alreadyHaveUrl.size} | Kalan: ${toScrape.length}\n`);

  const imageMap = {};
  const notFound = [];
  products.forEach(p => { if (p.mann_url) imageMap[p.mann] = p.mann_url; });

  for (let i = 0; i < toScrape.length; i++) {
    const code = toScrape[i];
    const urls = buildPageUrls(code);
    const progress = `[${i + 1}/${toScrape.length}]`;
    process.stdout.write(`${progress} ${code} ... `);

    let found = false;
    for (const url of urls) {
      const html = await fetchPage(url);
      if (html) {
        const imgUrl = extractImageUrl(html);
        if (imgUrl) {
          imageMap[code] = imgUrl;
          console.log(`✅`);
          found = true;
          break;
        }
      }
      await new Promise(r => setTimeout(r, 300));
    }

    if (!found) {
      notFound.push(code);
      console.log(`❌ (${REGIONS.length} bölge denendi)`);
    }

    await new Promise(r => setTimeout(r, 400));
  }

  // Güncelle ve kaydet
  const updated = products.map(p => {
    if (imageMap[p.mann] && !p.mann_url) {
      return { mann: p.mann, mann_url: imageMap[p.mann], filtron: p.filtron };
    }
    return p;
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(updated, null, 2), 'utf-8');

  // Rapor
  const report = `Scrape Raporu\n${'='.repeat(40)}\nToplam: ${uniqueCodes.length}\nBulunan: ${Object.keys(imageMap).length}\nBulunamayan: ${notFound.length}\n\nBulunamayan ürünler:\n${notFound.map(c => `  - ${c}`).join('\n')}\n`;
  fs.writeFileSync(REPORT_FILE, report, 'utf-8');

  console.log(`\n✅ Tamamlandı! ${Object.keys(imageMap).length}/${uniqueCodes.length} resim bulundu`);
  console.log(`❌ ${notFound.length} ürün bulunamadı (detay: scrape-report.txt)`);
  console.log(`💾 ${OUTPUT_FILE} güncellendi.\n`);
}

main().catch(err => { console.error('Hata:', err); process.exit(1); });