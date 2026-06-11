import { useState, useRef, useMemo } from "react";
import * as XLSX from "xlsx";

// ─── Fixed Google Sheet (never changes) ──────────────────────────────────────
const SHEET_LINK = "https://docs.google.com/spreadsheets/d/1lc9C2tS7fa4rjhG7GonMyd-QkP8Ai9nfCKrtAFIpG10/edit";
const SHEET_KEY  = "pa6_webapp_url"; // localStorage key for the Apps Script Web App URL
const SHEET_URL  = "https://script.google.com/macros/s/AKfycbwDGcW58xYAKI0FGOkj1RjVeQ1Z3aNCREkIzR0mjEJ-22kDhYXhmesvWX_trYQSvxBr/exec";

// ─── Style tokens ─────────────────────────────────────────────────────────────
const C = {
  navy: "#0C447C", teal: "#0F6E56", violet: "#534AB7",
  danger: "#d43f3f", bg: "#f5f6f8", border: "#d0d4da",
  text: "#1a1a1a", muted: "#666",
};
const inp = {
  width: "100%", border: `1px solid ${C.border}`, borderRadius: 7,
  padding: "8px 10px", fontSize: 13, background: "#fff", color: C.text,
  fontFamily: "inherit", outline: "none", boxSizing: "border-box",
};
const mkBtn = (bg, color = "#fff", extra = {}) => ({
  padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500,
  cursor: "pointer", border: "none", background: bg, color,
  display: "inline-flex", alignItems: "center", gap: 6,
  ...extra,
});
const card      = { background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, marginBottom: 14 };
const labelSt   = { fontSize: 12, color: "#555", marginBottom: 5, display: "block", fontWeight: 500 };
const subTitleSt= { fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" };
const fw        = { marginBottom: 13 };
const g2        = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
const g3        = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 };
const dvdr      = { height: 1, background: "#f0f2f5", margin: "14px 0" };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fv = (val) => {
  if (!val) return "";
  if (Array.isArray(val)) return val.join(", ");
  return String(val);
};

function calcProgress(d) {
  const keys = ["custName","partName","industry","matBase","gradeType","z1","z5","dryTemp","dryTime","visualDefects","failureDesc"];
  const filled = keys.filter(k => { const v = d[k]; return v && (Array.isArray(v) ? v.length > 0 : String(v).trim() !== ""); }).length;
  return Math.round((filled / keys.length) * 100);
}

// ─── Build flat row grouped by step (horizontal layout in sheet) ──────────────
// Column naming: "[S1]", "[S2]", "[S3]", "[S4]" prefix groups each step visually
function buildSheetRow(d) {
  return {
    // ── META ──────────────────────────────────────────────────────────────────
    "Timestamp": new Date().toLocaleString("en-IN"),

    // ── STEP 1 : CUSTOMER & MACHINE ───────────────────────────────────────────
    "[S1] Customer Name":       fv(d.custName),
    "[S1] Contact":             fv(d.contact),
    "[S1] Industry":            fv(d.industry),
    "[S1] Part Name":           fv(d.partName),
    "[S1] Impressions":         fv(d.impressions),
    "[S1] Z1 Feed °C":          fv(d.z1),
    "[S1] Z2 °C":               fv(d.z2),
    "[S1] Z3 °C":               fv(d.z3),
    "[S1] Z4 °C":               fv(d.z4),
    "[S1] Z5 Nozzle °C":        fv(d.z5),
    "[S1] Mold Temp °C":        fv(d.moldTemp),
    "[S1] Back Pressure bar":   fv(d.backPress),
    "[S1] Screw Speed RPM":     fv(d.screwSpd),
    "[S1] Injection Speed %":   fv(d.injSpd),
    "[S1] Holding Pressure bar":fv(d.holdPres),
    "[S1] Cooling Time sec":    fv(d.coolTime),
    "[S1] Holding Time sec":    fv(d.holdTime),
    "[S1] Cycle Time sec":      fv(d.cycleTime),
    "[S1] Runner System":       fv(d.runner),
    "[S1] Ejector Type":        fv(d.ejector),
    "[S1] Heating Channels":    fv(d.heatCh),
    "[S1] Cooling Channels":    fv(d.coolCh),
    "[S1] Product Shape":       fv(d.prodShape),
    "[S1] Surface Area cm2":    fv(d.surfArea),
    "[S1] Min Wall mm":         fv(d.wallMin),
    "[S1] Max Wall mm":         fv(d.wallMax),
    "[S1] Mold Age":            fv(d.moldAge),
    "[S1] Priority Ranking":    fv(d.rankList),
    "[S1] Gloss Requirement":   fv(d.gloss),

    // ── STEP 2 : MATERIAL ─────────────────────────────────────────────────────
    "[S2] Material Base":        fv(d.matBase) + (d.matBaseOther ? ` / ${fv(d.matBaseOther)}` : ""),
    "[S2] Grade Type":           fv(d.gradeType),
    "[S2] Our Grade Name":       fv(d.gradeName),
    "[S2] Reprocessing Cycles":  fv(d.reprocessCycles),
    "[S2] Batch Ref":            fv(d.batchRef),
    "[S2] Volume MT/month":      fv(d.volReq),
    "[S2] Compliance":           fv(d.compliance),
    "[S2] Drying Temp °C":       fv(d.dryTemp),
    "[S2] Drying Time hrs":      fv(d.dryTime),
    "[S2] Dryer Type":           fv(d.dryerType),
    "[S2] Regrind % Customer":   fv(d.regrindPct),
    "[S2] Additives":            fv(d.additives),
    "[S2] Mold Release":         fv(d.moldRelease),
    "[S2] Post Mold Ops":        fv(d.postMold),
    "[S2] Storage Conditions":   fv(d.storageCond),
    "[S2] Documents Required":   fv(d.docNeeds),

    // ── STEP 3 : MATERIAL PROPERTIES ─────────────────────────────────────────
    "[S3] Tensile Strength (MPa)":   fv(d.tensileStrength),
    "[S3] Elongation (%)":           fv(d.elongation),
    "[S3] IZOD Impact (J/m)":        fv(d.izodImpact),
    "[S3] Specific Gravity":         fv(d.specificGravity),
    "[S3] Glass Filled (%)": fv(d.glassFilled),
    "[S3] FR (Flame Retardant)":     fv(d.flameRetardant),
    "[S3] MFI (g/10min)":            fv(d.mfi),

    // ── STEP 4 : PROBLEMS ────────────────────────────────────────────────────
    "[S4] Incoming Tests":       fv(d.incomingTests),
    "[S4] Finished Tests":       fv(d.finishedTests),
    "[S4] Failure Stage":        fv(d.failureStage),
    "[S4] Rejection Rate %":     fv(d.rejRate),
    "[S4] Visual Defects":       fv(d.visualDefects),
    "[S4] Mechanical Defects":   fv(d.mechDefects),
    "[S4] Failure Description":  fv(d.failureDesc),
    "[S4] Problem Started":      fv(d.probStart),
    "[S4] Problem Frequency":    fv(d.probFreq),
    "[S4] Recent Changes":       fv(d.recentChanges),

    // ── STEP 5 : RECOMMENDATIONS & ACTIONS ──────────────────────────────────
    "[S5] Portfolio Grades":     (d.portfolio||[]).filter(p=>p.name).map(p=>`${p.name}(${p.type})`).join(" | "),
    "[S5] Rec Drying Temp °C":   fv(d.recDryTemp),
    "[S5] Rec Drying Time hrs":  fv(d.recDryTime),
    "[S5] Rec Melt Temp °C":     fv(d.recMeltTemp),
    "[S5] Rec Max Regrind %":    fv(d.recRegrind),
    "[S5] Action Items":         fv(d.actionItems),
    "[S5] Reviewed By":          fv(d.reviewer),
    "[S5] Review Date":          fv(d.reviewDate),
  };
}

