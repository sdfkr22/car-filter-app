import { useState, useMemo, useRef } from "react";

import DB from './mann-filter-data.json';
import PRODUCTS_RAW from './products.json';

// filtron.json: array of { mann, filtron, mann_url? } OR single object — normalize to map
const FILTRON_MAP = (() => {
  const arr = Array.isArray(PRODUCTS_RAW) ? PRODUCTS_RAW : [PRODUCTS_RAW];
  const map = {};
  arr.forEach(({ mann, filtron }) => { if (mann && filtron) map[mann.trim()] = filtron.trim(); });
  return map;
})();

// mann_url map: mann code -> image url
const MANN_IMG_MAP = (() => {
  const arr = Array.isArray(PRODUCTS_RAW) ? PRODUCTS_RAW : [PRODUCTS_RAW];
  const map = {};
  arr.forEach(({ mann, mann_url }) => { if (mann && mann_url) map[mann.trim()] = mann_url.trim(); });
  return map;
})();

const FILTER_TYPES = {
  oil:   { label: "Yağ Filtresi",   icon: "🛢️", color: "#f59e0b" },
  air:   { label: "Hava Filtresi",  icon: "💨", color: "#3b82f6" },
  cabin: { label: "Polen Filtresi", icon: "🌿", color: "#10b981" },
  fuel:  { label: "Yakıt Filtresi", icon: "⛽", color: "#ef4444" },
};

function buildUrl(code) {
  if (!code) return null;
  const c = code.split(" / ")[0].replace(/\s+/g, "").toLowerCase();
  return "https://www.mann-filter.com/tr-tr/katalog/arama-sonuclar%C4%B1/urun.html/" + c + "_mann-filter.html";
}

function buildFiltronUrl(code) {
  if (!code) return null;
  const c = code.replace(/\s+/g, "").toLowerCase();
  return "https://www.filtron.eu/search?q=" + encodeURIComponent(code);
}

function toArray(val) {
  if (val == null) return [];
  return Array.isArray(val) ? val : [val];
}

function findVehiclesByFilter(code) {
  return DB.filter(d =>
    toArray(d.oil).includes(code) ||
    toArray(d.air).includes(code) ||
    toArray(d.cabin).includes(code) ||
    toArray(d.fuel).includes(code)
  );
}

function getFilterType(code) {
  for (const d of DB) {
    if (toArray(d.oil).includes(code)) return "oil";
    if (toArray(d.air).includes(code)) return "air";
    if (toArray(d.cabin).includes(code)) return "cabin";
    if (toArray(d.fuel).includes(code)) return "fuel";
  }
  return null;
}

