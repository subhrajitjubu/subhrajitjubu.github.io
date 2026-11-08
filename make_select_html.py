"""
make_select_html.py - generate a self-contained HTML variable picker.

The catalogue is baked in from mo_vars, so the HTML can never drift from the
Python code. Output is a single file, no network access, no dependencies.
"""
import json, os, sys, html
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mo_vars

PRESSURE = [1000, 975, 950, 925, 900, 850, 800, 750, 700, 650, 600, 550, 500, 450,
            400, 375, 350, 325, 300, 275, 250, 225, 200, 175, 150, 125, 100, 70,
            50, 40, 30, 20, 10, 5, 2, 1, 0.4]
HEIGHT = [5, 10, 20, 30, 50, 75, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800,
          1000, 1250, 1500, 1750, 2000, 2250, 2500, 2750, 3000, 3250, 3500, 3750,
          4000, 4500, 5000, 5500, 6000]

# level counts per pressure-level variable, straight from the S3 headers
LEVEL_COUNTS = {
    "temperature_on_pressure_levels": 37,
    "wind_speed_on_pressure_levels": 37,
    "wind_direction_on_pressure_levels": 37,
    "geopotential_height_on_pressure_levels": 37,
    "relative_humidity_on_pressure_levels": 33,
    "wind_vertical_velocity_on_pressure_levels": 33,
    "height_ASL_on_pressure_levels": 33,
    "wet_bulb_potential_temperature_on_pressure_levels": 27,
    "cloud_amount_on_height_levels": 33,
}

rows = []
for c in mo_vars.CATALOGUE:
    base, group, level, netcdf, units = c[0], c[1], c[2], c[3], c[4]
    for tok in mo_vars.tokens_for(base):
        rows.append({
            "token": tok, "base": base, "group": group, "level": level,
            "netcdf": netcdf, "units": units,
            "period": ("PT" + tok.split("-PT")[1]) if "-PT" in tok else None,
            "nlev": LEVEL_COUNTS.get(base),
        })
rows.sort(key=lambda r: (r["group"], r["token"]))

DATA = {
    "rows": rows,
    "groups": mo_vars.GROUPS,
    "levelTypes": list(mo_vars.LEVEL_TYPES),
    "pressureLevels": PRESSURE,
    "heightLevels": HEIGHT,
    "periods": ["PT01H", "PT03H", "PT06H"],
}

TPL = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Met Office Global 10 km &mdash; variable picker</title>
<style>
:root{
  --bg:#fbfaf8; --panel:#ffffff; --ink:#1b1a18; --muted:#6f6b64; --line:#e4e0d8;
  --accent:#1f5f4e; --accent-soft:#e8f1ee; --warn:#b4552d; --warn-soft:#fbeee7;
  --mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;
  --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,sans-serif;
}
*{box-sizing:border-box}
body{margin:0;font-family:var(--sans);background:var(--bg);color:var(--ink);font-size:14px;line-height:1.5}
header{border-bottom:1px solid var(--line);background:var(--panel);padding:18px 28px}
header h1{margin:0;font-size:19px;font-weight:620;letter-spacing:-.01em}
header p{margin:4px 0 0;color:var(--muted);font-size:13px}
main{display:grid;grid-template-columns:minmax(0,1fr) 400px;gap:0;align-items:start}
@media(max-width:1000px){main{grid-template-columns:1fr}}
.col-left{padding:20px 28px 60px}
.col-right{border-left:1px solid var(--line);background:var(--panel);padding:20px 24px 60px;
  position:sticky;top:0;max-height:100vh;overflow-y:auto}
@media(max-width:1000px){.col-right{border-left:0;border-top:1px solid var(--line);position:static;max-height:none}}
h2{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);
  margin:26px 0 10px;font-weight:640}
