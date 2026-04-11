import { useState, useMemo, useRef } from "react";

import DB from './mann-filter-data.json';

const FILTER_TYPES = {
  oil: { label: "Yağ Filtresi", icon: "🛢️", color: "#f59e0b" },
  air: { label: "Hava Filtresi", icon: "💨", color: "#3b82f6" },
  cabin: { label: "Kabin Filtresi", icon: "🌿", color: "#10b981" },
  fuel: { label: "Yakıt Filtresi", icon: "⛽", color: "#ef4444" },
};

function buildUrl(code) {
  if (!code) return null;
  const c = code.split(" / ")[0].replace(/\s+/g,"").toLowerCase();
  return "https://www.mann-filter.com/tr-tr/katalog/arama-sonuclar%C4%B1/urun.html/" + c + "_mann-filter.html";
}

export default function App() {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [power, setPower] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [tab, setTab] = useState("vehicle");
  const ref = useRef(null);

  const makes = useMemo(() => [...new Set(DB.map(d => d.make))].sort(), []);
  const models = useMemo(() => make ? [...new Set(DB.filter(d => d.make === make).map(d => d.model))].sort() : [], [make]);
  const powers = useMemo(() => (make && model) ? DB.filter(d => d.make === make && d.model === model).map(d => ({ kw: d.kw, ps: d.ps, engine: d.engine, label: d.engine + " — " + d.ps + " PS / " + d.kw + " kW" })) : [], [make, model]);
  const results = useMemo(() => {
    if (!make || !model) return [];
    let filtered = DB.filter(d => d.make === make && d.model === model);
    if (power) filtered = filtered.filter(d => d.engine + " — " + d.ps + " PS / " + d.kw + " kW" === power);
    return filtered;
  }, [make, model, power]);

  const handleMake = v => { setMake(v); setModel(""); setPower(""); };
  const handleModel = v => { setModel(v); setPower(""); };

  return (
    <div style={{ minHeight: "100vh", background: "#090909", color: "#e5e5e5", fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      <header style={{ background: "#111", borderBottom: "1px solid #222", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 4, height: 32, borderRadius: 2, background: "linear-gradient(180deg,#78a22f,#f5c518)" }} />
          <span style={{ fontWeight: 700, fontSize: 17 }}>MANN<span style={{ color: "#78a22f" }}>-FILTER</span></span>
          <span style={{ fontSize: 12, color: "#666", marginLeft: 4 }}>Filtre Sorgulama</span>
        </div>
        <a href="https://www.mann-filter.com/tr-tr/katalog.html" target="_blank" rel="noopener" style={{ fontSize: 11, color: "#78a22f", textDecoration: "none", padding: "5px 12px", border: "1px solid #333", borderRadius: 6, fontWeight: 600 }}>Resmi Katalog ↗</a>
      </header>

      <div style={{ background: "linear-gradient(135deg,#111a08,#090909 50%,#141200)", padding: "36px 20px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: "clamp(22px,4vw,34px)", fontWeight: 700, marginBottom: 6 }}>Aracınıza Uygun <span style={{ color: "#78a22f" }}>Filtreyi</span> Bulun</h1>
        <p style={{ color: "#777", fontSize: 13, maxWidth: 480, margin: "0 auto" }}>MANN-FILTER 2024-26 kataloğu — {DB.length} araç-motor eşleşmesi, {makes.length} marka</p>
      </div>

      <div style={{ display: "flex", justifyContent: "center", padding: "14px 16px 0" }}>
        <div style={{ display: "flex", gap: 2, background: "#1a1a1a", borderRadius: 8, padding: 3 }}>
          {[{ id: "vehicle", l: "🚗 Araç Seçimi" }, { id: "product", l: "🔍 Ürün Kodu" }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "8px 16px", fontSize: 13, fontWeight: tab === t.id ? 700 : 400, border: "none", borderRadius: 6, cursor: "pointer", background: tab === t.id ? "#78a22f" : "transparent", color: tab === t.id ? "#090909" : "#777" }}>{t.l}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "14px 16px 60px" }}>
        {tab === "vehicle" && (
          <div>
            <div style={{ background: "#131313", border: "1px solid #222", borderRadius: 12, padding: 22, marginTop: 6 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>Araç Bilgilerini Seçin</h3>
              <p style={{ color: "#555", fontSize: 11, marginBottom: 16 }}>Marka, model ve motor gücü seçerek uyumlu filtreleri görüntüleyin</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10, marginBottom: 16 }}>
                <Sel label="MARKA" value={make} onChange={handleMake} options={makes} ph="Marka seçin..." />
                <Sel label="MODEL" value={model} onChange={handleModel} options={models} ph={make ? "Model seçin..." : "Önce marka seçin"} disabled={!make} />
                <Sel label="MOTOR / GÜÇ (PS / kW)" value={power} onChange={setPower} options={powers.map(p => p.label)} ph={model ? "Motor seçin (opsiyonel)" : "Önce model seçin"} disabled={!model} />
              </div>
              {make && model && <p style={{ fontSize: 12, color: "#78a22f" }}>{results.length} sonuç bulundu</p>}
            </div>

            {results.length > 0 && (
              <div ref={ref} style={{ marginTop: 16 }}>
                {results.map((r, ri) => (
                  <div key={ri} style={{ background: "#131313", border: "1px solid #222", borderRadius: 12, padding: 20, marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <div style={{ width: 7, height: 7, background: "#78a22f", borderRadius: "50%" }} />
                      <h3 style={{ fontSize: 14, fontWeight: 700 }}>{r.make} {r.model} — {r.engine}</h3>
                      <span style={{ fontSize: 11, color: "#78a22f", marginLeft: "auto", background: "#1a2a10", padding: "3px 10px", borderRadius: 12 }}>{r.ps} PS / {r.kw} kW</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
                      {[
                        { key: "oil", code: r.oil },
                        { key: "air", code: r.air },
                        { key: "cabin", code: r.cabin },
                        { key: "fuel", code: r.fuel },
                      ].filter(f => f.code).map((f, fi) => {
                        const info = FILTER_TYPES[f.key];
                        const url = buildUrl(f.code);
                        const Tag = url ? "a" : "div";
                        return (
                          <Tag key={fi} href={url || undefined} target="_blank" rel="noopener"
                            style={{ background: "#0e0e0e", border: "1px solid #1e1e1e", borderRadius: 8, padding: 14, textDecoration: "none", color: "#e5e5e5", transition: "all .2s", display: "block" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = info.color; e.currentTarget.style.transform = "translateY(-1px)"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1e1e"; e.currentTarget.style.transform = "none"; }}>
                            <div style={{ fontSize: 18, marginBottom: 4 }}>{info.icon}</div>
                            <div style={{ fontSize: 10, fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: 1 }}>{info.label}</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: info.color, margin: "2px 0" }}>{f.code}</div>
                            {url && <div style={{ fontSize: 10, color: "#78a22f", marginTop: 4 }}>Katalogda Gör ↗</div>}
                          </Tag>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "product" && (
          <div>
            <div style={{ background: "#131313", border: "1px solid #222", borderRadius: 12, padding: 22, marginTop: 6 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>Ürün Kodu ile Arama</h3>
              <p style={{ color: "#555", fontSize: 11, marginBottom: 16 }}>MANN-FILTER parça numarası girerek resmi katalogda ürünü açın</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input value={productSearch} onChange={e => setProductSearch(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { const u = buildUrl(productSearch.trim()); if (u) window.open(u, "_blank"); }}} placeholder="Örn: HU 719/7 x, W 712/95, CUK 2939" style={{ flex: "1 1 220px", padding: "10px 12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, color: "#e5e5e5", fontSize: 13, outline: "none" }} />
                <button onClick={() => { const u = buildUrl(productSearch.trim()); if (u) window.open(u, "_blank"); }} style={{ padding: "10px 18px", background: "#78a22f", color: "#090909", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Katalogda Ara ↗</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 10 }}>
                {["HU 719/7 x","W 712/95","C 30 005","CUK 2939","HU 7020 z","PU 8014","HU 816 x","CU 25 001","WK 69/2","HU 7008 z","C 35 154","HU 6013 z","HU 618 y","HU 7048 z"].map(c => (
                  <button key={c} onClick={() => setProductSearch(c)} style={{ padding: "3px 9px", background: "#1a1a1a", border: "1px solid #252525", borderRadius: 14, color: "#777", fontSize: 10, cursor: "pointer" }}>{c}</button>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, marginTop: 14 }}>
              {Object.entries(FILTER_TYPES).map(([k, info]) => (
                <a key={k} href={"https://www.mann-filter.com/tr-tr/urunler/" + (k === "oil" ? "yag-filtresi" : k === "air" ? "hava-filtresi" : k === "cabin" ? "kabin-filtresi" : "yakit-filtresi") + ".html"} target="_blank" rel="noopener" style={{ background: "#131313", border: "1px solid #222", borderRadius: 10, padding: 16, textDecoration: "none", color: "#e5e5e5", transition: "border-color .2s" }} onMouseEnter={e => e.currentTarget.style.borderColor = info.color} onMouseLeave={e => e.currentTarget.style.borderColor = "#222"}>
                  <div style={{ fontSize: 22, marginBottom: 5 }}>{info.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{info.label}</div>
                  <div style={{ fontSize: 10, color: "#666" }}>Resmi sayfayı görüntüle ↗</div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer style={{ borderTop: "1px solid #1a1a1a", padding: "14px 20px", textAlign: "center", fontSize: 10, color: "#444" }}>
        Veriler <a href="https://www.mann-filter.com/tr-tr/katalog.html" target="_blank" rel="noopener" style={{ color: "#78a22f", textDecoration: "none" }}>MANN-FILTER 2024-26 Kataloğu</a> PDF'inden çıkarılmıştır. Kartlara tıklayarak resmi katalog sayfasına ulaşabilirsiniz.
      </footer>
    </div>
  );
}

function Sel({ label, value, onChange, options, ph, disabled }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{label}</div>
      <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled} style={{ width: "100%", padding: "9px 11px", background: disabled ? "#0e0e0e" : "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 6, color: disabled ? "#333" : "#e5e5e5", fontSize: 13, outline: "none", cursor: disabled ? "not-allowed" : "pointer", appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23555' viewBox='0 0 16 16'%3E%3Cpath d='M4.5 6l3.5 4 3.5-4z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", paddingRight: 26 }}>
        <option value="">{ph}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