/* ── Filtron Card ── */
function FiltronCard({ mannCode, filtronCode, filterKey, onOpenModal }) {
  const [hovered, setHovered] = useState(false);
  const info = FILTER_TYPES[filterKey];
  const imgUrl = MANN_IMG_MAP[mannCode];
  return (
    <div style={{ position: "relative" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Hover image popup */}
      {hovered && imgUrl && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
          background: "#1a1a1a", border: "1px solid #333", borderRadius: 10,
          padding: 8, zIndex: 50, boxShadow: "0 8px 32px rgba(0,0,0,.6)",
          pointerEvents: "none", minWidth: 160
        }}>
          <img src={imgUrl} alt={filtronCode} style={{ width: 160, height: "auto", borderRadius: 6, display: "block" }} />
          <div style={{ fontSize: 9, color: "#666", textAlign: "center", marginTop: 4 }}>MANN {mannCode}</div>
          <div style={{
            position: "absolute", bottom: -6, left: "50%",
            width: 12, height: 12, background: "#1a1a1a", border: "1px solid #333",
            borderTop: "none", borderLeft: "none",
            transform: "translateX(-50%) rotate(45deg)"
          }} />
        </div>
      )}
      <div
        onClick={() => onOpenModal(filtronCode, filterKey)}
        style={{
          background: "#0e0e0e",
          border: `1px solid ${hovered ? info.color : "#1e1e1e"}`,
          borderRadius: 8,
          padding: 14,
          cursor: "pointer",
          transition: "all .2s",
          transform: hovered ? "translateY(-1px)" : "none",
          boxShadow: hovered ? "0 4px 16px rgba(0,130,200,0.15)" : "none",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Icon badge top-right */}
        <div style={{
          position: "absolute", top: 0, right: 0,
          background: "#0082c820",
          borderRadius: "0 8px 0 12px",
          padding: "6px 10px",
          fontSize: 20,
          lineHeight: 1,
          border: "1px solid #0082c830",
          borderTop: "none", borderRight: "none"
        }}>
          {info.icon}
        </div>
        {/* Subtle brand watermark */}
        <div style={{
          position: "absolute", bottom: 4, right: 8,
          fontSize: 28, opacity: 0.08, fontWeight: 900,
          color: "#0082c8", pointerEvents: "none", userSelect: "none"
        }}>F</div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 6, background: "#0082c818", padding: "2px 8px 2px 6px", borderRadius: 4, border: "1px solid #0082c825" }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#0082c8" }} />
          <span style={{ fontSize: 9, fontWeight: 800, color: "#0082c8", letterSpacing: 1, textTransform: "uppercase" }}>FILTRON</span>
        </div>
        <div style={{ fontSize: 10, fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: 1 }}>
          {info.label}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#0082c8", margin: "2px 0" }}>
          {filtronCode}
        </div>
        <div style={{ fontSize: 9, color: "#3a6b20", marginTop: 2 }}>
          MANN <span style={{ color: "#555" }}>{mannCode}</span> muadili
        </div>
        <div style={{ fontSize: 10, color: "#666", marginTop: 4 }}>
          Detaylar ve uyumlu araçlar →
        </div>
      </div>
    </div>
  );
}

