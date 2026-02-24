"use client";

import { useState, useMemo, useCallback } from "react";

const makeDefault = (name = "Apartment 1") => ({
  id: Date.now(),
  name,
  url: "",
  rent: 3600,
  parking: 280,
  utilities: 360,
  wifi: 0,
  sqft: 1000,
  leaseMonths: 15,
  freeMonthCount: 3,
  extraDiscount: 1000,
  splitPct: 50,
  selectedFree: [0, 5, 10],
  splitIncludes: { rent: true, parking: true, utilities: true, wifi: true } as Record<string, boolean>,
});

function InputField({ label, value, onChange, prefix = "$", suffix, min = 0, max = 100000, step = 50 }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, color: "#9ca3af", letterSpacing: 0.3 }}>{label}</label>
      <div style={{ position: "relative" }}>
        {prefix && (
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#6b7280", fontFamily: "'DM Mono', monospace" }}>{prefix}</span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          min={min}
          max={max}
          step={step}
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: "#111",
            border: "1px solid #2a2a2a",
            borderRadius: 6,
            padding: prefix ? "8px 10px 8px 22px" : suffix ? "8px 50px 8px 10px" : "8px 10px",
            color: "#e5e5e5",
            fontSize: 14,
            fontFamily: "'DM Mono', monospace",
            outline: "none",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#4ade80")}
          onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
        />
        {suffix && (
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "#6b7280", fontFamily: "'DM Mono', monospace" }}>{suffix}</span>
        )}
      </div>
    </div>
  );
}

function SplitSlider({ pct, onChange, joseAmt, emiAmt, total }: any) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#4ade80", fontFamily: "'DM Mono', monospace" }}>Jose ${joseAmt.toLocaleString()}</span>
        <span style={{ fontSize: 11, color: "#555", fontFamily: "'DM Mono', monospace" }}>{pct}% / {100 - pct}%</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#f472b6", fontFamily: "'DM Mono', monospace" }}>Emi ${emiAmt.toLocaleString()}</span>
      </div>
      <div style={{ position: "relative", height: 28, display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", left: 0, right: 0, height: 6, borderRadius: 3, overflow: "hidden", display: "flex" }}>
          <div style={{ width: `${pct}%`, background: "#4ade80", transition: "width 0.1s" }} />
          <div style={{ flex: 1, background: "#f472b6" }} />
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={pct}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            position: "absolute",
            left: 0, right: 0, width: "100%", height: 28,
            opacity: 0, cursor: "pointer", margin: 0,
          }}
        />
        <div style={{
          position: "absolute",
          left: `${pct}%`, transform: "translateX(-50%)",
          width: 18, height: 18, borderRadius: "50%",
          background: "#fff", border: "2px solid #333",
          boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
          pointerEvents: "none", transition: "left 0.1s",
        }} />
      </div>
      <div style={{ fontSize: 10, color: "#555", marginTop: 4, fontFamily: "'DM Mono', monospace", textAlign: "center" }}>
        total housing: ${total.toLocaleString()}/mo — drag to adjust split
      </div>
    </div>
  );
}

function evaluate(cfg: any) {
  const alwaysOwed = cfg.parking + cfg.utilities + cfg.wifi;
  const totalMonthly = cfg.rent + alwaysOwed;
  const josePct = cfg.splitPct / 100;

  const effectiveFree = cfg.selectedFree.filter((m: number) => m < cfg.leaseMonths).slice(0, cfg.freeMonthCount);

  const months = Array.from({ length: cfg.leaseMonths }, (_, i) => {
    const isFree = effectiveFree.includes(i);
    const rentDue = isFree ? 0 : cfg.rent;
    const housingTotal = rentDue + alwaysOwed;
    const josePays = Math.round(housingTotal * josePct);
    const emiPays = housingTotal - josePays;
    return { month: i + 1, isFree, rentDue, housingTotal, josePays, emiPays };
  });

  let maxStreak = 0, streak = 0;
  for (const m of months) {
    if (!m.isFree) { streak++; maxStreak = Math.max(maxStreak, streak); } else streak = 0;
  }

  const payingMonths = cfg.leaseMonths - effectiveFree.length;
  const totalRentOwed = payingMonths * cfg.rent - cfg.extraDiscount;
  const totalAlways = alwaysOwed * cfg.leaseMonths;
  const totalHousing = totalRentOwed + totalAlways;
  const totalJose = Math.round(totalHousing * josePct);
  const totalEmi = totalHousing - totalJose;
  const effectiveMonthly = totalHousing / cfg.leaseMonths;
  const dollarPerSqft = cfg.sqft > 0 ? effectiveMonthly / cfg.sqft : 0;
  const stickerPerSqft = cfg.sqft > 0 ? totalMonthly / cfg.sqft : 0;
  const joseMonthly = totalJose / cfg.leaseMonths;
  const emiMonthly = totalEmi / cfg.leaseMonths;

  return { months, maxStreak, totalRentOwed, totalAlways, totalHousing, totalJose, totalEmi, effectiveMonthly, dollarPerSqft, stickerPerSqft, joseMonthly, emiMonthly, effectiveFree, alwaysOwed, josePct };
}