// ─── Excel export (same grouped structure) ───────────────────────────────────
function exportExcel(d) {
  const row  = buildSheetRow(d);
  const wb   = XLSX.utils.book_new();
  // Summary sheet: Field | Value pairs
  const ws1  = XLSX.utils.aoa_to_sheet([["Field", "Value"], ...Object.entries(row).map(([k,v])=>[k,v])]);
  ws1["!cols"] = [{ wch: 32 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Review Summary");
  // Flat log sheet: one row
  const ws2  = XLSX.utils.aoa_to_sheet([Object.keys(row), Object.values(row)]);
  ws2["!cols"] = Object.keys(row).map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(wb, ws2, "Flat Data Log");
  const cn = (fv(d.custName) || "Customer").replace(/\s+/g, "_");
  XLSX.writeFile(wb, `PA6_Review_${cn}_${new Date().toISOString().slice(0,10)}.xlsx`);
}

// ─── Save to the fixed Google Sheet ──────────────────────────────────────────
async function pushToSheet(d) {
  const url = SHEET_URL;
  try {
    await fetch(url, {
      method: "POST", mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildSheetRow(d)),
    });
    return { ok: true, msg: `Saved — ${new Date().toLocaleTimeString("en-IN")}` };
  } catch (err) {
    return { ok: false, msg: err.message };
  }
}

// ─── Apps Script code shown in modal ─────────────────────────────────────────
const APPS_SCRIPT = `function doPost(e) {
  var ss    = SpreadsheetApp.openById("1lc9C2tS7fa4rjhG7GonMyd-QkP8Ai9nfCKrtAFIpG10");
  var sheet = ss.getSheetByName("Responses") || ss.insertSheet("Responses");
  var data  = JSON.parse(e.postData.contents);
  var keys  = Object.keys(data);
  var vals  = Object.values(data);

  // Write header row only once (row 1)
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(keys);
    // Colour group headers
    var colors = {
      "Timestamp": "#CCCCCC",
      "[S1]": "#CFE2F3", "[S2]": "#D9EAD3",
      "[S3]": "#FFF2CC", "[S4]": "#FCE5CD", "[S5]": "#EAD1DC",
    };
    var headerRow = sheet.getRange(1, 1, 1, keys.length);
    keys.forEach(function(k, i) {
      var col = null;
      if (k === "Timestamp") col = colors["Timestamp"];
      else if (k.startsWith("[S1]")) col = colors["[S1]"];
      else if (k.startsWith("[S2]")) col = colors["[S2]"];
      else if (k.startsWith("[S3]")) col = colors["[S3]"];
      else if (k.startsWith("[S4]")) col = colors["[S4]"];
      else if (k.startsWith("[S5]")) col = colors["[S5]"];
      if (col) sheet.getRange(1, i+1).setBackground(col);
    });
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,keys.length).setFontWeight("bold");
  }

  sheet.appendRow(vals);

  return ContentService
    .createTextOutput(JSON.stringify({ status: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

// ─── Chip component ───────────────────────────────────────────────────────────
function Chips({ options, value = [], onChange, single = false }) {
  const toggle = (o) => {
    if (single) onChange(value[0] === o ? [] : [o]);
    else onChange(value.includes(o) ? value.filter(v => v !== o) : [...value, o]);
  };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {options.map(o => {
        const on = value.includes(o);
        return (
          <button key={o} onClick={() => toggle(o)} style={{
            padding: "5px 11px", borderRadius: 6, fontSize: 12, cursor: "pointer",
            userSelect: "none", background: on ? "#E6F1FB" : "#fff",
            border: `1px solid ${on ? "#378ADD" : C.border}`,
            color: on ? C.navy : "#444", fontWeight: on ? 500 : 400,
          }}>{o}</button>
        );
      })}
    </div>
  );
}

// ─── Drag-to-rank ─────────────────────────────────────────────────────────────
const DEFAULT_RANK = [
  "Mechanical strength","Surface finish / optical","Dimensional accuracy",
  "Impact resistance","Heat resistance","Chemical / moisture resistance",
  "Color consistency","Price / cost sensitivity",
];
function RankList({ value, onChange }) {
  const src = useRef(null);
  const items = value.length ? value : DEFAULT_RANK;
  const onDrop = (e, i) => {
    e.preventDefault();
    if (src.current === null || src.current === i) return;
    const next = [...items];
    const [m] = next.splice(src.current, 1);
    next.splice(i, 0, m);
    onChange(next);
    src.current = null;
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {items.map((item, i) => (
        <div key={item} draggable
          onDragStart={() => { src.current = i; }}
          onDragOver={e => e.preventDefault()}
          onDrop={e => onDrop(e, i)}
          style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", background:C.bg, borderRadius:7, fontSize:12, cursor:"grab", border:`1px solid ${C.border}` }}>
          <span style={{ width:20, height:20, borderRadius:"50%", background:C.navy, color:"#fff", fontSize:11, fontWeight:600, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>{i+1}</span>
          {item}
        </div>
      ))}
    </div>
  );
}

// ─── Portfolio builder ────────────────────────────────────────────────────────
const GRADE_OPTS = ["PA6 Unfilled","PA6 GF15","PA6 GF30","PA6 GF50","PA66 Unfilled","PA66 GF15","PA66 GF30","PA66 GF50","PA6 Reprocessed","PA66 Reprocessed","PA6 FR","PA66 FR"];
function PortfolioBuilder({ value, onChange }) {
  const rows = value.length ? value : [{ name:"", type:"PA66 GF30", props:"" }];
  const upd  = (i, k, v) => onChange(rows.map((r,ri) => ri===i ? {...r,[k]:v} : r));
  const add  = () => onChange([...rows, { name:"", type:"PA66 GF30", props:"" }]);
  const rm   = (i) => { if (rows.length > 1) onChange(rows.filter((_,ri)=>ri!==i)); };
  return (
    <div>
      {rows.map((row,i) => (
        <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 2fr auto", gap:8, marginBottom:8, alignItems:"end" }}>
          <div>{i===0&&<div style={labelSt}>Grade name</div>}<input style={inp} value={row.name} onChange={e=>upd(i,"name",e.target.value)} placeholder="PA66-GF30-A" /></div>
          <div>{i===0&&<div style={labelSt}>Type</div>}<select style={inp} value={row.type} onChange={e=>upd(i,"type",e.target.value)}>{GRADE_OPTS.map(o=><option key={o}>{o}</option>)}</select></div>
          <div>{i===0&&<div style={labelSt}>Key properties / notes</div>}<input style={inp} value={row.props} onChange={e=>upd(i,"props",e.target.value)} placeholder="High flow, MFI 14, good weld line..." /></div>
          <div style={{paddingTop:i===0?18:0}}><button onClick={()=>rm(i)} style={mkBtn("#fff","#555",{border:`1px solid ${C.border}`,padding:"7px 10px"})}>✕</button></div>
        </div>
      ))}
      <button onClick={add} style={mkBtn("#fff","#555",{border:`1px solid ${C.border}`,fontSize:12,marginTop:4})}>+ Add grade</button>
    </div>
  );
}

// ─── Google Sheets Setup Modal ────────────────────────────────────────────────
function SheetsModal({ onClose }) {
  const [url, setUrl] = useState(localStorage.getItem(SHEET_KEY) || "");
  const save = () => {
    if (!url.startsWith("https://script.google.com")) { alert("Please enter a valid Google Apps Script Web App URL"); return; }
    localStorage.setItem(SHEET_KEY, url);
    onClose(true);
  };
  return (
    <div onClick={e => e.target===e.currentTarget && onClose(false)}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#fff", borderRadius:14, padding:28, maxWidth:560, width:"92%", maxHeight:"90vh", overflowY:"auto" }}>
        <h2 style={{ fontSize:17, fontWeight:600, marginBottom:6 }}>🔗 Connect to Your Google Sheet</h2>

        {/* Sheet link */}
        <div style={{ background:"#E6F1FB", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:13 }}>
          📊 Target sheet:{" "}
          <a href={SHEET_LINK} target="_blank" rel="noreferrer" style={{ color:C.navy, fontWeight:600, wordBreak:"break-all" }}>
            {SHEET_LINK}
          </a>
          <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>All responses will be saved to the "Responses" tab in this sheet.</div>
        </div>

        {/* Steps */}
        {[
          ["Step 1 — Open the Google Sheet", <><a href={SHEET_LINK} target="_blank" rel="noreferrer" style={{color:C.navy,fontWeight:600}}>Click here to open the sheet</a> → then click <strong>Extensions → Apps Script</strong></>],
          ["Step 2 — Paste the Apps Script code", "Delete any existing code in the editor, paste the code below exactly, then click the 💾 Save icon (Ctrl+S)."],
          ["Step 3 — Deploy as Web App", "Click Deploy → New deployment → Type: Web App → Execute as: Me → Who has access: Anyone → Deploy → Copy the Web App URL → Paste it below."],
          ["Step 4 — Paste the Web App URL below", "Every submission from this app will automatically save a new row to the Responses tab, colour-coded by step."],
        ].map(([title, desc]) => (
          <div key={title} style={{ background:C.bg, borderRadius:8, padding:"10px 14px", marginBottom:8, fontSize:12, lineHeight:1.7, borderLeft:"3px solid #378ADD" }}>
            <strong style={{ color:C.navy, display:"block", marginBottom:3 }}>{title}</strong>{desc}
          </div>
        ))}

        {/* Code block */}
        <div style={{ position:"relative", marginBottom:14 }}>
          <pre style={{ background:"#1a1a2e", color:"#e8f4fd", borderRadius:8, padding:"12px 14px", fontSize:11.5, whiteSpace:"pre-wrap", lineHeight:1.6, margin:0, overflowX:"auto" }}>{APPS_SCRIPT}</pre>
          <button
            onClick={() => { navigator.clipboard.writeText(APPS_SCRIPT); }}
            style={{ position:"absolute", top:8, right:8, ...mkBtn("#ffffff22","#e8f4fd",{fontSize:11,padding:"4px 10px",border:"1px solid #ffffff33"}) }}>
            Copy
          </button>
        </div>

        <div style={fw}>
          <label style={labelSt}>Your Web App URL *</label>
          <input style={inp} value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://script.google.com/macros/s/...../exec" />
        </div>
        <div style={{ display:"flex", gap:8, marginTop:4 }}>
          <button onClick={save} style={mkBtn(C.navy)}>Save &amp; Connect</button>
          <button onClick={()=>onClose(false)} style={mkBtn("#fff","#333",{border:`1px solid ${C.border}`})}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg }) {
  return msg ? (
    <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", background:"#1a1a1a", color:"#fff", padding:"10px 20px", borderRadius:8, fontSize:13, zIndex:300, pointerEvents:"none" }}>{msg}</div>
  ) : null;
}

// ─── Product Catalogue (from datasheet) ─────────────────────────────────────
// Each entry: { name, gf, tensile:[min,max], elongation:[min,max], izod:[min,max], sg:[min,max], fr }
// Ranges parsed from the specification values in the datasheet
const PRODUCTS = [
  { name:"100 NL/BK",   gf:0,  tensile:[650,850],   elongation:[15,45], izod:[3,5],    sg:[1.10,1.14], fr:false },
  { name:"1315 NL/BK",  gf:15, tensile:[950,1250],  elongation:[8,14],  izod:[3,8],    sg:[1.20,1.24], fr:false },
  { name:"1330 AK",     gf:30, tensile:[1450,1650], elongation:[6,12],  izod:[7,11],   sg:[1.34,1.38], fr:false },
  { name:"1330 BW",     gf:30, tensile:[1600,1800], elongation:[6,12],  izod:[6,12],   sg:[1.34,1.38], fr:false },
  { name:"1350 NL/BK",  gf:50, tensile:[1850,2150], elongation:[5,11],  izod:[15,20],  sg:[1.50,1.62], fr:false },
  { name:"200 NL/BK",   gf:0,  tensile:[650,850],   elongation:[8,99],  izod:[3,5],    sg:[1.10,1.14], fr:false },
  { name:"2315 NL/BK",  gf:15, tensile:[1050,1350], elongation:[4,99],  izod:[3,9],    sg:[1.20,1.24], fr:false },
  { name:"2330 NL/BK",  gf:30, tensile:[1550,1850], elongation:[4,99],  izod:[9,12],   sg:[1.34,1.38], fr:false },
  { name:"2350 NL/BK",  gf:50, tensile:[2000,2200], elongation:[4,14],  izod:[10,15],  sg:[1.53,1.59], fr:false },
  { name:"100 NL/BK E", gf:0,  tensile:[550,750],   elongation:[6,12],  izod:[2.5,4],  sg:[1.10,1.14], fr:false },
  { name:"1315 NL/BK E",gf:15, tensile:[750,950],   elongation:[6,12],  izod:[2.5,5],  sg:[1.20,1.24], fr:false },
  { name:"1330 NL E",   gf:30, tensile:[1300,1500], elongation:[7,13],  izod:[3,5],    sg:[1.34,1.38], fr:false },
  { name:"1330 BK E (A)",gf:30,tensile:[1000,1200], elongation:[7,13],  izod:[2.5,5],  sg:[1.34,1.38], fr:false },
  { name:"1330 BK E (B)",gf:30,tensile:[900,1100],  elongation:[7,13],  izod:[2.5,5],  sg:[1.34,1.38], fr:false },
  { name:"1350 NL/BK E",gf:50, tensile:[1400,1600], elongation:[5,11],  izod:[5,8],    sg:[1.53,1.59], fr:false },
  { name:"200 NL/BK E", gf:0,  tensile:[600,800],   elongation:[6,99],  izod:[2.5,3],  sg:[1.10,1.14], fr:false },
  { name:"2315 NL/BK E",gf:15, tensile:[650,850],   elongation:[6,99],  izod:[3,5],    sg:[1.20,1.24], fr:false },
  { name:"2330 NL E",   gf:30, tensile:[1350,1550], elongation:[7,99],  izod:[6,9],    sg:[1.34,1.38], fr:false },
  { name:"2330 BK E",   gf:30, tensile:[1150,1350], elongation:[7,99],  izod:[3,5],    sg:[1.34,1.38], fr:false },
  { name:"2330 BK P",   gf:30, tensile:[1300,1500], elongation:[7,99],  izod:[5,8],    sg:[1.34,1.38], fr:false },
  { name:"2350 NL/BK E",gf:50, tensile:[1300,1700], elongation:[8,16],  izod:[6,12],   sg:[1.50,1.62], fr:false },
  { name:"100 BK P",    gf:0,  tensile:[550,750],   elongation:[10,30], izod:[2.5,3.5],sg:[1.10,1.14], fr:false },
  { name:"1315 BK P",   gf:15, tensile:[850,1150],  elongation:[5,11],  izod:[3,7],    sg:[1.20,1.24], fr:false },
  { name:"1330 BK P",   gf:30, tensile:[1300,1500], elongation:[4,10],  izod:[5,11],   sg:[1.34,1.38], fr:false },
  { name:"1350 BK P",   gf:50, tensile:[1450,1750], elongation:[3,9],   izod:[6,10],   sg:[1.50,1.62], fr:false },
];

// Score a product against the entered property values (0–100)
function scoreProduct(product, d) {
  let score = 0, factors = 0;

  const inRange = (val, [lo, hi]) => val >= lo && val <= hi;
  const proximity = (val, [lo, hi]) => {
    if (val >= lo && val <= hi) return 1;
    const mid = (lo + hi) / 2;
    const half = (hi - lo) / 2 || 1;
    return Math.max(0, 1 - Math.abs(val - mid) / (half * 3));
  };

  // Glass filled match (highest weight — hard filter)
  if (d.glassFilled !== undefined && d.glassFilled !== "") {
    const gf = parseFloat(d.glassFilled);
    const diff = Math.abs(product.gf - gf);
    score += diff === 0 ? 40 : diff <= 5 ? 20 : diff <= 15 ? 8 : 0;
    factors += 40;
  }

  // Tensile strength
  if (d.tensileStrength !== undefined && d.tensileStrength !== "") {
    const ts = parseFloat(d.tensileStrength);
    score += proximity(ts, product.tensile) * 20;
    factors += 20;
  }

  // Elongation
  if (d.elongation !== undefined && d.elongation !== "") {
    const el = parseFloat(d.elongation);
    score += proximity(el, product.elongation) * 15;
    factors += 15;
  }

  // IZOD impact
  if (d.izodImpact !== undefined && d.izodImpact !== "") {
    const iz = parseFloat(d.izodImpact);
    score += proximity(iz, product.izod) * 15;
    factors += 15;
  }

  // Specific gravity
  if (d.specificGravity !== undefined && d.specificGravity !== "") {
    const sg = parseFloat(d.specificGravity);
    score += proximity(sg, product.sg) * 10;
    factors += 10;
  }

  // FR requirement
  if (d.flameRetardant && d.flameRetardant.length > 0) {
    const wantsFR = !d.flameRetardant.includes("No");
    if (wantsFR === product.fr) { score += 10; }
    factors += 10;
  }

  // Grade type boost from Step 2
  const gradeType = fv(d.gradeType).toLowerCase();
  if (gradeType.includes("gf30") && product.gf === 30) score += 5;
  if (gradeType.includes("gf15") && product.gf === 15) score += 5;
  if (gradeType.includes("gf50") && product.gf === 50) score += 5;
  if ((gradeType.includes("unfilled") || gradeType.includes("virgin")) && product.gf === 0) score += 5;

  if (factors === 0) return 0;
  return Math.round((score / factors) * 100);
}

function getTopMatches(d) {
  return PRODUCTS
    .map(p => ({ ...p, score: scoreProduct(p, d) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

// ─── AI prompt ────────────────────────────────────────────────────────────────
function buildPrompt(d, topMatches) {
  const portfolio = (d.portfolio||[]).filter(p=>p.name);
  const matchText = topMatches.length
    ? topMatches.map((p,i) => `${i+1}. ${p.name} (GF${p.gf}%) — match score: ${p.score}%`).join("\n")
    : "No property data entered for matching.";
  return `You are a PA6/PA66 polymer material expert. Analyse this customer profile and confirm or refine the product recommendation.

CUSTOMER: ${fv(d.custName)} | Industry: ${fv(d.industry)}
Part: ${fv(d.partName)} | Shape: ${fv(d.prodShape)} | Wall: ${fv(d.wallMin)}–${fv(d.wallMax)}mm
Barrel temps: ${[d.z1,d.z2,d.z3,d.z4,d.z5].filter(Boolean).join("/")}°C | Mold: ${fv(d.moldTemp)}°C
Back pressure: ${fv(d.backPress)}bar | Cycle: ${fv(d.cycleTime)}s
Drying: ${fv(d.dryTemp)}°C/${fv(d.dryTime)}h | Dryer: ${fv(d.dryerType)}
Regrind: ${fv(d.regrindPct)}% | Additives: ${fv(d.additives)}
Priorities: ${fv(d.rankList)} | Compliance: ${fv(d.compliance)}
Material base: ${fv(d.matBase)} | Grade type: ${fv(d.gradeType)}
Entered properties — Tensile: ${fv(d.tensileStrength)} MPa | Elongation: ${fv(d.elongation)}% | IZOD: ${fv(d.izodImpact)} J/m | SG: ${fv(d.specificGravity)} | GF: ${fv(d.glassFilled)}% | MFI: ${fv(d.mfi)} g/10min | FR: ${fv(d.flameRetardant)}
Visual defects: ${fv(d.visualDefects)}
Mechanical defects: ${fv(d.mechDefects)}
Failure: ${fv(d.failureDesc)} | Frequency: ${fv(d.probFreq)}
Recent changes: ${fv(d.recentChanges)}

PRE-MATCHED PRODUCTS FROM CATALOGUE (by property scoring):
${matchText}

Additional portfolio grades entered:
${portfolio.length ? portfolio.map(p=>`- ${p.name} (${p.type}): ${p.props}`).join("\n") : "None"}

Provide:
1. CONFIRMED PRODUCT NAME — confirm or adjust the #1 pre-matched product, stating the exact product name
2. WHY THIS PRODUCT — 3–4 specific technical reasons linked to the customer data
3. MATCH SCORE % — your assessed match (be realistic)
4. SECOND OPTION — backup product name with brief reason
5. PROCESSING TIPS — 3 specific parameter adjustments for this customer
6. ROOT CAUSE — of reported defects (2–3 lines)
7. RED FLAGS — any concerns about customer practice

Be specific. Always state the exact product name from the catalogue. Use clear headings.`;
}

const cardTitle = { fontSize:14, fontWeight:600, color:C.text, marginBottom:3, display:"flex", alignItems:"center", gap:7 };
const cardDesc  = { fontSize:12, color:C.muted, marginBottom:14 };

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { label:"Customer",      step:"Step 1" },
  { label:"Material",      step:"Step 2" },
  { label:"Properties",    step:"Step 3" },
  { label:"Problems",      step:"Step 4" },
  { label:"AI Recommend",  step:"Step 5" },
];

// ═════════════════════════════════════════════════════════════════════════════
// TAB COMPONENTS — outside App so React never remounts them on state change
// ═════════════════════════════════════════════════════════════════════════════
function Tab0({ d, set, goTab }) {
  return (
    <>
      <div style={card}>
        <div style={cardTitle}>👤 Customer &amp; product identity</div>
        <div style={cardDesc}>Who is the customer and what part are they making?</div>
        <div style={g2}>
          <div style={fw}><label style={labelSt}>Customer / company name *</label><input style={inp} value={d.custName||""} onChange={e=>set("custName",e.target.value)} placeholder="e.g. Reliance Industries" /></div>
          <div style={fw}><label style={labelSt}>Contact person &amp; designation</label><input style={inp} value={d.contact||""} onChange={e=>set("contact",e.target.value)} placeholder="Name, Manager" /></div>
        </div>
        <div style={fw}><label style={labelSt}>Industry / sector *</label><Chips options={["Textile","Automobile","Agriculture","Railways","Electronics","Electrical","Consumer goods","Packaging","Other"]} value={d.industry||[]} onChange={v=>set("industry",v)} /></div>
        <div style={g2}>
          <div style={fw}><label style={labelSt}>End product / part name *</label><input style={inp} value={d.partName||""} onChange={e=>set("partName",e.target.value)} placeholder="e.g. gear, connector housing" /></div>
          <div style={fw}><label style={labelSt}>Number of impressions in mold</label><input style={inp} type="number" value={d.impressions||""} onChange={e=>set("impressions",e.target.value)} placeholder="1, 2, 4, 8..." /></div>
        </div>
      </div>

      <div style={card}>
        <div style={cardTitle}>⚙️ Injection molding machine parameters</div>
        <div style={cardDesc}>Zone-wise barrel temperatures and machine settings</div>
        <div style={subTitleSt}>Barrel temperature — zone wise (°C)</div>
        <div style={g3}>
          {[["z1","Zone 1 — Feed","220"],["z2","Zone 2","240"],["z3","Zone 3","250"],["z4","Zone 4","255"],["z5","Zone 5 / Nozzle","258"],["moldTemp","Mold temperature","60"]].map(([id,lbl,ph])=>(
            <div key={id} style={fw}><label style={labelSt}>{lbl}</label><input style={inp} type="number" value={d[id]||""} onChange={e=>set(id,e.target.value)} placeholder={ph} /></div>
          ))}
        </div>
        <div style={dvdr} />
        <div style={g3}>
          {[["backPress","Back pressure (bar)","5–15"],["screwSpd","Screw speed (RPM)","80"],["injSpd","Injection speed (%)","60"],["holdPres","Holding pressure (bar)","40"],["coolTime","Cooling time (sec)","15"],["holdTime","Holding time (sec)","5"]].map(([id,lbl,ph])=>(
            <div key={id} style={fw}><label style={labelSt}>{lbl}</label><input style={inp} type="number" value={d[id]||""} onChange={e=>set(id,e.target.value)} placeholder={ph} /></div>
          ))}
        </div>
        <div style={fw}><label style={labelSt}>Total cycle time (sec)</label><input style={{...inp,maxWidth:160}} type="number" value={d.cycleTime||""} onChange={e=>set("cycleTime",e.target.value)} placeholder="35" /></div>
        <div style={dvdr} />
        <div style={g2}>
          <div style={fw}><label style={labelSt}>Runner system</label><Chips options={["Hot runner","Cold runner","3-plate mold"]} value={d.runner||[]} onChange={v=>set("runner",v)} single /></div>
          <div style={fw}><label style={labelSt}>Ejector type</label><Chips options={["Pin ejector","Air ejector","Stripper plate","Blade ejector"]} value={d.ejector||[]} onChange={v=>set("ejector",v)} single /></div>
          <div style={fw}><label style={labelSt}>Heating channels in mold?</label><Chips options={["Yes","No"]} value={d.heatCh||[]} onChange={v=>set("heatCh",v)} single /></div>
          <div style={fw}><label style={labelSt}>Cooling channels in mold?</label><Chips options={["Yes","No"]} value={d.coolCh||[]} onChange={v=>set("coolCh",v)} single /></div>
        </div>
      </div>

      <div style={card}>
        <div style={cardTitle}>🔷 Part geometry</div>
        <div style={g2}>
          <div style={fw}><label style={labelSt}>Product shape / form</label><Chips options={["3D complex","2D flat / panel","Rod / profile","Tubular"]} value={d.prodShape||[]} onChange={v=>set("prodShape",v)} /></div>
          <div style={fw}><label style={labelSt}>Approx. surface area (cm²)</label><input style={inp} type="number" value={d.surfArea||""} onChange={e=>set("surfArea",e.target.value)} placeholder="50" /></div>
          <div style={fw}><label style={labelSt}>Minimum wall thickness (mm)</label><input style={inp} type="number" value={d.wallMin||""} onChange={e=>set("wallMin",e.target.value)} placeholder="1.5" /></div>
          <div style={fw}><label style={labelSt}>Maximum wall thickness (mm)</label><input style={inp} type="number" value={d.wallMax||""} onChange={e=>set("wallMax",e.target.value)} placeholder="5.0" /></div>
        </div>
        <div style={fw}><label style={labelSt}>Mold age / condition</label><input style={inp} value={d.moldAge||""} onChange={e=>set("moldAge",e.target.value)} placeholder="e.g. 3 years / 500k shots" /></div>
      </div>

      <div style={card}>
        <div style={cardTitle}>⭐ Customer performance priorities</div>
        <div style={cardDesc}>Drag to reorder — top = most important</div>
        <RankList value={d.rankList||[]} onChange={v=>set("rankList",v)} />
        <div style={{...fw,marginTop:12}}><label style={labelSt}>Surface gloss requirement</label><Chips options={["High gloss","Semi-gloss","Matte","Textured","Not critical"]} value={d.gloss||[]} onChange={v=>set("gloss",v)} single /></div>
      </div>

      <div style={{ display:"flex", gap:8, marginTop:16 }}>
        <button onClick={()=>goTab(1)} style={mkBtn(C.navy)}>Next: Material Review →</button>
      </div>
    </>
  );
}

function Tab1({ d, set, goTab }) {
  return (
    <>
      <div style={card}>
        <div style={cardTitle}>🔧 Material grade &amp; supply</div>
        <div style={g2}>
          <div style={fw}>
            <label style={labelSt}>Material base *</label>
            <Chips options={["PA6","PA66","PA6/66 blend"]} value={d.matBase||[]} onChange={v=>set("matBase",v)} single />
            {(d.matBase||[]).length === 0 || (d.matBase||[]).includes("Other") ? null : null}
            <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:8 }}>
              <input
                style={{...inp, maxWidth:220}}
                value={d.matBaseOther||""}
                onChange={e=>set("matBaseOther",e.target.value)}
                placeholder="Other material (type here)"
              />
            </div>
          </div>
          <div style={fw}><label style={labelSt}>Grade type *</label><Chips options={["Unfilled virgin","GF15","GF30","GF50","Reprocessed unfilled","Reprocessed GF","Flame retardant","Mineral filled"]} value={d.gradeType||[]} onChange={v=>set("gradeType",v)} /></div>
        </div>
        <div style={g2}>
          <div style={fw}><label style={labelSt}>Our grade / product name</label><input style={inp} value={d.gradeName||""} onChange={e=>set("gradeName",e.target.value)} placeholder="e.g. PA66-GF30 Grade A" /></div>
          <div style={fw}><label style={labelSt}>Reprocessing cycles</label><input style={inp} type="number" value={d.reprocessCycles||""} onChange={e=>set("reprocessCycles",e.target.value)} placeholder="1, 2, 3..." /></div>
          <div style={fw}><label style={labelSt}>Batch / lot reference</label><input style={inp} value={d.batchRef||""} onChange={e=>set("batchRef",e.target.value)} placeholder="Batch no. or date code" /></div>
          <div style={fw}><label style={labelSt}>Monthly volume requirement (MT)</label><input style={inp} type="number" value={d.volReq||""} onChange={e=>set("volReq",e.target.value)} placeholder="5" /></div>
        </div>
        <div style={fw}><label style={labelSt}>Compliance / regulatory requirements</label><Chips options={["RoHS","REACH","UL94","FDA food contact","BIS / ISI","IATF 16949","None stated"]} value={d.compliance||[]} onChange={v=>set("compliance",v)} /></div>
      </div>

      <div style={card}>
        <div style={cardTitle}>💧 Drying &amp; material preparation</div>
        <div style={cardDesc}>Most PA6/PA66 defects trace back to drying practice</div>
        <div style={g3}>
          <div style={fw}><label style={labelSt}>Drying temperature (°C)</label><input style={inp} type="number" value={d.dryTemp||""} onChange={e=>set("dryTemp",e.target.value)} placeholder="85" /></div>
          <div style={fw}><label style={labelSt}>Drying time (hours)</label><input style={inp} type="number" value={d.dryTime||""} onChange={e=>set("dryTime",e.target.value)} placeholder="6" /></div>
          <div style={fw}><label style={labelSt}>Dryer type</label><Chips options={["Dehumidifying hopper","Hot air tray","Vacuum dryer","No drying done"]} value={d.dryerType||[]} onChange={v=>set("dryerType",v)} single /></div>
        </div>
        <div style={g2}>
          <div style={fw}><label style={labelSt}>Regrind % at customer end</label><input style={inp} type="number" value={d.regrindPct||""} onChange={e=>set("regrindPct",e.target.value)} placeholder="0" /></div>
          <div style={fw}><label style={labelSt}>Masterbatch / additives added</label><input style={inp} value={d.additives||""} onChange={e=>set("additives",e.target.value)} placeholder="Color MB, UV stabiliser..." /></div>
          <div style={fw}><label style={labelSt}>Mold release agent</label><Chips options={["Silicone spray","Wax based","None","Internal (in material)"]} value={d.moldRelease||[]} onChange={v=>set("moldRelease",v)} single /></div>
          <div style={fw}><label style={labelSt}>Post-mold operations</label><Chips options={["Moisture conditioning","Annealing","Painting","Welding","Insert molding"]} value={d.postMold||[]} onChange={v=>set("postMold",v)} /></div>
        </div>
        <div style={fw}><label style={labelSt}>Storage conditions at customer site</label><textarea style={{...inp,resize:"vertical",minHeight:60}} value={d.storageCond||""} onChange={e=>set("storageCond",e.target.value)} placeholder="Sealed bags, temperature controlled warehouse..." /></div>
      </div>

      <div style={card}>
        <div style={cardTitle}>📋 Documentation required</div>
        <Chips options={["TDS","MSDS / SDS","COA","MFI test report","Tensile / impact report","Declaration of conformity","None"]} value={d.docNeeds||[]} onChange={v=>set("docNeeds",v)} />
      </div>

      <div style={{ display:"flex", gap:8, marginTop:16 }}>
        <button onClick={()=>goTab(0)} style={mkBtn("#fff","#333",{border:`1px solid ${C.border}`})}>← Back</button>
        <button onClick={()=>goTab(2)} style={mkBtn(C.navy)}>Next: Problems →</button>
      </div>
    </>
  );
}

function Tab2({ d, set, goTab }) {
  return (
    <>
      <div style={card}>
        <div style={cardTitle}>🧪 Material properties</div>
        <div style={cardDesc}>Enter the key physical and mechanical property values for the grade being reviewed.</div>
        <div style={g3}>
          <div style={fw}>
            <label style={labelSt}>Tensile Strength (MPa)</label>
            <input style={inp} type="number" value={d.tensileStrength||""} onChange={e=>set("tensileStrength",e.target.value)} placeholder="e.g. 85" />
          </div>
          <div style={fw}>
            <label style={labelSt}>Elongation (%)</label>
            <input style={inp} type="number" value={d.elongation||""} onChange={e=>set("elongation",e.target.value)} placeholder="e.g. 3.5" />
          </div>
          <div style={fw}>
            <label style={labelSt}>IZOD Impact (J/m)</label>
            <input style={inp} type="number" value={d.izodImpact||""} onChange={e=>set("izodImpact",e.target.value)} placeholder="e.g. 60" />
          </div>
          <div style={fw}>
            <label style={labelSt}>Specific Gravity</label>
            <input style={inp} type="number" step="0.001" value={d.specificGravity||""} onChange={e=>set("specificGravity",e.target.value)} placeholder="e.g. 1.35" />
          </div>
          <div style={fw}>
            <label style={labelSt}>Glass Filled (%)</label>
            <input style={inp} type="number" value={d.glassFilled||""} onChange={e=>set("glassFilled",e.target.value)} placeholder="e.g. 30" />
          </div>
          <div style={fw}>
            <label style={labelSt}>FR — Flame Retardant</label>
            <Chips options={["Yes","No","Halogen free","UL94 V0","UL94 V1","UL94 V2"]} value={d.flameRetardant||[]} onChange={v=>set("flameRetardant",v)} single />
          </div>
          <div style={fw}>
            <label style={labelSt}>MFI — Melt Flow Index (g/10min)</label>
            <input style={inp} type="number" step="0.1" value={d.mfi||""} onChange={e=>set("mfi",e.target.value)} placeholder="e.g. 14" />
          </div>
        </div>
      </div>

      <div style={{ display:"flex", gap:8, marginTop:16 }}>
        <button onClick={()=>goTab(1)} style={mkBtn("#fff","#333",{border:`1px solid ${C.border}`})}>← Back</button>
        <button onClick={()=>goTab(3)} style={mkBtn(C.navy)}>Next: Problems →</button>
      </div>
    </>
  );
}

function Tab3({ d, set, goTab }) {
  return (
    <>
      <div style={card}>
        <div style={cardTitle}>🔍 Testing &amp; quality checks</div>
        <div style={fw}><label style={labelSt}>Incoming material tests done</label><Chips options={["MFI","Moisture content","Tensile strength","Impact strength","HDT","Color / appearance","No testing"]} value={d.incomingTests||[]} onChange={v=>set("incomingTests",v)} /></div>
        <div style={fw}><label style={labelSt}>Finished part tests done</label><Chips options={["Dimensional check","Pull / burst test","Drop / impact test","UV aging","Chemical resistance","Flammability UL94","No testing"]} value={d.finishedTests||[]} onChange={v=>set("finishedTests",v)} /></div>
        <div style={g2}>
          <div style={fw}><label style={labelSt}>Failure detected at stage</label><Chips options={["During molding","After demolding","During assembly","In field / end use"]} value={d.failureStage||[]} onChange={v=>set("failureStage",v)} single /></div>
          <div style={fw}><label style={labelSt}>Rejection / failure rate (%)</label><input style={inp} type="number" value={d.rejRate||""} onChange={e=>set("rejRate",e.target.value)} placeholder="5" /></div>
        </div>
      </div>

      <div style={card}>
        <div style={cardTitle}>⚠️ Defects observed</div>
        <div style={{marginBottom:12}}>
          <div style={subTitleSt}>Visual / surface defects</div>
          <Chips options={["Sink marks","Short shots","Flash / burr","Weld line visible","Discoloration / yellowing","Burn marks / black specks","Silver streaks / splay","Delamination (GF)","Poor gloss / dull","Fiber exposure (GF)"]} value={d.visualDefects||[]} onChange={v=>set("visualDefects",v)} />
        </div>
        <div>
          <div style={subTitleSt}>Mechanical / structural defects</div>
          <Chips options={["Brittleness","Warpage / distortion","Dimensional variation","Weld line cracking","Snap-fit / clip breakage","Poor impact resistance","Low elongation"]} value={d.mechDefects||[]} onChange={v=>set("mechDefects",v)} />
        </div>
        <div style={{...fw,marginTop:12}}>
          <label style={labelSt}>Describe the exact failure in detail</label>
          <textarea style={{...inp,resize:"vertical",minHeight:60}} value={d.failureDesc||""} onChange={e=>set("failureDesc",e.target.value)} placeholder="e.g. Weld line cracks at snap-fit area during assembly. Batch Jan 2026..." />
        </div>
        <div style={g2}>
          <div style={fw}><label style={labelSt}>When did the problem start?</label><input style={inp} value={d.probStart||""} onChange={e=>set("probStart",e.target.value)} placeholder="e.g. Jan 2026, after new batch" /></div>
          <div style={fw}><label style={labelSt}>Problem frequency</label><Chips options={["Every batch","Intermittent","Certain cavities only","Startup related"]} value={d.probFreq||[]} onChange={v=>set("probFreq",v)} single /></div>
        </div>
        <div style={fw}><label style={labelSt}>Recent changes at customer end</label><Chips options={["Material supplier changed","New machine","Processing parameters changed","New / repaired mold","Masterbatch changed","Nothing changed"]} value={d.recentChanges||[]} onChange={v=>set("recentChanges",v)} /></div>
      </div>

      <div style={{ display:"flex", gap:8, marginTop:16 }}>
        <button onClick={()=>goTab(2)} style={mkBtn("#fff","#333",{border:`1px solid ${C.border}`})}>← Back</button>
        <button onClick={()=>goTab(4)} style={mkBtn(C.violet,undefined,{fontSize:14,padding:"10px 22px"})}>✦ Get AI Recommendation →</button>
      </div>
    </>
  );
}

function Tab4({ d, set, goTab, runAI, aiLoading, aiResult, manualSave, saveMsg, showToast }) {
    const topMatches = getTopMatches(d);
    const hasProps = [d.tensileStrength, d.elongation, d.izodImpact, d.specificGravity, d.glassFilled].some(v => v !== undefined && v !== "");
    return (
      <>
        {/* ── Product Match Card ── */}
        <div style={{ background:"linear-gradient(135deg,#0C447C,#1565a8)", borderRadius:12, padding:18, marginBottom:14, color:"#fff" }}>
          <div style={{ fontSize:13, fontWeight:600, opacity:0.8, marginBottom:10, letterSpacing:0.5, textTransform:"uppercase" }}>🎯 Recommended Product from Catalogue</div>
          {!hasProps ? (
            <div style={{ fontSize:13, opacity:0.75 }}>Fill in the Properties step (Step 3) to get an instant product match from the datasheet.</div>
          ) : (
            <>
              <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:10, padding:"14px 16px", marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
                  <div>
                    <div style={{ fontSize:22, fontWeight:800, letterSpacing:-0.5 }}>{topMatches[0]?.name}</div>
                    <div style={{ fontSize:12, opacity:0.8, marginTop:3 }}>GF {topMatches[0]?.gf}% &nbsp;|&nbsp; Tensile {topMatches[0]?.tensile[0]}–{topMatches[0]?.tensile[1]} &nbsp;|&nbsp; IZOD {topMatches[0]?.izod[0]}–{topMatches[0]?.izod[1]}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:26, fontWeight:800 }}>{topMatches[0]?.score}%</div>
                    <div style={{ fontSize:11, opacity:0.7 }}>match score</div>
                  </div>
                </div>
                <div style={{ background:"rgba(255,255,255,0.2)", borderRadius:3, height:4, marginTop:10 }}>
                  <div style={{ height:4, borderRadius:3, background:"#7dd3fc", width:`${topMatches[0]?.score||0}%` }} />
                </div>
              </div>
              {topMatches.slice(1).map((p, i) => (
                <div key={p.name} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,0.08)", borderRadius:8, padding:"10px 14px", marginBottom:6 }}>
                  <div>
                    <span style={{ fontSize:11, opacity:0.6, marginRight:6 }}>#{i+2}</span>
                    <span style={{ fontSize:14, fontWeight:600 }}>{p.name}</span>
                    <span style={{ fontSize:11, opacity:0.7, marginLeft:8 }}>GF {p.gf}%</span>
                  </div>
                  <div style={{ fontSize:14, fontWeight:600 }}>{p.score}%</div>
                </div>
              ))}
              <div style={{ fontSize:11, opacity:0.6, marginTop:8 }}>Matched against 25 products from your datasheet. Use AI analysis below for deeper insight.</div>
            </>
          )}
        </div>

        {/* ── Portfolio ── */}
        <div style={card}>
          <div style={cardTitle}>💡 Your product portfolio</div>
          <div style={cardDesc}>Add your grades — the AI will confirm or refine the match above.</div>
          <PortfolioBuilder value={d.portfolio||[]} onChange={v=>set("portfolio",v)} />
        </div>

        {/* ── Recommended params ── */}
        <div style={card}>
          <div style={cardTitle}>📋 Recommended parameters &amp; action items</div>
          <div style={g2}>
            <div style={fw}><label style={labelSt}>Recommended drying temp (°C)</label><input style={inp} type="number" value={d.recDryTemp||""} onChange={e=>set("recDryTemp",e.target.value)} placeholder="85" /></div>
            <div style={fw}><label style={labelSt}>Recommended drying time (hrs)</label><input style={inp} type="number" value={d.recDryTime||""} onChange={e=>set("recDryTime",e.target.value)} placeholder="6" /></div>
            <div style={fw}><label style={labelSt}>Recommended melt temp range (°C)</label><input style={inp} value={d.recMeltTemp||""} onChange={e=>set("recMeltTemp",e.target.value)} placeholder="240–260" /></div>
            <div style={fw}><label style={labelSt}>Max regrind % recommendation</label><input style={inp} type="number" value={d.recRegrind||""} onChange={e=>set("recRegrind",e.target.value)} placeholder="10" /></div>
          </div>
          <div style={fw}><label style={labelSt}>Action items / follow up</label><textarea style={{...inp,resize:"vertical",minHeight:70}} value={d.actionItems||""} onChange={e=>set("actionItems",e.target.value)} placeholder={"1. Send 25kg trial sample by DD/MM\n2. Technical visit to review drying setup..."} /></div>
          <div style={g2}>
            <div style={fw}><label style={labelSt}>Reviewed by</label><input style={inp} value={d.reviewer||""} onChange={e=>set("reviewer",e.target.value)} placeholder="Your name and designation" /></div>
            <div style={fw}><label style={labelSt}>Review date</label><input style={inp} value={d.reviewDate||""} onChange={e=>set("reviewDate",e.target.value)} placeholder="DD/MM/YYYY" /></div>
          </div>
        </div>

        {/* ── Save strip ── */}
        <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 18px", marginBottom:14 }}>
          <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:10 }}>💾 Save &amp; Export</div>
          <div style={{ fontSize:12, color:C.muted, marginBottom:12 }}>
            <a href={SHEET_LINK} target="_blank" rel="noreferrer" style={{ color:C.navy, fontWeight:600 }}>Open Google Sheet ↗</a>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <button onClick={()=>goTab(3)} style={mkBtn("#fff","#333",{border:`1px solid ${C.border}`})}>← Back</button>
            <button onClick={manualSave} style={mkBtn(C.teal)}>💾 Save to Google Sheets</button>
            <button onClick={()=>{ exportExcel(d); showToast("Excel downloaded!"); }} style={mkBtn(C.navy)}>⬇ Export Excel</button>
          </div>
          {saveMsg && (
            <div style={{ marginTop:10, fontSize:12, color: saveMsg.startsWith("✓") ? C.teal : saveMsg.startsWith("Saving") ? C.muted : C.danger }}>{saveMsg}</div>
          )}
        </div>
      </>
    );
  };

// ═════════════════════════════════════════════════════════════════════════════
// APP
// ═════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab]           = useState(0);
  const [d, setD]               = useState(() => { try { return JSON.parse(localStorage.getItem("pa6_data")||"{}")||{}; } catch { return {}; } });
  const [showModal, setShowModal]= useState(false);
  const [connected, setConnected]= useState(true);
  const [aiLoading, setAiLoading]= useState(false);
  const [aiResult, setAiResult]  = useState("");
  const [saveMsg, setSaveMsg]    = useState("");
  const [toast, setToast]        = useState("");

  const pct = useMemo(() => calcProgress(d), [d]);

  const set = (k, v) => setD(prev => ({ ...prev, [k]: v }));

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const goTab = (next) => {
    localStorage.setItem("pa6_data", JSON.stringify(d));
    setTab(next);
  };

  const manualSave = async () => {
    setSaveMsg("Saving...");
    const r = await pushToSheet(d);
    setSaveMsg(r.ok ? `✓ ${r.msg}` : r.msg === "not_configured" ? "⚠ Connect Google Sheets first" : `⚠ ${r.msg}`);
    localStorage.setItem("pa6_data", JSON.stringify(d));
  };

  const handleSheetsClose = (saved) => {
    setShowModal(false);
    if (saved) showToast("✓ Google Sheets connected!");
  };

  const runAI = async () => {
    const apiKey = import.meta.env.VITE_OPENAI_KEY;
    if (!apiKey) { setAiResult("No API key set. Add VITE_OPENAI_KEY to your .env file."); return; }
    setAiLoading(true); setAiResult("");
    try {
      const topMatches = getTopMatches(d);
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: "gpt-4o", messages: [{ role: "user", content: buildPrompt(d, topMatches) }], max_tokens: 900 }),
      });
      const j = await res.json();
      setAiResult(j.choices?.[0]?.message?.content || "No response.");
    } catch (e) { setAiResult(`Error: ${e.message}`); }
    setAiLoading(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background:C.bg, color:C.text, fontSize:15, minHeight:"100vh" }}>

      {/* Top bar */}
      <div style={{ background:C.navy, color:"#fff", padding:"14px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100, boxShadow:"0 2px 8px rgba(0,0,0,0.2)" }}>
        <div>
          <div style={{ fontSize:17, fontWeight:600 }}>PA6 / PA66 Smart Review</div>
          <div style={{ fontSize:12, opacity:0.7, marginTop:2 }}>Unfilled · Glass Filled · Reprocessed · AI Product Match</div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {connected
            ? <a href={SHEET_LINK} target="_blank" rel="noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", background:"#E1F5EE", borderRadius:6, fontSize:12, color:C.teal, fontWeight:500, textDecoration:"none" }}>✓ Sheet connected ↗</a>
            : null
          }
          <button onClick={()=>setShowModal(true)} style={mkBtn("#fff","#333",{fontSize:12,padding:"6px 12px",border:`1px solid ${C.border}`})}>
            {connected ? "⚙ Sheets Setup" : "🔗 Connect Google Sheets"}
          </button>
        </div>
      </div>

      {/* Banner when not connected */}
      {!connected && (
        <div style={{ background:"#E6F1FB", borderBottom:`1px solid #B5D4F4`, padding:"10px 24px", fontSize:13, color:C.navy, display:"flex", alignItems:"center", gap:10 }}>
          ⚠ Google Sheets not connected — responses won't be saved until you connect.{" "}
          <a href="#" onClick={e=>{e.preventDefault();setShowModal(true);}} style={{ color:C.navy, fontWeight:600 }}>Connect now →</a>
        </div>
      )}

      <div style={{ maxWidth:820, margin:"0 auto", padding:"20px 16px 60px" }}>

        {/* Progress */}
        <div style={{ background:"#e0e3e8", height:5, borderRadius:3, marginBottom:18, overflow:"hidden" }}>
          <div style={{ height:"100%", background:C.navy, borderRadius:3, width:`${pct}%`, transition:"width .4s" }} />
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:4, marginBottom:20, background:"#fff", padding:6, borderRadius:10, border:`1px solid ${C.border}` }}>
          {TABS.map((t,i) => (
            <button key={i} onClick={()=>goTab(i)} style={{
              flex:1, padding:"8px 4px", borderRadius:7, border:"none",
              background: tab===i ? C.navy : "transparent",
              color: tab===i ? "#fff" : "#666",
              cursor:"pointer", fontSize:12, fontWeight:500, textAlign:"center", lineHeight:1.3,
            }}>
              <span style={{ display:"block", fontSize:10, opacity:0.7, marginBottom:2 }}>{t.step}</span>
              {t.label}
            </button>
          ))}
        </div>



        {tab === 0 && <Tab0 d={d} set={set} goTab={goTab} />}
        {tab === 1 && <Tab1 d={d} set={set} goTab={goTab} />}
        {tab === 2 && <Tab2 d={d} set={set} goTab={goTab} />}
        {tab === 3 && <Tab3 d={d} set={set} goTab={goTab} />}
        {tab === 4 && <Tab4 d={d} set={set} goTab={goTab} runAI={runAI} aiLoading={aiLoading} aiResult={aiResult} manualSave={manualSave} saveMsg={saveMsg} showToast={showToast} />}
      </div>

      {showModal && <SheetsModal onClose={handleSheetsClose} />}
      <Toast msg={toast} />
    </div>
  );
}