/* ── Mann Filter Card ── */
function MannCard({ code, filterKey, onOpenModal }) {
  const [hovered, setHovered] = useState(false);
  const info = FILTER_TYPES[filterKey];
  const filtronCode = FILTRON_MAP[code];
  const imgUrl = MANN_IMG_MAP[code];
  return (
    <div style={{ display: "contents" }}>
      <div style={{ position: "relative" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Hover image popup */}
        {hovered && imgUrl && (
          <div style={{
            position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
            background: "#1a1a1a", border: "1px solid #333", borderRadius: 10,
            padding: 8, zIndex: 50, boxShadow: "0 8px 32px rgba(0,0,0,.6)",
            pointerEvents: "none", minWidth: 160
          }}>
            <img src={imgUrl} alt={code} style={{ width: 160, height: "auto", borderRadius: 6, display: "block" }} />
            <div style={{ fontSize: 9, color: "#666", textAlign: "center", marginTop: 4 }}>{code}</div>
            <div style={{
              position: "absolute", bottom: -6, left: "50%",
              width: 12, height: 12, background: "#1a1a1a", border: "1px solid #333",
              borderTop: "none", borderLeft: "none",
              transform: "translateX(-50%) rotate(45deg)"
            }} />
          </div>
        )}
      <div
        onClick={() => onOpenModal(code, filterKey)}
        style={{
          background: "#0e0e0e",
          border: `1px solid ${hovered ? info.color : "#1e1e1e"}`,
          borderRadius: 8,
          padding: 14,
          cursor: "pointer",
          transition: "all .2s",
          transform: hovered ? "translateY(-1px)" : "none",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Icon badge top-right */}
        <div style={{
          position: "absolute", top: 0, right: 0,
          background: "#78a22f20",
          borderRadius: "0 8px 0 12px",
          padding: "6px 10px",
          fontSize: 20,
          lineHeight: 1,
          border: "1px solid #78a22f30",
          borderTop: "none", borderRight: "none"
        }}>
          {info.icon}
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 6, background: "#78a22f18", padding: "2px 8px 2px 6px", borderRadius: 4, border: "1px solid #78a22f25" }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#78a22f" }} />
          <span style={{ fontSize: 9, fontWeight: 800, color: "#78a22f", letterSpacing: 1, textTransform: "uppercase" }}>MANN</span>
        </div>
        <div style={{ fontSize: 10, fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: 1 }}>
          {info.label}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#78a22f", margin: "2px 0" }}>
          {code}
        </div>
        {filtronCode && (
          <div style={{ fontSize: 9, color: "#3a5a7a", marginTop: 2 }}>
            ✓ Filtron muadili mevcut
          </div>
        )}
        <div style={{ fontSize: 10, color: "#666", marginTop: 4 }}>
          Detaylar ve uyumlu araçlar →
        </div>
      </div>
      </div>

      {/* Filtron pair card right after */}
      {filtronCode && (
        <FiltronCard
          mannCode={code}
          filtronCode={filtronCode}
          filterKey={filterKey}
          onOpenModal={onOpenModal}
        />
      )}
    </div>
  );
}

export default function App() {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [power, setPower] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [tab, setTab] = useState("vehicle");
  const [modalCode, setModalCode] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [modalBrand, setModalBrand] = useState("mann"); // "mann" | "filtron"
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

  const modalVehicles = useMemo(() => {
    if (!modalCode) return [];
    // For filtron codes, reverse-map to mann code and find vehicles
    if (modalBrand === "filtron") {
      const mannCode = Object.entries(FILTRON_MAP).find(([m, f]) => f === modalCode)?.[0];
      if (mannCode) return findVehiclesByFilter(mannCode);
      return [];
    }
    return findVehiclesByFilter(modalCode);
  }, [modalCode, modalBrand]);

  const modalGrouped = useMemo(() => {
    const grouped = {};
    modalVehicles.forEach(v => {
      const key = v.make;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(v);
    });
    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  }, [modalVehicles]);

  const handleMake = v => { setMake(v); setModel(""); setPower(""); };
  const handleModel = v => { setModel(v); setPower(""); };
  const openModal = (code, type, brand = "mann") => { setModalCode(code); setModalType(type); setModalBrand(brand); };
  const closeModal = () => { setModalCode(null); setModalType(null); setModalBrand("mann"); };

  const isFiltronModal = modalBrand === "filtron";

  return (
    <div style={{ minHeight: "100vh", background: "#090909", color: "#e5e5e5", fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      <header style={{ background: "#111", borderBottom: "1px solid #222", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 4, height: 32, borderRadius: 2, background: "linear-gradient(180deg,#78a22f,#f5c518)" }} />
          <span style={{ fontWeight: 700, fontSize: 17 }}>MANN<span style={{ color: "#78a22f" }}>-FILTER</span></span>
          <span style={{ fontSize: 10, color: "#555", padding: "2px 8px", background: "#1a1a1a", borderRadius: 10, border: "1px solid #252525" }}>+ FILTRON</span>
          <span style={{ fontSize: 12, color: "#666", marginLeft: 4 }}>Filtre Sorgulama</span>
        </div>
        <a href="https://www.mann-filter.com/tr-tr/katalog.html" target="_blank" rel="noopener" style={{ fontSize: 11, color: "#78a22f", textDecoration: "none", padding: "5px 12px", border: "1px solid #333", borderRadius: 6, fontWeight: 600 }}>Resmi Katalog ↗</a>
      </header>

      <div style={{ background: "linear-gradient(135deg,#111a08,#090909 50%,#141200)", padding: "36px 20px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: "clamp(22px,4vw,34px)", fontWeight: 700, marginBottom: 6 }}>Aracınıza Uygun <span style={{ color: "#78a22f" }}>Filtreyi</span> Bulun</h1>
        <p style={{ color: "#777", fontSize: 13, maxWidth: 520, margin: "0 auto" }}>
          MANN-FILTER 2024-26 kataloğu — {DB.length} araç-motor eşleşmesi · {makes.length} marka
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: 8, color: "#0082c8", fontSize: 11 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#0082c8", display: "inline-block" }}></span>
            Filtron muadilleri dahil
          </span>
        </p>
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
              {make && model && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <p style={{ fontSize: 12, color: "#78a22f" }}>{results.length} sonuç bulundu</p>
                  {/* Legend */}
                  <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#555" }}>
                      <div style={{ width: 8, height: 8, background: "#1a1a1a", border: "1px solid #444", borderRadius: 2 }} />
                      MANN-FILTER
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#3a6080" }}>
                      <div style={{ width: 8, height: 8, background: "#0082c8", borderRadius: 2 }} />
                      FILTRON muadili
                    </div>
                  </div>
                </div>
              )}
            </div>

            {results.length > 0 && (
              <div ref={ref} style={{ marginTop: 16 }}>
                {results.map((r, ri) => {
                  const filterCards = ["oil", "air", "cabin", "fuel"]
                    .flatMap(key => {
                      const codes = toArray(r[key]);
                      return codes.map(code => ({ key, code }));
                    });

                  if (filterCards.length === 0) return null;

                  return (
                    <div key={ri} style={{ background: "#131313", border: "1px solid #222", borderRadius: 12, padding: 20, marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <div style={{ width: 7, height: 7, background: "#78a22f", borderRadius: "50%" }} />
                        <h3 style={{ fontSize: 14, fontWeight: 700 }}>{r.make} {r.model} — {r.engine}</h3>
                        <span style={{ fontSize: 11, color: "#78a22f", marginLeft: "auto", background: "#1a2a10", padding: "3px 10px", borderRadius: 12 }}>{r.ps} PS / {r.kw} kW</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10 }}>
                        {filterCards.map((f, fi) => (
                          <MannCard
                            key={fi}
                            code={f.code}
                            filterKey={f.key}
                            onOpenModal={(code, type) => {
                              const isFiltron = FILTRON_MAP[f.code] === code || code !== f.code;
                              openModal(code, type, isFiltron ? "filtron" : "mann");
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "product" && (
          <div>
            <div style={{ background: "#131313", border: "1px solid #222", borderRadius: 12, padding: 22, marginTop: 6 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>Ürün Kodu ile Arama</h3>
              <p style={{ color: "#555", fontSize: 11, marginBottom: 16 }}>MANN-FILTER parça numarası girerek uyumlu araçları görüntüleyin veya resmi katalogda açın</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input value={productSearch} onChange={e => setProductSearch(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      const trimmed = productSearch.trim();
                      if (trimmed) {
                        const type = getFilterType(trimmed);
                        if (type) { openModal(trimmed, type, "mann"); }
                        else { const u = buildUrl(trimmed); if (u) window.open(u, "_blank"); }
                      }
                    }
                  }}
                  placeholder="Örn: HU 719/7 x, W 712/95, CUK 2939" style={{ flex: "1 1 220px", padding: "10px 12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, color: "#e5e5e5", fontSize: 13, outline: "none" }} />
                <button onClick={() => {
                  const trimmed = productSearch.trim();
                  if (trimmed) {
                    const type = getFilterType(trimmed);
                    if (type) { openModal(trimmed, type, "mann"); }
                    else { const u = buildUrl(trimmed); if (u) window.open(u, "_blank"); }
                  }
                }} style={{ padding: "10px 18px", background: "#78a22f", color: "#090909", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Ara</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 10 }}>
                {["HU 719/7 x", "W 712/95", "C 30 005", "CUK 2939", "HU 7020 z", "PU 8014", "HU 816 x", "CU 25 001", "WK 69/2", "HU 7008 z", "C 35 154", "HU 6013 z", "HU 618 y", "HU 7048 z"].map(c => (
                  <button key={c} onClick={() => { setProductSearch(c); const type = getFilterType(c); if (type) openModal(c, type, "mann"); }}
                    style={{ padding: "3px 9px", background: "#1a1a1a", border: "1px solid #252525", borderRadius: 14, color: "#777", fontSize: 10, cursor: "pointer" }}>{c}</button>
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

      {/* MODAL */}
      {modalCode && (
        <div onClick={closeModal} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#131313",
            border: "1px solid #2a2a2a",
            borderTop: `3px solid ${isFiltronModal ? "#0082c8" : "#78a22f"}`,
            borderRadius: 14, width: "100%", maxWidth: 640, maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden"
          }}>

            {/* Modal Header */}
            <div style={{ padding: "20px 22px 16px", borderBottom: "1px solid #222", flexShrink: 0 }}>
              

              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  {(() => {
                    const mannCode = isFiltronModal
                      ? Object.entries(FILTRON_MAP).find(([m, f]) => f === modalCode)?.[0]
                      : modalCode;
                    const imgUrl = mannCode ? MANN_IMG_MAP[mannCode] : null;
                    return imgUrl ? (
                      <div style={{ background: "#1a1a1a", borderRadius: 12, padding: 10, border: "1px solid #2a2a2a", flexShrink: 0 }}>
                        <img src={imgUrl} alt={modalCode} style={{ maxWidth: 280, width: "100%", height: "auto", borderRadius: 8, display: "block", margin: "0 auto" }} />
                      </div>
                    ) : FILTER_TYPES[modalType]?.icon;
                  })()}
                  </div>
                  <div style={{ flex: 1, paddingTop: 4 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 8, background: isFiltronModal ? "#0082c818" : "#78a22f18", padding: "3px 10px 3px 8px", borderRadius: 5, border: `1px solid ${isFiltronModal ? "#0082c825" : "#78a22f25"}` }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: isFiltronModal ? "#0082c8" : "#78a22f" }} />
                      <span style={{ fontSize: 11, fontWeight: 800, color: isFiltronModal ? "#0082c8" : "#78a22f", letterSpacing: 1.5, textTransform: "uppercase" }}>{isFiltronModal ? "FILTRON" : "MANN"}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1.2 }}>
                      {FILTER_TYPES[modalType]?.label || "Filtre"}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: isFiltronModal ? "#0082c8" : "#78a22f" }}>
                      {modalCode}
                    </div>
                    {isFiltronModal && (() => {
                      const mannCode = Object.entries(FILTRON_MAP).find(([m, f]) => f === modalCode)?.[0];
                      return mannCode ? (
                        <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>
                          MANN <span style={{ color: "#78a22f" }}>{mannCode}</span> muadili
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>
                <button onClick={closeModal} style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, color: "#888", width: 32, height: 32, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                {isFiltronModal ? (
                  <a href={buildFiltronUrl(modalCode)} target="_blank" rel="noopener" style={{ padding: "7px 14px", background: "#0082c8", color: "#fff", border: "none", borderRadius: 7, fontWeight: 700, fontSize: 12, cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    Filtron'da Ara ↗
                  </a>
                ) : (
                  <a href={buildUrl(modalCode)} target="_blank" rel="noopener" style={{ padding: "7px 14px", background: "#78a22f", color: "#090909", border: "none", borderRadius: 7, fontWeight: 700, fontSize: 12, cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    MANN-FILTER Katalogda Gör ↗
                  </a>
                )}
                <div style={{ padding: "7px 12px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 7, fontSize: 12, color: "#999" }}>
                  {modalVehicles.length} araç-motor eşleşmesi · {modalGrouped.length} marka
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ overflowY: "auto", padding: "12px 22px 22px", flex: 1 }}>
              {modalGrouped.map(([makeName, vehicles]) => (
                <div key={makeName} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: isFiltronModal ? "#0082c8" : "#78a22f", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, padding: "6px 0", borderBottom: "1px solid #1e1e1e", position: "sticky", top: 0, background: "#131313", zIndex: 1 }}>
                    {makeName} <span style={{ color: "#555", fontWeight: 400 }}>({vehicles.length})</span>
                  </div>
                  {vehicles.map((v, vi) => (
                    <div key={vi} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 6, marginBottom: 2, background: vi % 2 === 0 ? "#0e0e0e" : "transparent" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.model}</div>
                        <div style={{ fontSize: 11, color: "#777" }}>{v.engine}</div>
                      </div>
                      {v.ps && v.kw && (
                        <div style={{ fontSize: 10, color: isFiltronModal ? "#0082c8" : "#78a22f", background: isFiltronModal ? "#0d1e30" : "#1a2a10", padding: "2px 8px", borderRadius: 10, whiteSpace: "nowrap", flexShrink: 0 }}>
                          {v.ps} PS / {v.kw} kW
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <footer style={{ borderTop: "1px solid #1a1a1a", padding: "14px 20px", textAlign: "center", fontSize: 10, color: "#444" }}>
        Veriler <a href="https://www.mann-filter.com/tr-tr/katalog.html" target="_blank" rel="noopener" style={{ color: "#78a22f", textDecoration: "none" }}>MANN-FILTER 2024-26 Kataloğu</a> PDF'inden çıkarılmıştır.
        Filtron muadilleri ayrıca gösterilmektedir. Kartlara tıklayarak uyumlu araçları görüntüleyebilirsiniz.
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
