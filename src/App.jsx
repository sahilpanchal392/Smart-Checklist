import { useState, useRef, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_URL from "./api";
import * as XLSX from "xlsx";
import polycomLogo from "./assets/images/POLYCOML_LOGO.png";

const SHEET_URL = "https://script.google.com/macros/s/AKfycbwDGcW58xYAKI0FGOkj1RjVeQ1Z3aNCREkIzR0mjEJ-22kDhYXhmesvWX_trYQSvxBr/exec";
const SHEET_LINK = "https://docs.google.com/spreadsheets/d/1lc9C2tS7fa4rjhG7GonMyd-QkP8Ai9nfCKrtAFIpG10/edit";

const P = {
  red:"#E8001C",   redD:"#b3000f",  redL:"#1a0305",
  bg:"#0a0a0a",    surface:"#0d0d0d", surface2:"#111111",
  border:"#1e1e1e", border2:"#2a2a2a",
  text:"#ffffff",   muted:"#888888",   subtle:"#444444",
};

const STEP_COLORS = [P.red, P.red, P.red, P.red, P.red];

const inp = {
  width:"100%", border:`1.5px solid ${P.border}`,
  padding:"10px 13px", fontSize:13.5, background:P.surface2, color:P.text,
  fontFamily:"inherit", outline:"none", boxSizing:"border-box",
  transition:"border-color .18s",
};
const mkBtn = (bg, color="#fff", extra={}) => ({
  padding:"10px 22px", fontSize:13.5, fontWeight:600,
  cursor:"pointer", border:"none", background:bg, color,
  display:"inline-flex", alignItems:"center", gap:7,
  transition:"opacity .15s, transform .12s", ...extra,
});
const card  = { background:"rgba(13,13,13,0.7)", border:`1px solid ${P.border}`, padding:"22px 24px", marginBottom:14 };
const lbl   = { fontSize:12, color:P.muted, marginBottom:5, display:"block", fontWeight:600, letterSpacing:"0.3px" };
const fw    = { marginBottom:14 };
const g2    = { display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 };
const g3    = { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 };
const dvdr  = { height:1, background:P.border, margin:"16px 0" };
const secHd = { fontSize:11, fontWeight:700, color:P.muted, marginBottom:12, textTransform:"uppercase", letterSpacing:"0.8px", display:"flex", alignItems:"center", gap:6 };

const fv = (v) => { if (!v) return ""; if (Array.isArray(v)) return v.join(", "); return String(v); };

function calcProgress(d) {
  const keys = ["custName","partName","industry","matBase","gradeType","z1","z5","dryTemp","dryTime","visualDefects","failureDesc"];
  const filled = keys.filter(k=>{ const v=d[k]; return v&&(Array.isArray(v)?v.length>0:String(v).trim()!==""); }).length;
  return Math.round((filled/keys.length)*100);
}

function buildSheetRow(d) {
  return {
    "Timestamp": new Date().toLocaleString("en-IN"),
    "[S1] Customer Name":fv(d.custName), "[S1] Contact":fv(d.contact),
    "[S1] Industry":fv(d.industry), "[S1] Industry Other":fv(d.industryOther),
    "[S1] Part Name":fv(d.partName), "[S1] Impressions":fv(d.impressions),
    "[S1] Product Shape":fv(d.prodShape), "[S1] Surface Area cm2":fv(d.surfArea),
    "[S1] Min Wall mm":fv(d.wallMin), "[S1] Max Wall mm":fv(d.wallMax),
    "[S1] Mold Age":fv(d.moldAge), "[S1] Priorities":fv(d.rankList), "[S1] Gloss":fv(d.gloss),
    "[S2] Material Base":fv(d.matBase), "[S2] Mat Other":fv(d.matBaseOther),
    "[S2] Grade Type":fv(d.gradeType), "[S2] Grade Name":fv(d.gradeName),
    "[S2] Reprocess Cycles":fv(d.reprocessCycles), "[S2] Batch Ref":fv(d.batchRef),
    "[S2] Volume MT/mo":fv(d.volReq), "[S2] Compliance":fv(d.compliance),
    "[S2] Dry Temp °C":fv(d.dryTemp), "[S2] Dry Time hrs":fv(d.dryTime),
    "[S2] Dryer Type":fv(d.dryerType), "[S2] Regrind %":fv(d.regrindPct),
    "[S2] Additives":fv(d.additives), "[S2] Mold Release":fv(d.moldRelease),
    "[S2] Post Mold":fv(d.postMold), "[S2] Storage":fv(d.storageCond), "[S2] Docs":fv(d.docNeeds),
    "[S2] Z1 °C":fv(d.z1), "[S2] Z2 °C":fv(d.z2), "[S2] Z3 °C":fv(d.z3),
    "[S2] Z4 °C":fv(d.z4), "[S2] Z5 °C":fv(d.z5), "[S2] Mold Temp °C":fv(d.moldTemp),
    "[S2] Back Press bar":fv(d.backPress), "[S2] Screw RPM":fv(d.screwSpd),
    "[S2] Inj Speed %":fv(d.injSpd), "[S2] Hold Press bar":fv(d.holdPres),
    "[S2] Cool Time s":fv(d.coolTime), "[S2] Hold Time s":fv(d.holdTime),
    "[S2] Cycle Time s":fv(d.cycleTime), "[S2] Runner":fv(d.runner), "[S2] Ejector":fv(d.ejector),
    "[S3] Incoming Tests":fv(d.incomingTests), "[S3] Finished Tests":fv(d.finishedTests),
    "[S3] Failure Stage":fv(d.failureStage), "[S3] Rejection %":fv(d.rejRate),
    "[S3] Visual Defects":fv(d.visualDefects), "[S3] Mech Defects":fv(d.mechDefects),
    "[S3] Failure Desc":fv(d.failureDesc), "[S3] Prob Started":fv(d.probStart),
    "[S3] Prob Freq":fv(d.probFreq), "[S3] Recent Changes":fv(d.recentChanges),
    "[S4] Tensile MPa":fv(d.tensileStrength), "[S4] Elongation %":fv(d.elongation),
    "[S4] IZOD J/m":fv(d.izodImpact), "[S4] Sp Gravity":fv(d.specificGravity),
    "[S4] GF %":fv(d.glassFilled), "[S4] FR":fv(d.flameRetardant), "[S4] MFI":fv(d.mfi),
    "[S5] Portfolio":(d.portfolio||[]).filter(p=>p.name).map(p=>`${p.name}(${p.type})`).join(" | "),
    "[S5] Rec Dry Temp":fv(d.recDryTemp), "[S5] Rec Dry Time":fv(d.recDryTime),
    "[S5] Rec Melt Temp":fv(d.recMeltTemp), "[S5] Rec Regrind":fv(d.recRegrind),
    "[S5] Actions":fv(d.actionItems), "[S5] Reviewed By":fv(d.reviewer), "[S5] Date":fv(d.reviewDate),
  };
}

async function pushToSheet(d) {
  try {
    await fetch(SHEET_URL, { method:"POST", mode:"no-cors", headers:{"Content-Type":"application/json"}, body:JSON.stringify(buildSheetRow(d)) });
    return { ok:true };
  } catch(err) { return { ok:false, msg:err.message }; }
}

function exportExcel(d) {
  const row = buildSheetRow(d);
  const wb  = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet([["Field","Value"],...Object.entries(row).map(([k,v])=>[k,v])]);
  ws1["!cols"] = [{wch:34},{wch:60}];
  XLSX.utils.book_append_sheet(wb, ws1, "Review Summary");
  XLSX.writeFile(wb, `PA6_Review_${(fv(d.custName)||"Customer").replace(/\s+/g,"_")}_${new Date().toISOString().slice(0,10)}.xlsx`);
}

const APPS_SCRIPT = `function doPost(e) {
  var ss    = SpreadsheetApp.openById("1lc9C2tS7fa4rjhG7GonMyd-QkP8Ai9nfCKrtAFIpG10");
  var sheet = ss.getSheetByName("Responses") || ss.insertSheet("Responses");
  var data  = JSON.parse(e.postData.contents);
  var keys  = Object.keys(data); var vals = Object.values(data);
  if (sheet.getLastRow() === 0) { sheet.appendRow(keys); sheet.setFrozenRows(1); sheet.getRange(1,1,1,keys.length).setFontWeight("bold"); }
  sheet.appendRow(vals);
  return ContentService.createTextOutput(JSON.stringify({status:"success"})).setMimeType(ContentService.MimeType.JSON);
}`;

// ── Chips with "Other" textbox ─────────────────────────────────────────────
function Chips({ options, value=[], onChange, single=false, otherVal, onOtherChange }) {
  const otherSelected = value.includes("Other");
  const toggle = (o) => {
    if (single) onChange(value[0]===o ? [] : [o]);
    else onChange(value.includes(o) ? value.filter(v=>v!==o) : [...value, o]);
  };
  return (
    <div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
        {options.map(o => {
          const on = value.includes(o);
          return (
            <button key={o} type="button" onClick={()=>toggle(o)} style={{
              padding:"5px 13px", fontSize:12.5, cursor:"pointer", userSelect:"none",
              background: on ? P.red : P.surface2,
              border:`1.5px solid ${on ? P.red : P.border}`,
              color: on ? "#fff" : P.muted, fontWeight: on ? 600 : 400,
              transition:"all .15s",
            }}>{o}</button>
          );
        })}
      </div>
      {otherSelected && onOtherChange && (
        <input style={{...inp, marginTop:8, maxWidth:300}} value={otherVal||""} onChange={e=>onOtherChange(e.target.value)} placeholder="Please specify..." />
      )}
    </div>
  );
}

// ── Drag-to-rank ──────────────────────────────────────────────────────────
const DEFAULT_RANK = ["Mechanical strength","Surface finish / optical","Dimensional accuracy","Impact resistance","Heat resistance","Chemical / moisture resistance","Color consistency","Price / cost sensitivity"];
const RANK_COLORS  = [P.indigo,P.teal,P.violet,P.amber,"#10B981","#3B82F6","#EC4899","#F59E0B"];
function RankList({ value, onChange }) {
  const src = useRef(null);
  const items = value.length ? value : DEFAULT_RANK;
  const onDrop = (e,i) => {
    e.preventDefault();
    if (src.current===null||src.current===i) return;
    const next=[...items]; const [m]=next.splice(src.current,1); next.splice(i,0,m);
    onChange(next); src.current=null;
  };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      {items.map((item,i) => (
        <div key={item} draggable onDragStart={()=>{src.current=i;}} onDragOver={e=>e.preventDefault()} onDrop={e=>onDrop(e,i)}
          style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 13px", background:i===0?P.redL:P.surface2, fontSize:13, cursor:"grab", border:`1.5px solid ${i===0?P.red:P.border}`, transition:"all .15s" }}>
          <span style={{ width:22,height:22,background:P.red,color:"#fff",fontSize:11,fontWeight:700,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>{i+1}</span>
          <span style={{ flex:1,color:i===0?P.red:P.text }}>{item}</span>
          <span style={{ color:P.subtle,fontSize:13 }}>⠿</span>
        </div>
      ))}
    </div>
  );
}

// ── Portfolio builder ─────────────────────────────────────────────────────
const GRADE_OPTS = ["PA6 Unfilled","PA6 GF15","PA6 GF30","PA6 GF50","PA66 Unfilled","PA66 GF15","PA66 GF30","PA66 GF50","PA6 Reprocessed","PA66 Reprocessed","PA6 FR","PA66 FR"];
function PortfolioBuilder({ value, onChange }) {
  const rows = value.length ? value : [{name:"",type:"PA66 GF30",props:""}];
  const upd=(i,k,v)=>onChange(rows.map((r,ri)=>ri===i?{...r,[k]:v}:r));
  const add=()=>onChange([...rows,{name:"",type:"PA66 GF30",props:""}]);
  const rm=(i)=>{ if(rows.length>1) onChange(rows.filter((_,ri)=>ri!==i)); };
  return (
    <div>
      {rows.map((row,i) => (
        <div key={i} className="portfolio-row">
          <div>{i===0&&<div style={lbl}>Grade name</div>}<input style={inp} value={row.name} onChange={e=>upd(i,"name",e.target.value)} placeholder="PA66-GF30-A" /></div>
          <div>{i===0&&<div style={lbl}>Type</div>}<select style={inp} value={row.type} onChange={e=>upd(i,"type",e.target.value)}>{GRADE_OPTS.map(o=><option key={o}>{o}</option>)}</select></div>
          <div>{i===0&&<div style={lbl}>Key properties / notes</div>}<input style={inp} value={row.props} onChange={e=>upd(i,"props",e.target.value)} placeholder="High flow, MFI 14..." /></div>
          <div style={{paddingTop:i===0?20:0}}><button type="button" onClick={()=>rm(i)} style={mkBtn("#fff","#888",{border:`1.5px solid ${P.border}`,padding:"9px 12px"})}>✕</button></div>
        </div>
      ))}
      <button type="button" onClick={add} style={mkBtn(P.surface2, P.muted, {border:`1px solid ${P.border}`,fontSize:12.5,marginTop:2})}>+ Add grade</button>
    </div>
  );
}

// ── Product scoring ───────────────────────────────────────────────────────
const PRODUCTS = [
  {name:"100 NL/BK",gf:0,tensile:[650,850],elongation:[15,45],izod:[3,5],sg:[1.10,1.14]},
  {name:"1315 NL/BK",gf:15,tensile:[950,1250],elongation:[8,14],izod:[3,8],sg:[1.20,1.24]},
  {name:"1330 AK",gf:30,tensile:[1450,1650],elongation:[6,12],izod:[7,11],sg:[1.34,1.38]},
  {name:"1330 BW",gf:30,tensile:[1600,1800],elongation:[6,12],izod:[6,12],sg:[1.34,1.38]},
  {name:"1350 NL/BK",gf:50,tensile:[1850,2150],elongation:[5,11],izod:[15,20],sg:[1.50,1.62]},
  {name:"200 NL/BK",gf:0,tensile:[650,850],elongation:[8,99],izod:[3,5],sg:[1.10,1.14]},
  {name:"2315 NL/BK",gf:15,tensile:[1050,1350],elongation:[4,99],izod:[3,9],sg:[1.20,1.24]},
  {name:"2330 NL/BK",gf:30,tensile:[1550,1850],elongation:[4,99],izod:[9,12],sg:[1.34,1.38]},
  {name:"2350 NL/BK",gf:50,tensile:[2000,2200],elongation:[4,14],izod:[10,15],sg:[1.53,1.59]},
  {name:"1330 NL E",gf:30,tensile:[1300,1500],elongation:[7,13],izod:[3,5],sg:[1.34,1.38]},
  {name:"2330 NL E",gf:30,tensile:[1350,1550],elongation:[7,99],izod:[6,9],sg:[1.34,1.38]},
  {name:"1330 BK P",gf:30,tensile:[1300,1500],elongation:[4,10],izod:[5,11],sg:[1.34,1.38]},
  {name:"1350 BK P",gf:50,tensile:[1450,1750],elongation:[3,9],izod:[6,10],sg:[1.50,1.62]},
];
function scoreProduct(p,d) {
  let score=0,factors=0;
  const prox=(val,[lo,hi])=>{ if(val>=lo&&val<=hi)return 1; const mid=(lo+hi)/2,half=(hi-lo)/2||1; return Math.max(0,1-Math.abs(val-mid)/(half*3)); };
  if(d.glassFilled!==undefined&&d.glassFilled!==""){const gf=parseFloat(d.glassFilled),diff=Math.abs(p.gf-gf);score+=diff===0?40:diff<=5?20:diff<=15?8:0;factors+=40;}
  if(d.tensileStrength!==undefined&&d.tensileStrength!==""){score+=prox(parseFloat(d.tensileStrength),p.tensile)*20;factors+=20;}
  if(d.elongation!==undefined&&d.elongation!==""){score+=prox(parseFloat(d.elongation),p.elongation)*15;factors+=15;}
  if(d.izodImpact!==undefined&&d.izodImpact!==""){score+=prox(parseFloat(d.izodImpact),p.izod)*15;factors+=15;}
  if(d.specificGravity!==undefined&&d.specificGravity!==""){score+=prox(parseFloat(d.specificGravity),p.sg)*10;factors+=10;}
  if(factors===0)return 0;
  return Math.round((score/factors)*100);
}
const getTopMatches = d => PRODUCTS.map(p=>({...p,score:scoreProduct(p,d)})).sort((a,b)=>b.score-a.score).slice(0,3);

function buildPrompt(d,topMatches) {
  const matchText = topMatches.map((p,i)=>`${i+1}. ${p.name} (GF${p.gf}%) — ${p.score}%`).join("\n");
  return `You are a PA6/PA66 polymer expert.\nCustomer: ${fv(d.custName)} | Industry: ${fv(d.industry)} | Part: ${fv(d.partName)}\nMaterial: ${fv(d.matBase)} | Grade: ${fv(d.gradeType)}\nTemps: ${[d.z1,d.z2,d.z3,d.z4,d.z5].filter(Boolean).join("/")}°C | Drying: ${fv(d.dryTemp)}°C/${fv(d.dryTime)}h\nTensile:${fv(d.tensileStrength)}MPa Elongation:${fv(d.elongation)}% IZOD:${fv(d.izodImpact)}J/m GF:${fv(d.glassFilled)}%\nDefects: ${fv(d.visualDefects)} | ${fv(d.mechDefects)} | ${fv(d.failureDesc)}\nPre-matched:\n${matchText}\nProvide: 1.CONFIRMED PRODUCT 2.WHY 3.MATCH SCORE% 4.SECOND OPTION 5.PROCESSING TIPS 6.ROOT CAUSE 7.RED FLAGS`;
}

// ── Toast ─────────────────────────────────────────────────────────────────
function Toast({ msg }) {
  return msg ? <div style={{ position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",background:P.surface,border:`1px solid ${P.border}`,color:"#fff",padding:"11px 22px",fontSize:13.5,zIndex:300,pointerEvents:"none" }}>{msg}</div> : null;
}

// ── Sheets Modal (for ⚙ button — employee use) ────────────────────────────
function SheetsModal({ onClose }) {
  const [url, setUrl] = useState(localStorage.getItem("pa6_webapp_url")||"");
  const save = () => {
    if (!url.startsWith("https://script.google.com")) { alert("Enter a valid Google Apps Script URL"); return; }
    localStorage.setItem("pa6_webapp_url", url); onClose(true);
  };
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose(false)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
      <div style={{ background:P.surface,border:`1px solid ${P.border}`,padding:28,maxWidth:560,width:"100%",maxHeight:"90vh",overflowY:"auto" }}>
        <div style={{ fontSize:18,fontWeight:700,marginBottom:16,color:"#fff" }}>⚙ Data Configuration</div>
        <div style={{ background:P.surface2,border:`1px solid ${P.border}`,padding:"10px 14px",marginBottom:14,fontSize:13,color:P.muted }}>
          <a href={SHEET_LINK} target="_blank" rel="noreferrer" style={{ color:P.red,fontWeight:700,wordBreak:"break-all" }}>{SHEET_LINK}</a>
        </div>
        <div style={{ position:"relative",marginBottom:16 }}>
          <pre style={{ background:"#1e1e2e",color:"#cdd6f4",borderRadius:10,padding:"14px 16px",fontSize:11.5,whiteSpace:"pre-wrap",lineHeight:1.6,margin:0,overflowX:"auto" }}>{APPS_SCRIPT}</pre>
          <button onClick={()=>navigator.clipboard.writeText(APPS_SCRIPT)} style={{ position:"absolute",top:8,right:8,...mkBtn("#ffffff22","#cdd6f4",{fontSize:11,padding:"4px 10px",border:"1px solid #ffffff22"}) }}>Copy</button>
        </div>
        <div style={fw}><div style={lbl}>Web App URL</div><input style={inp} value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://script.google.com/macros/s/...../exec" /></div>
        <div style={{ display:"flex",gap:8 }}>
          <button onClick={save} style={mkBtn(P.red)}>Save &amp; Connect</button>
          <button onClick={()=>onClose(false)} style={mkBtn(P.surface2,P.muted,{border:`1px solid ${P.border}`})}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── STEPS config ─────────────────────────────────────────────────────────
const STEPS = [
  { label:"Customer Info", icon:"👤" },
  { label:"Material Info", icon:"🧪" },
  { label:"Problems",      icon:"⚠️" },
  { label:"Properties",    icon:"📊" },
  { label:"AI Matches",    icon:"💡" },
];

// ─── Shared nav bar at bottom of each step ────────────────────────────────
function NavRow({ step, goStep, onNext, nextLabel, nextColor, hidePrev }) {
  return (
    <div className="nav-row" style={{ display:"flex", justifyContent: hidePrev ? "flex-end" : "space-between", marginTop:10, paddingTop:6 }}>
      {!hidePrev && <button onClick={()=>goStep(step-1)} style={mkBtn(P.surface,P.muted,{border:`1px solid ${P.border}`})}>← Back</button>}
      {onNext && <button onClick={onNext} style={mkBtn(P.red)}>{nextLabel||"Next →"}</button>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STEP 0 — Customer Info
// ─────────────────────────────────────────────────────────────────────────
function Step0({ d, set, goStep }) {
  return (
    <>
      <div style={card} className="app-card">
        <div style={{ ...secHd, color:P.red }}>👤 Customer &amp; Product Identity</div>
        <div className="grid-2col">
          <div style={fw}><label style={lbl}>Customer / Company Name *</label><input style={inp} value={d.custName||""} onChange={e=>set("custName",e.target.value)} placeholder="e.g. Reliance Industries" /></div>
          <div style={fw}><label style={lbl}>Contact Person &amp; Designation</label><input style={inp} value={d.contact||""} onChange={e=>set("contact",e.target.value)} placeholder="Name, Title" /></div>
        </div>
        <div style={fw}>
          <label style={lbl}>Industry / Sector *</label>
          <Chips options={["Textile","Automobile","Agriculture","Railways","Electronics","Electrical","Consumer goods","Packaging","Other"]} value={d.industry||[]} onChange={v=>set("industry",v)} otherVal={d.industryOther} onOtherChange={v=>set("industryOther",v)} />
        </div>
        <div className="grid-2col">
          <div style={fw}><label style={lbl}>End Product / Part Name *</label><input style={inp} value={d.partName||""} onChange={e=>set("partName",e.target.value)} placeholder="e.g. gear, connector housing" /></div>
          <div style={fw}><label style={lbl}>Number of Impressions in Mold</label><input style={inp} type="number" value={d.impressions||""} onChange={e=>set("impressions",e.target.value)} placeholder="1, 2, 4, 8..." /></div>
        </div>
      </div>

      <div style={card} className="app-card">
        <div style={{ ...secHd, color:P.red }}>🔷 Part Geometry</div>
        <div className="grid-2col">
          <div style={fw}>
            <label style={lbl}>Product Shape / Form</label>
            <Chips options={["3D complex","2D flat / panel","Rod / profile","Tubular","Other"]} value={d.prodShape||[]} onChange={v=>set("prodShape",v)} otherVal={d.prodShapeOther} onOtherChange={v=>set("prodShapeOther",v)} />
          </div>
          <div style={fw}><label style={lbl}>Approx. Surface Area (cm²)</label><input style={inp} type="number" value={d.surfArea||""} onChange={e=>set("surfArea",e.target.value)} placeholder="50" /></div>
          <div style={fw}><label style={lbl}>Min Wall Thickness (mm)</label><input style={inp} type="number" value={d.wallMin||""} onChange={e=>set("wallMin",e.target.value)} placeholder="1.5" /></div>
          <div style={fw}><label style={lbl}>Max Wall Thickness (mm)</label><input style={inp} type="number" value={d.wallMax||""} onChange={e=>set("wallMax",e.target.value)} placeholder="5.0" /></div>
        </div>
        <div style={fw}><label style={lbl}>Mold Age / Condition</label><input style={inp} value={d.moldAge||""} onChange={e=>set("moldAge",e.target.value)} placeholder="e.g. 3 years / 500k shots" /></div>
      </div>

      <div style={card} className="app-card">
        <div style={{ ...secHd, color:P.red }}>⭐ Customer Performance Priorities</div>
        <p style={{ fontSize:12,color:P.muted,marginBottom:10 }}>Drag to reorder — top = most important</p>
        <RankList value={d.rankList||[]} onChange={v=>set("rankList",v)} />
        <div style={{...fw,marginTop:14}}>
          <label style={lbl}>Surface Gloss Requirement</label>
          <Chips options={["High gloss","Semi-gloss","Matte","Textured","Not critical"]} value={d.gloss||[]} onChange={v=>set("gloss",v)} single />
        </div>
      </div>
      <NavRow step={0} goStep={goStep} hidePrev onNext={()=>goStep(1)} nextLabel="Next: Material Info →" />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STEP 1 — Material Info + Machine Parameters
// ─────────────────────────────────────────────────────────────────────────
function Step1({ d, set, goStep }) {
  return (
    <>
      <div style={card} className="app-card">
        <div style={{ ...secHd, color:P.red }}>🔧 Material Grade &amp; Supply</div>
        <div className="grid-2col">
          <div style={fw}>
            <label style={lbl}>Material Base *</label>
            <Chips options={["PA6","PA66","PA6/66 blend","Other"]} value={d.matBase||[]} onChange={v=>set("matBase",v)} single otherVal={d.matBaseOther} onOtherChange={v=>set("matBaseOther",v)} />
          </div>
          <div style={fw}>
            <label style={lbl}>Grade Type *</label>
            <Chips options={["Unfilled virgin","GF15","GF30","GF50","Reprocessed unfilled","Reprocessed GF","Flame retardant","Mineral filled","Other"]} value={d.gradeType||[]} onChange={v=>set("gradeType",v)} otherVal={d.gradeTypeOther} onOtherChange={v=>set("gradeTypeOther",v)} />
          </div>
        </div>
        <div className="grid-2col">
          <div style={fw}><label style={lbl}>Grade / Product Name</label><input style={inp} value={d.gradeName||""} onChange={e=>set("gradeName",e.target.value)} placeholder="e.g. PA66-GF30 Grade A" /></div>
          <div style={fw}><label style={lbl}>Reprocessing Cycles</label><input style={inp} type="number" value={d.reprocessCycles||""} onChange={e=>set("reprocessCycles",e.target.value)} placeholder="1, 2, 3..." /></div>
          <div style={fw}><label style={lbl}>Batch / Lot Reference</label><input style={inp} value={d.batchRef||""} onChange={e=>set("batchRef",e.target.value)} placeholder="Batch no. or date code" /></div>
          <div style={fw}><label style={lbl}>Monthly Volume (MT)</label><input style={inp} type="number" value={d.volReq||""} onChange={e=>set("volReq",e.target.value)} placeholder="5" /></div>
        </div>
        <div style={fw}>
          <label style={lbl}>Compliance / Regulatory</label>
          <Chips options={["RoHS","REACH","UL94","FDA food contact","BIS / ISI","IATF 16949","None stated","Other"]} value={d.compliance||[]} onChange={v=>set("compliance",v)} otherVal={d.complianceOther} onOtherChange={v=>set("complianceOther",v)} />
        </div>
      </div>

      <div style={card} className="app-card">
        <div style={{ ...secHd, color:P.red }}>💧 Drying &amp; Preparation</div>
        <div className="grid-3col">
          <div style={fw}><label style={lbl}>Drying Temperature (°C)</label><input style={inp} type="number" value={d.dryTemp||""} onChange={e=>set("dryTemp",e.target.value)} placeholder="85" /></div>
          <div style={fw}><label style={lbl}>Drying Time (hours)</label><input style={inp} type="number" value={d.dryTime||""} onChange={e=>set("dryTime",e.target.value)} placeholder="6" /></div>
          <div style={fw}>
            <label style={lbl}>Dryer Type</label>
            <Chips options={["Dehumidifying hopper","Hot air tray","Vacuum dryer","No drying done","Other"]} value={d.dryerType||[]} onChange={v=>set("dryerType",v)} single otherVal={d.dryerTypeOther} onOtherChange={v=>set("dryerTypeOther",v)} />
          </div>
        </div>
        <div className="grid-2col">
          <div style={fw}><label style={lbl}>Regrind % at Customer End</label><input style={inp} type="number" value={d.regrindPct||""} onChange={e=>set("regrindPct",e.target.value)} placeholder="0" /></div>
          <div style={fw}><label style={lbl}>Masterbatch / Additives</label><input style={inp} value={d.additives||""} onChange={e=>set("additives",e.target.value)} placeholder="Color MB, UV stabiliser..." /></div>
          <div style={fw}>
            <label style={lbl}>Mold Release Agent</label>
            <Chips options={["Silicone spray","Wax based","None","Internal (in material)","Other"]} value={d.moldRelease||[]} onChange={v=>set("moldRelease",v)} single otherVal={d.moldReleaseOther} onOtherChange={v=>set("moldReleaseOther",v)} />
          </div>
          <div style={fw}>
            <label style={lbl}>Post-Mold Operations</label>
            <Chips options={["Moisture conditioning","Annealing","Painting","Welding","Insert molding","Other"]} value={d.postMold||[]} onChange={v=>set("postMold",v)} otherVal={d.postMoldOther} onOtherChange={v=>set("postMoldOther",v)} />
          </div>
        </div>
        <div style={fw}><label style={lbl}>Storage Conditions</label><textarea style={{...inp,resize:"vertical",minHeight:52}} value={d.storageCond||""} onChange={e=>set("storageCond",e.target.value)} placeholder="Sealed bags, temperature controlled warehouse..." /></div>
        <div style={fw}>
          <label style={lbl}>Documentation Required</label>
          <Chips options={["TDS","MSDS / SDS","COA","MFI test report","Tensile / impact report","Declaration of conformity","None"]} value={d.docNeeds||[]} onChange={v=>set("docNeeds",v)} />
        </div>
      </div>

      {/* Machine Parameters */}
      <div className="card border-l-4 app-card" style={{borderColor:P.red, background:"rgba(13,13,13,0.7)", border:`1px solid ${P.border}`, borderLeft:`4px solid ${P.red}`, padding:"22px 24px", marginBottom:14}}>
        <div style={{ ...secHd, color:P.red }}>⚙️ Injection Molding Machine Parameters</div>
        <div style={{ ...secHd, fontSize:10, marginBottom:8 }}>Barrel Temperature — Zone Wise (°C)</div>
        <div className="grid-3col">
          {[["z1","Zone 1 — Feed","220"],["z2","Zone 2","240"],["z3","Zone 3","250"],["z4","Zone 4","255"],["z5","Zone 5 / Nozzle","258"],["moldTemp","Mold Temperature","60"]].map(([id,l,ph])=>(
            <div key={id} style={fw}><label style={lbl}>{l}</label><input style={inp} type="number" value={d[id]||""} onChange={e=>set(id,e.target.value)} placeholder={ph} /></div>
          ))}
        </div>
        <div style={dvdr} />
        <div className="grid-3col">
          {[["backPress","Back Pressure (bar)","5–15"],["screwSpd","Screw Speed (RPM)","80"],["injSpd","Injection Speed (%)","60"],["holdPres","Holding Pressure (bar)","40"],["coolTime","Cooling Time (sec)","15"],["holdTime","Holding Time (sec)","5"]].map(([id,l,ph])=>(
            <div key={id} style={fw}><label style={lbl}>{l}</label><input style={inp} type="number" value={d[id]||""} onChange={e=>set(id,e.target.value)} placeholder={ph} /></div>
          ))}
        </div>
        <div className="grid-2col" style={{ maxWidth:400 }}>
          <div style={fw}><label style={lbl}>Total Cycle Time (sec)</label><input style={inp} type="number" value={d.cycleTime||""} onChange={e=>set("cycleTime",e.target.value)} placeholder="35" /></div>
        </div>
        <div style={dvdr} />
        <div className="grid-2col">
          <div style={fw}>
            <label style={lbl}>Runner System</label>
            <Chips options={["Hot runner","Cold runner","3-plate mold","Other"]} value={d.runner||[]} onChange={v=>set("runner",v)} single otherVal={d.runnerOther} onOtherChange={v=>set("runnerOther",v)} />
          </div>
          <div style={fw}>
            <label style={lbl}>Ejector Type</label>
            <Chips options={["Pin ejector","Air ejector","Stripper plate","Blade ejector","Other"]} value={d.ejector||[]} onChange={v=>set("ejector",v)} single otherVal={d.ejectorOther} onOtherChange={v=>set("ejectorOther",v)} />
          </div>
          <div style={fw}><label style={lbl}>Heating Channels in Mold?</label><Chips options={["Yes","No"]} value={d.heatCh||[]} onChange={v=>set("heatCh",v)} single /></div>
          <div style={fw}><label style={lbl}>Cooling Channels in Mold?</label><Chips options={["Yes","No"]} value={d.coolCh||[]} onChange={v=>set("coolCh",v)} single /></div>
        </div>
      </div>
      <NavRow step={1} goStep={goStep} onNext={()=>goStep(2)} nextLabel="Next: Problems →" nextColor={P.teal} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STEP 2 — Problems
// ─────────────────────────────────────────────────────────────────────────
function Step2({ d, set, goStep }) {
  return (
    <>
      <div style={card} className="app-card">
        <div style={{ ...secHd, color:P.red }}>🔍 Testing &amp; Quality Checks</div>
        <div style={fw}>
          <label style={lbl}>Incoming Material Tests Done</label>
          <Chips options={["MFI","Moisture content","Tensile strength","Impact strength","HDT","Color / appearance","No testing","Other"]} value={d.incomingTests||[]} onChange={v=>set("incomingTests",v)} otherVal={d.incomingTestsOther} onOtherChange={v=>set("incomingTestsOther",v)} />
        </div>
        <div style={fw}>
          <label style={lbl}>Finished Part Tests Done</label>
          <Chips options={["Dimensional check","Pull / burst test","Drop / impact test","UV aging","Chemical resistance","Flammability UL94","No testing","Other"]} value={d.finishedTests||[]} onChange={v=>set("finishedTests",v)} otherVal={d.finishedTestsOther} onOtherChange={v=>set("finishedTestsOther",v)} />
        </div>
        <div className="grid-2col">
          <div style={fw}>
            <label style={lbl}>Failure Detected at Stage</label>
            <Chips options={["During molding","After demolding","During assembly","In field / end use","Other"]} value={d.failureStage||[]} onChange={v=>set("failureStage",v)} single otherVal={d.failureStageOther} onOtherChange={v=>set("failureStageOther",v)} />
          </div>
          <div style={fw}><label style={lbl}>Rejection / Failure Rate (%)</label><input style={inp} type="number" value={d.rejRate||""} onChange={e=>set("rejRate",e.target.value)} placeholder="5" /></div>
        </div>
      </div>

      <div style={card} className="app-card">
        <div style={{ ...secHd, color:P.red }}>⚠️ Defects Observed</div>
        <div style={{ marginBottom:14 }}>
          <div style={{ ...secHd, fontSize:10 }}>Visual / Surface Defects</div>
          <Chips options={["Sink marks","Short shots","Flash / burr","Weld line visible","Discoloration / yellowing","Burn marks / black specks","Silver streaks / splay","Delamination (GF)","Poor gloss / dull","Fiber exposure (GF)","Other"]} value={d.visualDefects||[]} onChange={v=>set("visualDefects",v)} otherVal={d.visualDefectsOther} onOtherChange={v=>set("visualDefectsOther",v)} />
        </div>
        <div style={{ marginBottom:14 }}>
          <div style={{ ...secHd, fontSize:10 }}>Mechanical / Structural Defects</div>
          <Chips options={["Brittleness","Warpage / distortion","Dimensional variation","Weld line cracking","Snap-fit / clip breakage","Poor impact resistance","Low elongation","Other"]} value={d.mechDefects||[]} onChange={v=>set("mechDefects",v)} otherVal={d.mechDefectsOther} onOtherChange={v=>set("mechDefectsOther",v)} />
        </div>
        <div style={fw}>
          <label style={lbl}>Describe the Exact Failure in Detail</label>
          <textarea style={{...inp,resize:"vertical",minHeight:70}} value={d.failureDesc||""} onChange={e=>set("failureDesc",e.target.value)} placeholder="e.g. Weld line cracks at snap-fit area during assembly..." />
        </div>
        <div className="grid-2col">
          <div style={fw}><label style={lbl}>When Did the Problem Start?</label><input style={inp} value={d.probStart||""} onChange={e=>set("probStart",e.target.value)} placeholder="e.g. Jan 2026, after new batch" /></div>
          <div style={fw}>
            <label style={lbl}>Problem Frequency</label>
            <Chips options={["Every batch","Intermittent","Certain cavities only","Startup related","Other"]} value={d.probFreq||[]} onChange={v=>set("probFreq",v)} single otherVal={d.probFreqOther} onOtherChange={v=>set("probFreqOther",v)} />
          </div>
        </div>
        <div style={fw}>
          <label style={lbl}>Recent Changes at Customer End</label>
          <Chips options={["Material supplier changed","New machine","Processing parameters changed","New / repaired mold","Masterbatch changed","Nothing changed","Other"]} value={d.recentChanges||[]} onChange={v=>set("recentChanges",v)} otherVal={d.recentChangesOther} onOtherChange={v=>set("recentChangesOther",v)} />
        </div>
      </div>
      <NavRow step={2} goStep={goStep} onNext={()=>goStep(3)} nextLabel="Next: Properties →" nextColor={P.amber} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STEP 3 — Properties + Save
// ─────────────────────────────────────────────────────────────────────────
function Step3({ d, set, goStep, manualSave, saveMsg }) {
  return (
    <>
      <div style={card} className="app-card">
        <div style={{ ...secHd, color:P.red }}>📊 Material Properties</div>
        <p style={{ fontSize:12.5,color:P.muted,marginBottom:16 }}>Enter key physical and mechanical values for the grade being reviewed.</p>
        <div className="grid-3col">
          {[["tensileStrength","Tensile Strength (MPa)","e.g. 85","1"],["elongation","Elongation (%)","e.g. 3.5","0.1"],["izodImpact","IZOD Impact (J/m)","e.g. 60","1"],["specificGravity","Specific Gravity","e.g. 1.35","0.001"],["glassFilled","Glass Filled (%)","e.g. 30","1"],["mfi","MFI (g/10min)","e.g. 14","0.1"]].map(([id,l,ph,step])=>(
            <div key={id} style={fw}><label style={lbl}>{l}</label><input style={inp} type="number" step={step} value={d[id]||""} onChange={e=>set(id,e.target.value)} placeholder={ph} /></div>
          ))}
          <div style={fw}>
            <label style={lbl}>Flame Retardant</label>
            <Chips options={["Yes","No","Halogen free","UL94 V0","UL94 V1","UL94 V2"]} value={d.flameRetardant||[]} onChange={v=>set("flameRetardant",v)} single />
          </div>
        </div>
      </div>

      {/* Save card — no sheet/export references for customer */}
      <div className="app-card" style={{ background:P.redL, border:`1.5px solid ${P.red}44`, padding:"24px", marginBottom:14 }}>
        <div style={{ fontSize:16,fontWeight:700,color:P.red,marginBottom:4 }}>Ready to continue?</div>
        <p style={{ fontSize:13,color:P.muted,marginBottom:18,lineHeight:1.6 }}>Review your entries and save before viewing your AI-powered product recommendation.</p>
        <button onClick={manualSave} style={mkBtn(P.red,"#fff",{fontSize:15,padding:"13px 36px"})}>
          {saveMsg==="Saving..." ? "⏳ Saving..." : "💾  Save"}
        </button>
        {saveMsg && saveMsg!=="Saving..." && (
          <div style={{ marginTop:14,display:"flex",alignItems:"center",gap:10,fontSize:13,fontWeight:600,color:saveMsg.startsWith("✓")?"#00c853":P.red }}>
            <span>{saveMsg}</span>
          </div>
        )}
      </div>

      <NavRow step={3} goStep={goStep} onNext={()=>goStep(4)} nextLabel="Next: AI Matches →" />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STEP 4 — AI Recommendations
// ─────────────────────────────────────────────────────────────────────────
function Step4({ d, set, goStep }) {
  const topMatches = getTopMatches(d);
  const hasProps = [d.tensileStrength,d.elongation,d.izodImpact,d.specificGravity,d.glassFilled].some(v=>v!==undefined&&v!=="");
  return (
    <>
      <div className="app-card" style={{ background:"#0d0d0d", border:`1px solid ${P.border}`, padding:22, marginBottom:14, color:"#fff" }}>
        <div style={{ fontSize:11,fontWeight:700,opacity:0.65,marginBottom:12,letterSpacing:1,textTransform:"uppercase" }}>🎯 Product Match from Catalogue</div>
        {!hasProps ? (
          <div style={{ fontSize:13.5,opacity:0.8,background:"rgba(255,255,255,0.1)",borderRadius:10,padding:"12px 16px" }}>Complete Properties (Step 4) to see your instant product match.</div>
        ) : (
          <>
            <div style={{ background:"rgba(255,255,255,0.06)",padding:"16px 18px",marginBottom:10,border:`1px solid ${P.border}` }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap" }}>
                <div>
                  <div style={{ fontSize:26,fontWeight:800,letterSpacing:-0.5 }}>{topMatches[0]?.name}</div>
                  <div style={{ fontSize:12.5,opacity:0.8,marginTop:4 }}>GF {topMatches[0]?.gf}% · Tensile {topMatches[0]?.tensile[0]}–{topMatches[0]?.tensile[1]} · IZOD {topMatches[0]?.izod[0]}–{topMatches[0]?.izod[1]}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:30,fontWeight:800 }}>{topMatches[0]?.score}%</div>
                  <div style={{ fontSize:11,opacity:0.65 }}>match score</div>
                </div>
              </div>
              <div style={{ background:"rgba(255,255,255,0.18)",borderRadius:4,height:5,marginTop:12 }}>
                <div style={{ height:5,borderRadius:4,background:"#a5f3fc",width:`${topMatches[0]?.score||0}%`,transition:"width .7s" }} />
              </div>
            </div>
            {topMatches.slice(1).map((p,i)=>(
              <div key={p.name} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",background:P.surface2,border:`1px solid ${P.border}`,padding:"10px 16px",marginBottom:6 }}>
                <div><span style={{ fontSize:11,opacity:0.5,marginRight:7 }}>#{i+2}</span><span style={{ fontSize:14,fontWeight:600 }}>{p.name}</span><span style={{ fontSize:11,opacity:0.55,marginLeft:8 }}>GF {p.gf}%</span></div>
                <div style={{ fontSize:15,fontWeight:700 }}>{p.score}%</div>
              </div>
            ))}
          </>
        )}
      </div>

      <div style={card} className="app-card">
        <div style={{ ...secHd, color:P.red }}>💡 Your Product Portfolio</div>
        <p style={{ fontSize:12,color:P.muted,marginBottom:12 }}>Add your grades — the AI will confirm or refine the match.</p>
        <PortfolioBuilder value={d.portfolio||[]} onChange={v=>set("portfolio",v)} />
      </div>

      <div style={card} className="app-card">
        <div style={{ ...secHd, color:P.red }}>📋 Recommended Parameters &amp; Action Items</div>
        <div className="grid-2col">
          <div style={fw}><label style={lbl}>Rec. Drying Temp (°C)</label><input style={inp} type="number" value={d.recDryTemp||""} onChange={e=>set("recDryTemp",e.target.value)} placeholder="85" /></div>
          <div style={fw}><label style={lbl}>Rec. Drying Time (hrs)</label><input style={inp} type="number" value={d.recDryTime||""} onChange={e=>set("recDryTime",e.target.value)} placeholder="6" /></div>
          <div style={fw}><label style={lbl}>Rec. Melt Temp Range (°C)</label><input style={inp} value={d.recMeltTemp||""} onChange={e=>set("recMeltTemp",e.target.value)} placeholder="240–260" /></div>
          <div style={fw}><label style={lbl}>Max Regrind % Recommendation</label><input style={inp} type="number" value={d.recRegrind||""} onChange={e=>set("recRegrind",e.target.value)} placeholder="10" /></div>
        </div>
        <div style={fw}><label style={lbl}>Action Items / Follow Up</label><textarea style={{...inp,resize:"vertical",minHeight:70}} value={d.actionItems||""} onChange={e=>set("actionItems",e.target.value)} placeholder={"1. Send 25kg trial sample by DD/MM\n2. Technical visit..."} /></div>
        <div className="grid-2col">
          <div style={fw}><label style={lbl}>Reviewed By</label><input style={inp} value={d.reviewer||""} onChange={e=>set("reviewer",e.target.value)} placeholder="Name and designation" /></div>
          <div style={fw}><label style={lbl}>Review Date</label><input style={inp} value={d.reviewDate||""} onChange={e=>set("reviewDate",e.target.value)} placeholder="DD/MM/YYYY" /></div>
        </div>
      </div>



      <NavRow step={4} goStep={goStep} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// EMPLOYEE DASHBOARD
// ─────────────────────────────────────────────────────────────────────────
function EmployeeDashboard({ setShowModal, navigate, user }) {
  return (
    <div className="employee-dashboard-container" style={{ maxWidth: 960, margin: "0 auto", padding: "24px 24px 10px", position: "relative", zIndex: 10 }}>
      <div className="employee-header">
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: P.text, letterSpacing: "-0.5px" }}>Employee Dashboard</div>
          <div style={{ fontSize: 13, color: P.muted, marginTop: 4 }}>View and manage customer submissions directly via Google Sheets.</div>
        </div>
        <div className="employee-actions">
          <button 
            onClick={() => setShowModal(true)} 
            style={mkBtn(P.surface2, P.muted, { border: `1px solid ${P.border}`, fontSize: 13, borderRadius: 4, padding: "10px 18px" })}
          >
            ⚙ Sheets Setup
          </button>
          <button 
            onClick={() => navigate('/profile')} 
            style={mkBtn(P.surface2, P.muted, { border: `1px solid ${P.border}`, fontSize: 13, borderRadius: 4, display: "flex", alignItems: "center", gap: 6, padding: "10px 18px" })}
          >
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: user?.avatar ? "transparent" : P.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff", overflow: "hidden" }}>
              {user?.avatar ? <img src={user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : user?.name?.[0]?.toUpperCase()}
            </div>
            Profile
          </button>
          <button 
            onClick={() => window.open(SHEET_LINK, "_blank")} 
            style={mkBtn(P.red, "#fff", { fontSize: 13, padding: "10px 20px", borderRadius: 4 })}
          >
            Redirect to Sheet ↗
          </button>
        </div>
      </div>

      <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 8, overflow: "hidden", height: 400, minHeight: 350 }}>
        <iframe 
          src={SHEET_LINK.replace("/edit", "/htmlembed")} 
          width="100%" 
          height="100%" 
          style={{ border: "none" }}
          title="Google Sheet View"
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────────────────────
export default function App({ role }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } });
  const logout = () => { 
    localStorage.removeItem('token'); 
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user'); 
    localStorage.removeItem('tokenExpiry'); 
    navigate('/auth'); 
  };

  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 4000); };

  // Sync avatar/user + check token expiry / silent refresh
  useEffect(() => {
    let refreshing = false;

    const checkExpiry = async () => {
      if (refreshing) return;
      const expiry = localStorage.getItem('tokenExpiry');
      const refreshToken = localStorage.getItem('refreshToken');
      const rememberMe = localStorage.getItem('rememberMe') === "true";

      if (!expiry || !refreshToken) return;

      const timeLeft = Number(expiry) - Date.now();

      // If already expired
      if (timeLeft <= 0) {
        showToast("Session expired. Please sign in again.");
        logout();
        return;
      }

      // If expiring in less than 10 minutes, silent refresh
      if (timeLeft < 10 * 60 * 1000) {
        refreshing = true;
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken, rememberMe });
          localStorage.setItem('token', data.token);
          localStorage.setItem('tokenExpiry', String(Date.now() + data.expiresIn));
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        } catch (e) {
          showToast("Session expired. Please sign in again.");
          logout();
        }
        refreshing = false;
      } else {
        try { setUser(JSON.parse(localStorage.getItem('user'))); } catch {}
      }
    };
    
    checkExpiry();
    window.addEventListener('storage', checkExpiry);
    window.addEventListener('focus', checkExpiry);
    const interval = setInterval(checkExpiry, 60 * 1000); // check every minute
    return () => { window.removeEventListener('storage', checkExpiry); window.removeEventListener('focus', checkExpiry); clearInterval(interval); };
  }, [navigate]);
  const [step, setStep]           = useState(0);
  const [d, setD]                 = useState(()=>{ try{return JSON.parse(localStorage.getItem("pa6_data")||"{}")||{};}catch{return {};} });
  const [showModal, setShowModal] = useState(false);
  const [saveMsg, setSaveMsg]     = useState("");

  const pct = useMemo(()=>calcProgress(d),[d]);
  const set = (k,v)=>setD(p=>({...p,[k]:v}));

  const goStep=(next)=>{
    localStorage.setItem("pa6_data",JSON.stringify(d));
    setStep(next);
    window.scrollTo({top:0,behavior:"smooth"});
  };

  const manualSave = async () => {
    setSaveMsg("Saving...");
    localStorage.setItem("pa6_data",JSON.stringify(d));
    const r = await pushToSheet(d);
    if (r.ok) {
      setSaveMsg("✓ Saved successfully. Form reset.");
      setD({});
      localStorage.removeItem("pa6_data");
      setTimeout(()=>{ setSaveMsg(""); goStep(0); }, 2000);
    } else {
      setSaveMsg(`⚠ ${r.msg||"Save failed"}`);
    }
  };



  return (
    <div className="app-root" style={{ fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background:P.bg, minHeight:"100vh", color:P.text, position:"relative" }}>
      {/* Faded logo watermark */}
      <img src={polycomLogo} alt="" style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"55vw", maxWidth:600, opacity:0.25, userSelect:"none", pointerEvents:"none", zIndex:2 }} />

      {/* ── Top Bar ─────────────────────────────────────────── */}
      <div style={{ position:"sticky", top:0, zIndex:50, background:P.surface, borderBottom:`1px solid ${P.border}`, minHeight:52, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 12px", gap:6, flexWrap:"nowrap", overflow:"hidden" }}>
        {/* Left: logo */}
        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0, minWidth:0 }}>
          <img src={polycomLogo} alt="" style={{ height:30, objectFit:"contain", flexShrink:0 }} />
          <div style={{ width:1, height:22, background:P.border, flexShrink:0 }} />
          <div style={{ fontSize:12, fontWeight:700, color:"#ccc", letterSpacing:"0.3px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:"clamp(60px,12vw,120px)" }}>Smart Review</div>
        </div>
        {/* Right: actions */}
        <div style={{ display:"flex", gap:5, alignItems:"center", flexShrink:0 }}>
          {user && role !== "employee" && (
            <button onClick={()=>navigate('/profile')} className="topbar-profile-btn" style={{ background:P.surface2, padding:"4px 8px", fontSize:11, color:P.muted, display:"flex", alignItems:"center", gap:6, border:`1px solid ${P.border}`, cursor:"pointer", flexShrink:0, maxWidth:"clamp(36px,22vw,160px)", overflow:"hidden" }}>
              <div style={{ width:24, height:24, borderRadius:"50%", background: user.avatar ? "transparent" : P.red, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff", flexShrink:0, overflow:"hidden" }}>
                {user.avatar ? <img src={user.avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : user.name?.[0]?.toUpperCase()}
              </div>
              <span className="topbar-profile-name" style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", display:"block" }}>{user.name}</span>
            </button>
          )}
          <div style={{ background:P.surface2, padding:"4px 8px", fontSize:11, color:P.muted, display:"flex", alignItems:"center", gap:5, border:`1px solid ${P.border}`, flexShrink:0 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:pct>60?"#22C55E":pct>30?"#F59E0B":P.subtle, flexShrink:0 }} />
            {pct}%
          </div>

          <button onClick={logout} className="topbar-signout-btn" style={mkBtn(P.red,"#fff",{fontSize:11,padding:"5px 12px",flexShrink:0,whiteSpace:"nowrap"})}>
            <span className="logout-btn-text">Sign Out</span>
            <span className="logout-btn-icon">🚪</span>
          </button>
        </div>
      </div>

      {role === "employee" && (
        <EmployeeDashboard setShowModal={setShowModal} navigate={navigate} user={user} />
      )}

      {/* ── Step Progress Rail ──────────────────────────────── */}
      <div style={{ position:"relative", zIndex:10, background:"rgba(13,13,13,0.85)", borderBottom:`1px solid ${P.border}`, padding:"0 4px" }}>
        <div style={{ maxWidth:960,margin:"0 auto",display:"flex" }}>
          {STEPS.map((s,i)=>{
            const done=i<step, active=i===step;
            return (
              <button key={i} onClick={()=>goStep(i)} className="step-rail-btn" style={{ flex:1, padding:"8px 2px", border:"none", background:"transparent", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, borderBottom:active?`2px solid ${P.red}`:"2px solid transparent", transition:"all .2s", minWidth:0 }}>
                <div style={{ width:22,height:22, display:"flex",alignItems:"center",justifyContent:"center", background:done?P.red:active?P.red:P.surface2, border:`1px solid ${done||active?P.red:P.border}`, color:done||active?"#fff":P.subtle, fontSize:10, fontWeight:700, flexShrink:0 }}>
                  {done?"✓":i+1}
                </div>
                <span className="step-rail-label" style={{ fontSize:"clamp(8px,1.8vw,10px)",fontWeight:active?700:500,color:active?P.red:done?P.muted:P.subtle,textAlign:"center",lineHeight:1.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:"100%" }}>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────── */}
      <div className="app-main-content" style={{ maxWidth:960, margin:"0 auto", position:"relative", zIndex:10 }}>

        {/* Step heading pill */}
        <div className="step-heading-pill" style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, padding:"14px 20px", background:P.surface, border:`1px solid ${P.border}` }}>
          <div style={{ width:40,height:40,background:P.red,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>{STEPS[step]?.icon || ""}</div>
          <div>
            <div style={{ fontSize:10,color:P.subtle,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:2 }}>Step {step+1} of {STEPS.length}</div>
            <div style={{ fontSize:18,fontWeight:800,color:P.text,letterSpacing:"-0.3px" }}>{STEPS[step]?.label || ""}</div>
          </div>
          <div style={{ marginLeft:"auto",background:P.redL,border:`1px solid ${P.red}44`,padding:"4px 12px",fontSize:12,fontWeight:700,color:P.red,whiteSpace:"nowrap" }}>
            {pct}% done
          </div>
        </div>

        {step===0 && <Step0 d={d} set={set} goStep={goStep} />}
        {step===1 && <Step1 d={d} set={set} goStep={goStep} />}
        {step===2 && <Step2 d={d} set={set} goStep={goStep} />}
        {step===3 && <Step3 d={d} set={set} goStep={goStep} manualSave={manualSave} saveMsg={saveMsg} />}
        {step===4 && <Step4 d={d} set={set} goStep={goStep} />}
      </div>

      {role==="employee" && showModal && <SheetsModal onClose={saved=>{ setShowModal(false); if(saved) showToast("✓ Connected!"); }} />}
      <Toast msg={toast} />
    </div>
  );
}