function ApartmentTab({ cfg, setCfg }: any) {
  const data = useMemo(() => evaluate(cfg), [cfg]);
  const ready = data.effectiveFree.length === cfg.freeMonthCount;
  const update = (key: string) => (val: any) => setCfg((prev: any) => ({ ...prev, [key]: val }));
  const alwaysOwed = data.alwaysOwed;
  const totalMonthlyHousing = cfg.rent + alwaysOwed;

  const splitTotal = (cfg.splitIncludes.rent ? cfg.rent : 0)
    + (cfg.splitIncludes.parking ? cfg.parking : 0)
    + (cfg.splitIncludes.utilities ? cfg.utilities : 0)
    + (cfg.splitIncludes.wifi ? cfg.wifi : 0);
  const joseRentShare = Math.round(splitTotal * data.josePct);
  const emiRentShare = splitTotal - joseRentShare;

  const toggleSplitItem = (key: string) => {
    setCfg((prev: any) => ({
      ...prev,
      splitIncludes: { ...prev.splitIncludes, [key]: !prev.splitIncludes[key] },
    }));
  };

  const toggleMonth = (idx: number) => {
    setCfg((prev: any) => {
      const sel = prev.selectedFree;
      if (sel.includes(idx)) return { ...prev, selectedFree: sel.filter((m: number) => m !== idx) };
      if (sel.length < prev.freeMonthCount) return { ...prev, selectedFree: [...sel, idx].sort((a: number, b: number) => a - b) };
      return prev;
    });
  };

  return (
    <div>
      {/* Inputs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div style={{ background: "#0d0d0d", borderRadius: 12, border: "1px solid #1a1a1a", padding: "20px" }}>
          <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14, fontWeight: 600 }}>Apartment Details</div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: "#9ca3af", letterSpacing: 0.3 }}>Name</label>
            <input
              type="text" value={cfg.name}
              onChange={(e) => update("name")(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box", background: "#111", border: "1px solid #2a2a2a",
                borderRadius: 6, padding: "8px 10px", color: "#e5e5e5", fontSize: 14,
                fontFamily: "'DM Mono', monospace", outline: "none", marginTop: 4,
              }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <InputField label="Monthly Rent" value={cfg.rent} onChange={update("rent")} />
            <InputField label="Sq Footage" value={cfg.sqft} onChange={update("sqft")} prefix="" suffix="sqft" min={1} max={10000} step={25} />
            <InputField label="Parking" value={cfg.parking} onChange={update("parking")} />
            <InputField label="Utilities" value={cfg.utilities} onChange={update("utilities")} step={25} />
            <InputField label="WiFi" value={cfg.wifi} onChange={update("wifi")} step={10} />
            <InputField label="Extra Discount" value={cfg.extraDiscount} onChange={update("extraDiscount")} step={100} />
          </div>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <InputField label="Lease Length" value={cfg.leaseMonths} onChange={(v: number) => setCfg((p: any) => ({ ...p, leaseMonths: v, selectedFree: p.selectedFree.filter((m: number) => m < v) }))} prefix="" suffix="months" min={1} max={36} step={1} />
            <InputField label="Months Free" value={cfg.freeMonthCount} onChange={(v: number) => setCfg((p: any) => ({ ...p, freeMonthCount: v, selectedFree: p.selectedFree.slice(0, v) }))} prefix="" min={0} max={12} step={1} />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#0d0d0d", borderRadius: 12, border: "1px solid #1a1a1a", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Split</div>
              <div style={{ display: "flex", gap: 6 }}>
                {([
                  { key: "rent", label: "Rent", value: cfg.rent },
                  { key: "parking", label: "Parking", value: cfg.parking },
                  { key: "utilities", label: "Utilities", value: cfg.utilities },
                  { key: "wifi", label: "WiFi", value: cfg.wifi },
                ] as const).map((item) => {
                  const on = cfg.splitIncludes[item.key];
                  return (
                    <button key={item.key} onClick={() => toggleSplitItem(item.key)} style={{
                      background: on ? "#4ade8018" : "#111",
                      color: on ? "#4ade80" : "#555",
                      border: on ? "1px solid #4ade8044" : "1px solid #222",
                      borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 600,
                      cursor: "pointer", fontFamily: "'DM Mono', monospace",
                      transition: "all 0.15s",
                    }}>
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <SplitSlider pct={cfg.splitPct} onChange={update("splitPct")} joseAmt={joseRentShare} emiAmt={emiRentShare} total={splitTotal} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: "#0a1a10", borderRadius: 10, border: "1px solid #4ade8033", padding: "16px" }}>
              <div style={{ fontSize: 9, color: "#4ade80", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6, fontWeight: 600 }}>Jose Effective</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#4ade80", fontFamily: "'DM Mono', monospace" }}>${Math.round(data.joseMonthly).toLocaleString()}<span style={{ fontSize: 12, color: "#4ade8088" }}>/mo</span></div>
              <div style={{ fontSize: 11, color: "#4ade8066", fontFamily: "'DM Mono', monospace", marginTop: 4 }}>${data.totalJose.toLocaleString()} total</div>
            </div>
            <div style={{ background: "#1a0a14", borderRadius: 10, border: "1px solid #f472b633", padding: "16px" }}>
              <div style={{ fontSize: 9, color: "#f472b6", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6, fontWeight: 600 }}>Emi Effective</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#f472b6", fontFamily: "'DM Mono', monospace" }}>${Math.round(data.emiMonthly).toLocaleString()}<span style={{ fontSize: 12, color: "#f472b688" }}>/mo</span></div>
              <div style={{ fontSize: 11, color: "#f472b666", fontFamily: "'DM Mono', monospace", marginTop: 4 }}>${data.totalEmi.toLocaleString()} total</div>
            </div>
          </div>

          <div style={{ background: "#0d0d0d", borderRadius: 10, border: "1px solid #1a1a1a", padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div>
                <div style={{ fontSize: 9, color: "#888", marginBottom: 2 }}>STICKER $/SQFT</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#888", fontFamily: "'DM Mono', monospace", textDecoration: "line-through", textDecorationColor: "#ef444466" }}>${data.stickerPerSqft.toFixed(2)}</div>
              </div>
              <div style={{ fontSize: 16, color: "#333" }}>→</div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 9, color: "#4ade80", marginBottom: 2 }}>EFFECTIVE $/SQFT</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#4ade80", fontFamily: "'DM Mono', monospace" }}>${data.dollarPerSqft.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 24 }}>
        {[
          { label: "Total Housing", value: `$${data.totalHousing.toLocaleString()}`, sub: `${cfg.leaseMonths} months` },
          { label: "Effective/mo", value: `$${Math.round(data.effectiveMonthly).toLocaleString()}`, sub: `vs $${totalMonthlyHousing.toLocaleString()} sticker` },
          { label: "You Save", value: `$${(totalMonthlyHousing * cfg.leaseMonths - data.totalHousing).toLocaleString()}`, sub: "free months + discount", color: "#4ade80" },
          { label: "Max Streak", value: `${data.maxStreak} mo`, sub: data.maxStreak <= 4 ? "✓ Good" : data.maxStreak <= 6 ? "⚠ Long" : "✗ Very long", color: data.maxStreak <= 4 ? "#4ade80" : data.maxStreak <= 6 ? "#f59e0b" : "#ef4444" },
        ].map((c, i) => (
          <div key={i} style={{ background: "#0d0d0d", borderRadius: 10, padding: "12px 14px", border: "1px solid #1a1a1a" }}>
            <div style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5, fontWeight: 600 }}>{c.label}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: c.color || "#fff", fontFamily: "'DM Mono', monospace" }}>{c.value}</div>
            <div style={{ fontSize: 10, color: "#444", marginTop: 2, fontFamily: "'DM Mono', monospace" }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Month Selector */}
      <div style={{ background: "#0d0d0d", borderRadius: 12, border: "1px solid #1a1a1a", padding: "20px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Free Months</span>
            <span style={{ fontSize: 11, color: "#555", marginLeft: 8, fontFamily: "'DM Mono', monospace" }}>click to toggle</span>
          </div>
          <span style={{
            fontSize: 11, fontFamily: "'DM Mono', monospace",
            color: ready ? "#4ade80" : "#f59e0b",
            background: ready ? "#4ade8015" : "#f59e0b15",
            padding: "3px 8px", borderRadius: 4,
          }}>{data.effectiveFree.length}/{cfg.freeMonthCount}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(cfg.leaseMonths, 8)}, 1fr)`, gap: 6 }}>
          {Array.from({ length: cfg.leaseMonths }, (_, i) => {
            const isSel = data.effectiveFree.includes(i);
            const canSelect = isSel || data.effectiveFree.length < cfg.freeMonthCount;
            return (
              <button key={i} onClick={() => canSelect && toggleMonth(i)} style={{
                background: isSel ? "#4ade80" : "#161616",
                color: isSel ? "#000" : canSelect ? "#aaa" : "#444",
                border: isSel ? "1px solid #4ade80" : "1px solid #222",
                borderRadius: 6, padding: "10px 4px", cursor: canSelect ? "pointer" : "default",
                fontWeight: isSel ? 700 : 400, fontSize: 13, fontFamily: "'DM Mono', monospace",
                transition: "all 0.12s", opacity: canSelect ? 1 : 0.35,
              }}>
                {i + 1}
                {isSel && <div style={{ fontSize: 8, marginTop: 1, fontWeight: 600 }}>FREE</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      {ready && (
        <div style={{ background: "#0d0d0d", borderRadius: 12, border: "1px solid #1a1a1a", padding: "20px", marginBottom: 24 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Monthly Payment by Person</span>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 200, paddingBottom: 36, paddingTop: 16, position: "relative" }}>
            {data.months.map((m: any, i: number) => {
              const maxVal = Math.max(...data.months.map((x: any) => x.housingTotal)) || 1;
              const joseH = Math.max((m.josePays / maxVal) * 150, 0);
              const emiH = Math.max((m.emiPays / maxVal) * 150, 0);
              return (
                <div key={i} style={{ flex: 1, position: "relative", height: "100%" }}>
                  <div style={{ position: "absolute", bottom: 36, left: "10%", width: "80%", height: emiH, background: "#f472b6", borderRadius: "0 0 2px 2px", opacity: 0.7 }} />
                  <div style={{ position: "absolute", bottom: 36 + emiH, left: "10%", width: "80%", height: joseH, background: "#4ade80", borderRadius: "3px 3px 0 0", opacity: m.isFree ? 0.4 : 0.7 }} />
                  <div style={{ position: "absolute", bottom: 36 + emiH + joseH + 3, width: "100%", textAlign: "center", fontSize: 8, fontWeight: 600, color: m.isFree ? "#4ade80" : "#666", fontFamily: "'DM Mono', monospace" }}>${m.housingTotal.toLocaleString()}</div>
                  <div style={{ position: "absolute", bottom: 10, width: "100%", textAlign: "center", fontSize: 9, color: m.isFree ? "#4ade80" : "#555", fontWeight: m.isFree ? 700 : 400, fontFamily: "'DM Mono', monospace" }}>{m.month}</div>
                  {m.isFree && <div style={{ position: "absolute", bottom: 22, width: "100%", textAlign: "center", fontSize: 7, color: "#4ade80", fontWeight: 600 }}>FREE</div>}
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#888" }}><div style={{ width: 10, height: 10, borderRadius: 2, background: "#4ade80", opacity: 0.7 }} /> Jose</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#888" }}><div style={{ width: 10, height: 10, borderRadius: 2, background: "#f472b6", opacity: 0.7 }} /> Emi</div>
          </div>
        </div>
      )}

      {/* Table */}
      {ready && (
        <div style={{ background: "#0d0d0d", borderRadius: 12, border: "1px solid #1a1a1a", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #1a1a1a" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Month-by-Month</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
                  {["Mo", "Rent", "Extras", "Total", "Jose", "Emi"].map((h, i) => (
                    <th key={i} style={{ padding: "10px 12px", textAlign: i === 0 ? "left" : "right", color: "#555", fontWeight: 500, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.months.map((m: any, i: number) => (
                  <tr key={i} style={{ borderBottom: "1px solid #111", background: m.isFree ? "rgba(74,222,128,0.03)" : "transparent" }}>
                    <td style={{ padding: "9px 12px", fontWeight: 500, color: m.isFree ? "#4ade80" : "#888" }}>{m.month}{m.isFree ? " ✦" : ""}</td>
                    <td style={{ padding: "9px 12px", textAlign: "right", color: m.isFree ? "#4ade80" : "#888" }}>{m.isFree ? "—" : `$${cfg.rent.toLocaleString()}`}</td>
                    <td style={{ padding: "9px 12px", textAlign: "right", color: "#555" }}>${alwaysOwed.toLocaleString()}</td>
                    <td style={{ padding: "9px 12px", textAlign: "right", color: "#aaa", fontWeight: 500 }}>${m.housingTotal.toLocaleString()}</td>
                    <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 600, color: "#4ade80" }}>${m.josePays.toLocaleString()}</td>
                    <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 600, color: "#f472b6" }}>${m.emiPays.toLocaleString()}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: "2px solid #222", background: "#080808" }}>
                  <td style={{ padding: "12px 12px", fontWeight: 700, color: "#fff" }}>Total</td>
                  <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 600, color: "#fff" }}>${data.totalRentOwed.toLocaleString()}</td>
                  <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 600, color: "#fff" }}>${data.totalAlways.toLocaleString()}</td>
                  <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 700, color: "#fff" }}>${data.totalHousing.toLocaleString()}</td>
                  <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 700, color: "#4ade80" }}>${data.totalJose.toLocaleString()}</td>
                  <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 700, color: "#f472b6" }}>${data.totalEmi.toLocaleString()}</td>
                </tr>
                <tr style={{ background: "#080808" }}>
                  <td style={{ padding: "8px 12px", fontWeight: 500, color: "#888" }}>Avg/mo</td>
                  <td colSpan={2}></td>
                  <td style={{ padding: "8px 12px", textAlign: "right", color: "#888" }}>${Math.round(data.effectiveMonthly).toLocaleString()}</td>
                  <td style={{ padding: "8px 12px", textAlign: "right", color: "#4ade80" }}>${Math.round(data.joseMonthly).toLocaleString()}</td>
                  <td style={{ padding: "8px 12px", textAlign: "right", color: "#f472b6" }}>${Math.round(data.emiMonthly).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [apartments, setApartments] = useState([makeDefault("Apartment 1")]);
  const [activeTab, setActiveTab] = useState(0);

  const addApt = () => {
    const newApt = makeDefault(`Apartment ${apartments.length + 1}`);
    setApartments([...apartments, newApt]);
    setActiveTab(apartments.length);
  };

  const removeApt = (idx: number) => {
    if (apartments.length <= 1) return;
    const next = apartments.filter((_: any, i: number) => i !== idx);
    setApartments(next);
    setActiveTab(Math.min(activeTab, next.length - 1));
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#060606", color: "#e5e5e5", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "16px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "baseline", gap: 12 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0, fontFamily: "'Instrument Serif', serif" }}>Apartment Cash Flow</h1>
          <span style={{ fontSize: 12, color: "#555", fontFamily: "'DM Mono', monospace" }}>compare</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #1a1a1a", background: "#090909" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", gap: 0 }}>
          {apartments.map((apt, i) => (
            <button key={apt.id} onClick={() => setActiveTab(i)} style={{
              background: activeTab === i ? "#060606" : "transparent",
              color: activeTab === i ? "#fff" : "#666",
              border: "none",
              borderBottom: activeTab === i ? "2px solid #4ade80" : "2px solid transparent",
              padding: "12px 20px", fontSize: 13, fontWeight: activeTab === i ? 600 : 400,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s",
            }}>
              {apt.name}
              {apartments.length > 1 && (
                <span onClick={(e) => { e.stopPropagation(); removeApt(i); }}
                  style={{ fontSize: 14, color: "#555", cursor: "pointer", lineHeight: 1, padding: "0 2px" }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#ef4444")}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#555")}>×</span>
              )}
            </button>
          ))}
          <button onClick={addApt} style={{
            background: "transparent", color: "#4ade80",
            border: "1px dashed #4ade8044", borderRadius: 4,
            padding: "6px 14px", fontSize: 12, fontWeight: 600,
            cursor: "pointer", marginLeft: 8, fontFamily: "'DM Sans', sans-serif",
          }}>+ Add Apartment</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px" }}>
        {apartments[activeTab] && (
          <ApartmentTab
            key={apartments[activeTab].id}
            cfg={apartments[activeTab]}
            setCfg={(updater: any) => {
              setApartments((prev) =>
                prev.map((a, i) => i === activeTab ? (typeof updater === "function" ? updater(a) : { ...a, ...updater }) : a)
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