h2:first-child{margin-top:0}
.toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:6px}
input[type=text],input[type=number]{font:inherit;padding:6px 9px;border:1px solid var(--line);
  border-radius:6px;background:#fff;color:var(--ink);min-width:0}
input[type=text]{flex:1;min-width:180px}
input:focus,button:focus{outline:2px solid var(--accent);outline-offset:1px}
button{font:inherit;padding:6px 11px;border:1px solid var(--line);border-radius:6px;
  background:#fff;color:var(--ink);cursor:pointer}
button:hover{background:#f4f2ee}
button.primary{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:560}
button.primary:hover{background:#184d3f}
button.ghost{border-color:transparent;color:var(--muted);padding:4px 8px}
button.ghost:hover{background:#f4f2ee;color:var(--ink)}
.chips{display:flex;flex-wrap:wrap;gap:5px}
.chip{font:500 12px var(--mono);padding:3px 8px;border:1px solid var(--line);
  border-radius:999px;background:#fff;cursor:pointer;user-select:none}
.chip[aria-pressed=true]{background:var(--accent-soft);border-color:var(--accent);color:var(--accent)}
.group{margin:0 0 6px;border:1px solid var(--line);border-radius:8px;background:var(--panel);overflow:hidden}
.group>summary{cursor:pointer;padding:9px 12px;font-weight:600;font-size:13px;
  display:flex;align-items:center;gap:8px;list-style:none}
.group>summary::-webkit-details-marker{display:none}
.group>summary::before{content:"\25B8";color:var(--muted);font-size:11px;transition:transform .12s}
.group[open]>summary::before{transform:rotate(90deg)}
.group .cnt{margin-left:auto;font:500 11px var(--mono);color:var(--muted)}
.vrow{display:flex;align-items:center;gap:9px;padding:5px 12px;border-top:1px solid #f2f0eb}
.vrow:hover{background:#faf9f6}
.vrow label{display:flex;align-items:center;gap:9px;flex:1;cursor:pointer;min-width:0}
.vrow .tok{font:12.5px var(--mono);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vrow .u{font:11.5px var(--mono);color:var(--muted);flex:none}
.badge{font:500 10px var(--mono);text-transform:uppercase;letter-spacing:.04em;
  padding:1px 6px;border-radius:4px;flex:none}
.b- pressure{background:#eef1f7;color:#3d5a8a}
.b-height{background:#f3eefa;color:#6b4a9c}
.b-surface{background:#f0f2f1;color:#5b6360}
.b-convective{background:var(--warn-soft);color:var(--warn)}
.b-precip{background:#e8f2fb;color:#2b6a97}
.b-cloud{background:#f0f4f8;color:#55718c}
.b-wind{background:#eaf3ee;color:#33674f}
.b-thermo{background:#fdf0ec;color:#a4552f}
.b-humidity{background:#eef5f8;color:#3f7288}
.b-radiation{background:#fbf5e2;color:#8a6d1f}
.b-pressure{background:#eef1f7;color:#3d5a8a}
.b-terrain{background:#f2f0e9;color:#6e6449}
.b-visibility{background:#eef5f8;color:#3f7288}
.card{border:1px solid var(--line);border-radius:8px;padding:12px 13px;margin-bottom:12px;background:#fff}
.card h3{margin:0 0 9px;font-size:12px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);font-weight:640}
.row{display:flex;gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap}
.row label{font-size:12px;color:var(--muted);min-width:74px}
.row input[type=number]{width:82px}
.row .wide{flex:1}
.count{font:600 22px var(--mono);letter-spacing:-.02em}
.countsmall{font:11.5px var(--mono);color:var(--muted);margin-left:auto;text-align:right;line-height:1.35}
pre{background:#1b1a18;color:#e8e6e1;padding:11px 12px;border-radius:6px;overflow:auto;
  font:11.5px/1.55 var(--mono);margin:8px 0 0;max-height:230px;white-space:pre-wrap;word-break:break-all}
.msg{font-size:12.5px;color:var(--muted);margin-top:8px}
.msg.ok{color:var(--accent)}
.hint{font-size:12px;color:var(--muted);line-height:1.6}
.hint code{font:11.5px var(--mono);background:#f1efe9;padding:1px 4px;border-radius:3px}
.presets{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}
hr.sep{border:0;border-top:1px solid var(--line);margin:16px 0}
</style>
</head>
<body>
<header>
  <h1>Met Office Global 10 km &mdash; variable picker</h1>
  <p>Pick variables and vertical levels. The result is a <code>selection.json</code> plus a ready-to-run download command.</p>
</header>

<main>
<div class="col-left">
  <div class="toolbar">
    <input type="text" id="q" placeholder="Search variables, netCDF names, units&hellip;">
    <button id="all">Select all</button>
    <button id="none">Clear</button>
    <button id="vis" class="ghost">Reset view</button>
  </div>
  <div class="chips" id="levelFilter" style="margin-bottom:14px"></div>
  <div id="groups"></div>
</div>

<div class="col-right">
  <div class="card">
    <h3>Selection</h3>
    <div class="row">
      <span class="count" id="nSel">0</span>
      <span class="countsmall" id="nFiles">0 variables<br>0 source files</span>
    </div>
  </div>

  <div class="card">
    <h3>Domain</h3>
    <div class="row"><label>Lat min</label><input type="number" id="lat0" step="0.1" value="0"><label>Lat max</label><input type="number" id="lat1" step="0.1" value="40"></div>
    <div class="row"><label>Lon min</label><input type="number" id="lon0" step="0.1" value="40"><label>Lon max</label><input type="number" id="lon1" step="0.1" value="100"></div>
    <div class="row"><label>Lead (h)</label><input type="number" id="lead" step="1" value="48" class="wide"><span class="hint">0&ndash;this many hours</span></div>
    <div class="row"><label>Periods</label><div class="chips" id="periodChips"></div></div>
  </div>

  <div class="card">
    <h3>Pressure levels (hPa)</h3>
    <div class="chips" id="pChips"></div>
    <div class="presets" id="pPresets"></div>
  </div>

  <div class="card">
    <h3>Height levels (m)</h3>
    <div class="chips" id="hChips"></div>
    <div class="presets" id="hPresets"></div>
  </div>

  <div class="card">
    <h3>Output</h3>
    <div class="row"><label>Layout</label>
      <div class="chips" id="layoutChips"></div>
    </div>
    <div class="hint" id="layoutHint"></div>
    <hr class="sep">
    <div class="row"><label>Levels</label>
      <div class="chips" id="lvlChips"></div>
    </div>
    <div class="hint" id="lvlHint"></div>
    <div class="row"><label>Level groups</label><input type="text" id="lvlGroups" class="wide" placeholder="e.g. 850,500 200"></div>
    <hr class="sep">
    <div class="row"><label>Also</label>
      <div class="chips" id="jsonChips"></div>
    </div>
    <div class="hint" id="jsonHint"></div>
  </div>

  <div class="card">
    <h3>Create</h3>
    <button class="primary" id="create">Create selection.json</button>
    <button id="copycmd" class="ghost">Copy command</button>
    <div class="msg" id="msg"></div>
  </div>

  <div class="card">
    <h3>Download command</h3>
    <pre id="cmd">select some variables</pre>
  </div>

  <div class="card">
    <h3>selection.json</h3>
    <button id="copyjson" class="ghost">Copy JSON</button>
    <button id="savejson" class="ghost">Save as&hellip;</button>
    <pre id="json" style="display:none"></pre>
    <div class="hint" id="jsonhint">Press <em>Create</em> to generate.</div>
  </div>

  <div class="card">
    <h3>Notes</h3>
    <div class="hint">
      Pressure levels snap to the nearest value each file actually has &mdash;
      <code>temperature_on_pressure_levels</code> has 37 levels,
      <code>relative_humidity_on_pressure_levels</code> 33,
      <code>wet_bulb_potential_temperature_on_pressure_levels</code> 27.<br><br>
      The <code>PT06H</code> period variants only exist at lead 150&ndash;168 h,
      so a 48 h horizon yields nothing for them. A full 7-day forecast needs a
      00Z or 12Z run (06Z/18Z runs stop at 66/69 h).
    </div>
  </div>
</div>
</main>

<script>
const DATA = __DATA__;
const KEY = "mo_select_state_v1";

const S = {
  sel: {},            // token -> true
  plev: [], hlev: [],
  periods: ["PT01H","PT03H"],
  lat0:0, lat1:40, lon0:40, lon1:100, lead:48,
  q:"", lvlFilter:new Set(), layout:"split", toJson:true,
  splitLevels:false, lvlGroups:""
};
try{ Object.assign(S, JSON.parse(localStorage.getItem(KEY)||"{}")); }catch(e){}
if(!S.sel || typeof S.sel!=="object") S.sel={};
if(!S.plev) S.plev=[];
if(!S.hlev) S.hlev=[];
if(!S.periods||!S.periods.length) S.periods=["PT01H","PT03H"];
if(!S.layout) S.layout="split";
if(typeof S.toJson!=="boolean") S.toJson=true;
if(typeof S.splitLevels!=="boolean") S.splitLevels=false;
if(typeof S.lvlGroups!=="string") S.lvlGroups="";
// lvlFilter is a Set; JSON round-trips it as a plain object
S.lvlFilter = new Set(Array.isArray(S.lvlFilter) ? S.lvlFilter
                    : (S.lvlFilter && typeof S.lvlFilter==="object" ? Object.keys(S.lvlFilter) : []));

const $=s=>document.querySelector(s);
const el=(t,c,x)=>{const n=document.createElement(t);if(c)n.className=c;if(x!==undefined)n.textContent=x;return n;};

function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }

function visible(r){
  if(S.lvlFilter.size && !S.lvlFilter.has(r.level)) return false;
  const q=S.q.trim().toLowerCase();
  if(!q) return true;
  return (r.token+" "+r.netcdf+" "+r.units+" "+r.group+" "+r.level).toLowerCase().includes(q);
}

/* ---------------- build group list ---------------- */
function buildGroups(){
  const host=$("#groups"); host.innerHTML="";
  const byGroup={};
  DATA.rows.forEach(r=>{ (byGroup[r.group]=byGroup[r.group]||[]).push(r); });
  DATA.groups.forEach(g=>{
    const rows=byGroup[g]; if(!rows) return;
    const det=el("details","group"); det.open=true;
    const sm=el("summary"); sm.appendChild(el("span",null,g));
    const cnt=el("span","cnt","0/"+rows.length); sm.appendChild(cnt);
    const btn=el("button","ghost","all"); btn.type="button";
    btn.onclick=e=>{e.preventDefault();e.stopPropagation();
      const on=rows.every(r=>S.sel[r.token]);
      rows.forEach(r=>{S.sel[r.token]=!on;}); refresh();};
    sm.appendChild(btn);
    det.appendChild(sm);
    rows.forEach(r=>{
      const row=el("div","vrow");
      const lab=el("label");
      const cb=el("input"); cb.type="checkbox"; cb.checked=!!S.sel[r.token]; cb.id="cb_"+r.token;
      cb.onchange=()=>{S.sel[r.token]=cb.checked;refresh();};
      const tok=el("span","tok",r.token);
      const u=el("span","u",r.units);
      lab.appendChild(cb); lab.appendChild(tok); lab.appendChild(u);
      if(r.nlev){ const b=el("span","badge b-"+r.level,r.level==="height"?r.nlev+" lvl":r.nlev+" lvl");
        b.style.marginLeft="6px"; lab.appendChild(b); }
      row.appendChild(lab);
      det.appendChild(row);
    });
    host.appendChild(det);
  });
}

function refresh(){
  document.querySelectorAll("#groups .group").forEach(det=>{
    const g=det.querySelector("summary span").textContent;
    const rows=DATA.rows.filter(r=>r.group===g);
    const on=rows.filter(r=>S.sel[r.token]).length;
    det.querySelector(".cnt").textContent=on+"/"+rows.length;
  });
  // keep checkbox states in sync with state
  DATA.rows.forEach(r=>{ const cb=document.getElementById("cb_"+r.token); if(cb) cb.checked=!!S.sel[r.token]; });
  const n=Object.values(S.sel).filter(Boolean).length;
  $("#nSel").textContent=n;
  const toks=DATA.rows.filter(r=>S.sel[r.token]).map(r=>r.token);
  const leads=Math.max(1,Math.min(49,Math.floor(S.lead)));
  $("#nFiles").innerHTML=n+" variable"+(n===1?"":"s")+"<br>~"+(n*leads)+" source files";
  updateCommand();
  save();
}

function chips(host, values, arr, unit){
  host.innerHTML="";
  values.forEach(v=>{
    const c=el("button","chip",v+(unit||""));
    c.type="button";
    c.setAttribute("aria-pressed", arr.includes(v)?"true":"false");
    c.onclick=()=>{
      const i=arr.indexOf(v);
      if(i>=0) arr.splice(i,1); else arr.push(v);
      chips(host,values,arr,unit); refresh();
    };
    host.appendChild(c);
  });
}

/* ---------------- presets ---------------- */
const P_PRESETS={"synoptic":[1000,850,700,500,300,250,200,150,100],"850/500/200":[850,500,200],
  "every 50 hPa":[1000,950,900,850,800,750,700,650,600,550,500,450,400,350,300,250,200,150,100,50],
  "all":DATA.pressureLevels};
const H_PRESETS={"every 1000 m":[1000,2000,3000,4000,5000,6000],"low":[100,500,1000,2000,3000],
  "all":DATA.heightLevels};

function presets(host,obj,arr,unit){
  host.innerHTML="";
  Object.keys(obj).forEach(k=>{
    const b=el("button","chip",k); b.type="button";
    b.onclick=()=>{ arr.length=0; obj[k].forEach(v=>arr.push(v));
      chips(host===$("#pPresets")?$("#pChips"):$("#hChips"),
           host===$("#pPresets")?DATA.pressureLevels:DATA.heightLevels, arr, unit);
      presets(host,obj,arr,unit); refresh(); };
    host.appendChild(b);
  });
}

/* ---------------- layout (split vs merged) ---------------- */
const LAYOUTS=[
  ["split","one file per source file","Mirrors the upstream layout: one .nc per variable per forecast hour. Best for archival or for merging yourself later."],
  ["merged","one file per variable (time-merged)","All forecast hours for a variable go into ONE .nc with a time dimension. Fewest files, easiest to load with xarray."]
];
function buildLayout(){
  const host=$("#layoutChips"); host.innerHTML="";
  LAYOUTS.forEach(([k,label])=>{
    const c=el("button","chip",label); c.type="button";
    c.setAttribute("aria-pressed",S.layout===k?"true":"false");
    c.onclick=()=>{S.layout=k;buildLayout();refresh();};
    host.appendChild(c);
  });
  const d=LAYOUTS.find(l=>l[0]===S.layout);
  $("#layoutHint").innerHTML = d[2] + "<br><code>--merge</code> flag is added to the command when merged.";
}

function buildLvl(){
  const host=$("#lvlChips"); host.innerHTML="";
  [["split_levels","one file per level"]].forEach(([k,label])=>{
    const c=el("button","chip",label); c.type="button";
    c.setAttribute("aria-pressed",S.splitLevels?"true":"false");
    c.onclick=()=>{S.splitLevels=!S.splitLevels;buildLvl();refresh();};
    host.appendChild(c);
  });
  const groups=S.lvlGroups.trim();
  $("#lvlHint").innerHTML = S.splitLevels
    ? "Adds <code>--split-levels</code>. A pressure- or height-level variable is written as one file per level, e.g. <code>temperature_on_pressure_levels_p850hPa.nc</code>."
    + (groups ? "<br>Level groups below take precedence over the per-level split." : "")
    : (groups ? "Level groups below are used: <code>--level-groups</code>." : "One file holds every selected level.");
  const inp=$("#lvlGroups");
  if(inp.value!==groups) inp.value=groups;   // don't clobber the cursor while typing
}
function lvlGroupList(){
  return S.lvlGroups.trim().split(/\s+/).filter(g=>g.length);
}

function buildJson(){
  const host=$("#jsonChips"); host.innerHTML="";
  [["json","also write .json (degC / mm)"]].forEach(([k,label])=>{
    const c=el("button","chip",label); c.type="button";
    c.setAttribute("aria-pressed",S.toJson?"true":"false");
    c.onclick=()=>{S.toJson=!S.toJson;buildJson();refresh();};
    host.appendChild(c);
  });
  $("#jsonHint").innerHTML = S.toJson
    ? "Adds <code>--to-json</code>. Each NetCDF gets a matching .json with temperature in degC, precipitation in mm and rates in mm h-1. NaN becomes null."
    : "Only the cropped NetCDF files are written.";
}

/* ---------------- command ---------------- */
function config(){
  const vars_=DATA.rows.filter(r=>S.sel[r.token]).map(r=>r.token);
  const c={ vars:vars_, lat:[+S.lat0,+S.lat1], lon:[+S.lon0,+S.lon1], max_lead:+S.lead };
  if(S.periods.length) c.periods=S.periods.slice();
  if(S.plev.length) c.plevels=S.plev.slice();
  if(S.hlev.length) c.hlevels=S.hlev.slice();
  if(S.layout==="merged") c.merge=true;
  if(S.toJson) c.to_json=true;
  if(S.splitLevels) c.split_levels=true;
  const g=lvlGroupList();
  if(g.length) c.level_groups=g;
  return c;
}
function command(){
  const c=config();
  const parts=["python mo_crop.py",
    "--lat",c.lat[0],c.lat[1],"--lon",c.lon[0],c.lon[1],
    "--max-lead",c.max_lead,"--out","./cropped"];
  if(c.merge) parts.push("--merge");
  if(c.to_json) parts.push("--to-json");
  if(c.split_levels) parts.push("--split-levels");
  if(c.level_groups&&c.level_groups.length) parts.push("--level-groups",...c.level_groups);
  if(c.plevels&&c.plevels.length) parts.push("--plevels",...c.plevels);
  if(c.hlevels&&c.hlevels.length) parts.push("--hlevels",...c.hlevels);
  if(c.periods&&c.periods.length) parts.push("--periods",c.periods.join(","));
  if(c.vars.length) parts.push("--vars",c.vars.join(","));
  else parts.push("--vars","ALL");
  return parts.join(" ");
}
function updateCommand(){ $("#cmd").textContent=command(); }

/* ---------------- create ---------------- */
$("#create").onclick=()=>{
  const c=config();
  const txt=JSON.stringify(c,null,2);
  $("#json").textContent=txt; $("#json").style.display="block";
  $("#jsonhint").style.display="none";
  $("#msg").textContent="Generated "+c.vars.length+" variable token(s).";
  $("#msg").className="msg ok";
};
$("#copycmd").onclick=()=>{ navigator.clipboard.writeText(command()).then(()=>{
  $("#msg").textContent="Command copied."; $("#msg").className="msg ok";}); };
$("#copyjson").onclick=()=>{ const t=$("#json").textContent||"{}";
  navigator.clipboard.writeText(t).then(()=>{ $("#msg").textContent="JSON copied."; $("#msg").className="msg ok";}); };
$("#savejson").onclick=async()=>{
  const c=config(); const txt=JSON.stringify(c,null,2);
  if(window.showSaveFilePicker){
    try{
      const h=await showSaveFilePicker({suggestedName:"selection.json",
        types:[{description:"JSON",accept:{"application/json":[".json"]}}]});
      const w=await h.createWritable(); await w.write(txt); await w.close();
      $("#msg").textContent="Saved selection.json."; $("#msg").className="msg ok"; return;
    }catch(e){ if(e.name==="AbortError") return; }
  }
  const b=new Blob([txt],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(b); a.download="selection.json";
  a.click(); URL.revokeObjectURL(a.href);
  $("#msg").textContent="Downloaded selection.json."; $("#msg").className="msg ok";
};

/* ---------------- inputs ---------------- */
function bindNum(id,key){ const i=$(id); i.value=S[key];
  i.oninput=()=>{S[key]=+i.value||0;refresh();}; }
["lat0","lat1","lon0","lon1","lead"].forEach(k=>bindNum("#"+k,k));
$("#q").value=S.q; $("#q").oninput=e=>{S.q=e.target.value;buildGroups();refresh();};
$("#lvlGroups").value=S.lvlGroups;
$("#lvlGroups").oninput=e=>{S.lvlGroups=e.target.value;buildLvl();refresh();};
$("#all").onclick=()=>{DATA.rows.forEach(r=>{if(visible(r))S.sel[r.token]=true;});buildGroups();refresh();};
$("#none").onclick=()=>{DATA.rows.forEach(r=>{S.sel[r.token]=false;});buildGroups();refresh();};
$("#vis").onclick=()=>{S.q="";S.lvlFilter=new Set();$("#q").value="";
  buildGroups();buildLevelFilter();refresh();};

/* level-type filter chips */
function buildLevelFilter(){
  const host=$("#levelFilter"); host.innerHTML="";
  DATA.levelTypes.forEach(t=>{
    const c=el("button","chip",t); c.type="button";
    c.setAttribute("aria-pressed",S.lvlFilter.has(t)?"true":"false");
    c.onclick=()=>{ if(S.lvlFilter.has(t))S.lvlFilter.delete(t); else S.lvlFilter.add(t);
      buildLevelFilter(); buildGroups(); refresh(); };
    host.appendChild(c);
  });
}

/* period chips */
(function(){
  const host=$("#periodChips"); host.innerHTML="";
  DATA.periods.forEach(p=>{
    const c=el("button","chip",p); c.type="button";
    c.setAttribute("aria-pressed",S.periods.includes(p)?"true":"false");
    c.onclick=()=>{ const i=S.periods.indexOf(p); if(i>=0)S.periods.splice(i,1); else S.periods.push(p);
      buildPeriods(); refresh(); };
    host.appendChild(c);
  });
})();
function buildPeriods(){
  const host=$("#periodChips"); host.innerHTML="";
  DATA.periods.forEach(p=>{
    const c=el("button","chip",p); c.type="button";
    c.setAttribute("aria-pressed",S.periods.includes(p)?"true":"false");
    c.onclick=()=>{ const i=S.periods.indexOf(p); if(i>=0)S.periods.splice(i,1); else S.periods.push(p);
      buildPeriods(); refresh(); };
    host.appendChild(c);
  });
}

chips($("#pChips"),DATA.pressureLevels,S.plev,"");
chips($("#hChips"),DATA.heightLevels,S.hlev,"");
presets($("#pPresets"),P_PRESETS,S.plev,"");
presets($("#hPresets"),H_PRESETS,S.hlev,"");

buildLevelFilter(); buildLayout(); buildLvl(); buildJson(); buildGroups(); refresh();
</script>
</body>
</html>
"""

out = TPL.replace("__DATA__", json.dumps(DATA, separators=(",", ":")))
path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mo_select.html")
with open(path, "w", encoding="utf-8") as f:
    f.write(out)
print(f"written {path}  ({len(out)/1024:.1f} KB, {len(DATA['rows'])} variables)")
