import { useState, useEffect, useRef } from "react";

const METRICS = [
  { key: "budget_pub",      label: "Budget pub",     unit: "€",  color: "#F59E0B", goal_key: "budget_pub_jour" },
  { key: "rdv",             label: "Rendez-vous",    unit: "",   color: "#10B981", goal_key: "rdv_jour" },
  { key: "appels",          label: "Appels",         unit: "",   color: "#3B82F6", goal_key: "appels_jour" },
  { key: "conversations",   label: "Conversations",  unit: "",   color: "#8B5CF6", goal_key: "conversations_jour" },
  { key: "dms",             label: "DMs envoyés",    unit: "",   color: "#EC4899", goal_key: "dms_jour" },
  { key: "posts_facebook",  label: "Facebook",       unit: "",   color: "#60A5FA", goal_key: "posts_facebook_jour" },
  { key: "posts_tiktok",    label: "TikTok",         unit: "",   color: "#F43F5E", goal_key: "posts_tiktok_jour" },
  { key: "posts_linkedin",  label: "LinkedIn",       unit: "",   color: "#06B6D4", goal_key: "posts_linkedin_jour" },
];

const GOAL_FIELDS = [
  { key: "mois",                  label: "Mois objectif",            placeholder: "ex: Avril 2026" },
  { key: "objectif_ca",           label: "Objectif CA mensuel (€)",  placeholder: "ex: 10000",  numeric: true },
  { key: "objectif_clients",      label: "Nouveaux clients visés",   placeholder: "ex: 5",      numeric: true },
  { key: "budget_pub_jour",       label: "Budget pub/jour (€)",      placeholder: "ex: 30",     numeric: true },
  { key: "rdv_jour",              label: "Rendez-vous/jour",         placeholder: "ex: 2",      numeric: true },
  { key: "appels_jour",           label: "Appels/jour",              placeholder: "ex: 5",      numeric: true },
  { key: "conversations_jour",    label: "Conversations/jour",       placeholder: "ex: 10",     numeric: true },
  { key: "dms_jour",              label: "DMs/jour",                 placeholder: "ex: 20",     numeric: true },
  { key: "posts_facebook_jour",   label: "Posts Facebook/jour",      placeholder: "ex: 1",      numeric: true },
  { key: "posts_tiktok_jour",     label: "Posts TikTok/jour",        placeholder: "ex: 1",      numeric: true },
  { key: "posts_linkedin_jour",   label: "Posts LinkedIn/jour",      placeholder: "ex: 1",      numeric: true },
  { key: "strategie",             label: "Stratégie du mois",        placeholder: "Ton plan d'action...", multiline: true },
];

const TODAY = new Date().toISOString().split("T")[0];
function getMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}
function storageGet(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } }
function storageSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

const globalCss = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #060C1A; color: #E2E8F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; -webkit-text-size-adjust: 100%; }
  input, textarea, button { font-family: inherit; }
  input[type=number]::-webkit-inner-spin-button { opacity: 0.4; }
  input::placeholder, textarea::placeholder { color: #334155; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  .page { animation: fadeUp 0.25s ease; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: #1E3A5F; }
`;

export default function App() {
  const [screen, setScreen] = useState("loading");
  const [goals, setGoals]   = useState(null);
  const [goalDraft, setGoalDraft] = useState({});
  const [entries, setEntries]     = useState([]);
  const [todayDraft, setTodayDraft] = useState({});
  const [todaySaved, setTodaySaved] = useState(false);
  const [aiText, setAiText]   = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [tab, setTab]         = useState("home");
  const [saving, setSaving]   = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    const g   = storageGet(`goals:${getMonthKey()}`);
    const all = storageGet("entries:all") || [];
    const td  = storageGet(`entry:${TODAY}`);
    setGoals(g); setEntries(all);
    if (td) { setTodayDraft(td); setTodaySaved(true); }
    setScreen(g ? "app" : "setup");
  }, []);

  const saveGoals = () => {
    setSaving(true);
    storageSet(`goals:${getMonthKey()}`, goalDraft);
    setGoals(goalDraft); setSaving(false); setScreen("app"); setTab("home");
  };

  const saveEntry = () => {
    setSaving(true);
    const entry = { ...todayDraft, date: TODAY };
    storageSet(`entry:${TODAY}`, entry);
    const all = storageGet("entries:all") || [];
    const idx = all.findIndex(e => e.date === TODAY);
    if (idx >= 0) all[idx] = entry; else all.push(entry);
    all.sort((a,b) => a.date.localeCompare(b.date));
    storageSet("entries:all", all);
    setEntries(all); setTodaySaved(true); setSaving(false);
    setSaveMsg("Sauvegardé ✓"); setTimeout(() => setSaveMsg(""), 2500);
  };

  const runAI = async () => {
    if (!goals || !entries.length) return;
    setAiLoading(true); setAiText("");
    const recent = entries.slice(-14);
    const prompt = `Tu es un coach marketing. Analyse ces données et donne des recommandations concrètes.

OBJECTIFS (${goals.mois}):
CA: ${goals.objectif_ca}€ | Clients: ${goals.objectif_clients} | Stratégie: ${goals.strategie||"—"}
Cibles/j: pub=${goals.budget_pub_jour}€ rdv=${goals.rdv_jour} appels=${goals.appels_jour} conv=${goals.conversations_jour} dms=${goals.dms_jour} fb=${goals.posts_facebook_jour} tt=${goals.posts_tiktok_jour} li=${goals.posts_linkedin_jour}

DONNÉES (${recent.length}j):
${recent.map(e=>`${e.date}: pub=${e.budget_pub||0}€ rdv=${e.rdv||0} appels=${e.appels||0} conv=${e.conversations||0} dms=${e.dms||0} fb=${e.posts_facebook||0} tt=${e.posts_tiktok||0} li=${e.posts_linkedin||0}`).join("\n")}

Réponds avec ces 4 sections EXACTEMENT:
🟢 CE QUI MARCHE
🔴 À AMÉLIORER
⚡ ACTIONS DEMAIN
🎯 FOCUS SEMAINE

Sois direct et chiffré. Français uniquement.`;
    try {
      const r = await fetch("/api/analyze", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({prompt}) });
      const d = await r.json();
      setAiText(d.content?.[0]?.text || "Erreur.");
    } catch { setAiText("Impossible de contacter l'IA."); }
    setAiLoading(false);
  };

  const calcAvg = k => entries.length ? (entries.reduce((a,e) => a+(parseFloat(e[k])||0), 0)/entries.length).toFixed(1) : "0";
  const calcPct = (k, gk) => { if (!goals?.[gk]) return null; return Math.min(999, Math.round((parseFloat(calcAvg(k))/parseFloat(goals[gk]))*100)); };

  if (screen === "loading") return (
    <div style={{minHeight:"100vh",background:"#060C1A",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{globalCss}</style>
      <div style={{color:"#3B82F6",fontSize:13,letterSpacing:4}}>CHARGEMENT...</div>
    </div>
  );

  if (screen === "setup") return <Setup goalDraft={goalDraft} setGoalDraft={setGoalDraft} saveGoals={saveGoals} saving={saving} existing={goals} />;

  const TABS = [
    { id:"home",    label:"Accueil",    icon:"⊞" },
    { id:"entry",   label:"Saisie",     icon:"✦" },
    { id:"trends",  label:"Tendances",  icon:"⌇" },
    { id:"ai",      label:"IA",         icon:"◈" },
    { id:"goals",   label:"Objectifs",  icon:"⊙" },
  ];

  return (
    <div style={{minHeight:"100vh",background:"#060C1A",color:"#E2E8F0",paddingBottom:72}}>
      <style>{globalCss}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>

      {/* Top bar */}
      <div style={{background:"#0B1628",borderBottom:"1px solid #1E293B",padding:"14px 16px",position:"sticky",top:0,zIndex:50,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:9,letterSpacing:3,color:"#3B82F6",fontWeight:700}}>FUNNELS ACQUISITIONS</div>
          <div style={{fontSize:17,fontWeight:700,color:"#F1F5F9",marginTop:2}}>{goals?.mois || "Dashboard"}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:11,color:"#475569"}}>{entries.length} jours</div>
          <div style={{fontSize:11,color:todaySaved?"#10B981":"#475569",marginTop:2}}>{todaySaved?"✓ Aujourd'hui saisi":"Saisie en attente"}</div>
        </div>
      </div>

      {/* Pages */}
      <div style={{padding:"16px 16px 8px"}} className="page" key={tab}>
        {tab === "home"   && <HomeTab   metrics={METRICS} goals={goals} calcAvg={calcAvg} calcPct={calcPct} entries={entries} />}
        {tab === "entry"  && <EntryTab  todayDraft={todayDraft} setTodayDraft={setTodayDraft} saveEntry={saveEntry} saving={saving} saveMsg={saveMsg} todaySaved={todaySaved} goals={goals} />}
        {tab === "trends" && <TrendsTab entries={entries} metrics={METRICS} />}
        {tab === "ai"     && <AITab     aiText={aiText} aiLoading={aiLoading} runAI={runAI} entries={entries} goals={goals} metrics={METRICS} />}
        {tab === "goals"  && <GoalsTab  goals={goals} setGoalDraft={setGoalDraft} setScreen={setScreen} />}
      </div>

      {/* Bottom nav */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#0B1628",borderTop:"1px solid #1E293B",display:"flex",zIndex:100}}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex:1, padding:"10px 4px 8px", background:"none", border:"none", cursor:"pointer",
              display:"flex", flexDirection:"column", alignItems:"center", gap:3,
              color: active ? "#3B82F6" : "#475569",
              borderTop: active ? "2px solid #3B82F6" : "2px solid transparent",
            }}>
              <span style={{fontSize:18}}>{t.icon}</span>
              <span style={{fontSize:10,fontWeight: active?700:400}}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Shared UI ─────────────────────────────────────────────────────────── */
function Section({ children, style={} }) {
  return <div style={{background:"#0F1E36",border:"1px solid #1E3A5F",borderRadius:14,padding:"16px",marginBottom:12,...style}}>{children}</div>;
}
function SectionTitle({ children, color="#475569" }) {
  return <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color,marginBottom:12,textTransform:"uppercase"}}>{children}</div>;
}

/* ── Home ──────────────────────────────────────────────────────────────── */
function HomeTab({ metrics, goals, calcAvg, calcPct, entries }) {
  const d = new Date();
  const daysInMonth = new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
  const monthPct = Math.round((d.getDate()/daysInMonth)*100);

  return (
    <div>
      {/* KPI row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        {[
          {label:"Mois", val:monthPct+"%", sub:`Jour ${d.getDate()}/${daysInMonth}`, color:"#3B82F6", pct:monthPct},
          {label:"Jours suivis", val:entries.length, sub:"enregistrés", color:"#10B981", pct:Math.round((entries.length/daysInMonth)*100)},
        ].map(item => (
          <Section key={item.label} style={{marginBottom:0}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:"#475569",marginBottom:6}}>{item.label.toUpperCase()}</div>
            <div style={{fontSize:32,fontWeight:700,fontFamily:"'DM Mono',monospace",color:item.color}}>{item.val}</div>
            <div style={{height:3,background:"#1E293B",borderRadius:2,margin:"8px 0 4px"}}>
              <div style={{height:"100%",width:`${Math.min(100,item.pct)}%`,background:item.color,borderRadius:2}}/>
            </div>
            <div style={{fontSize:11,color:"#475569"}}>{item.sub}</div>
          </Section>
        ))}
      </div>

      {goals?.objectif_ca && (
        <Section style={{marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:"#475569",marginBottom:4}}>OBJECTIF CA</div>
              <div style={{fontSize:28,fontWeight:700,fontFamily:"'DM Mono',monospace",color:"#F59E0B"}}>{parseInt(goals.objectif_ca).toLocaleString()}€</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:10,color:"#475569",marginBottom:4}}>CLIENTS VISÉS</div>
              <div style={{fontSize:28,fontWeight:700,fontFamily:"'DM Mono',monospace",color:"#8B5CF6"}}>{goals.objectif_clients||"—"}</div>
            </div>
          </div>
        </Section>
      )}

      {/* Metrics grid */}
      <Section>
        <SectionTitle>Performances moyennes</SectionTitle>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {metrics.map(m => {
            const avg = calcAvg(m.key);
            const pct = calcPct(m.key, m.goal_key);
            const ok   = pct !== null && pct >= 100;
            const warn = pct !== null && pct >= 70 && pct < 100;
            return (
              <div key={m.key} style={{background:"#060C1A",borderRadius:10,padding:"12px",border:`1px solid ${ok?m.color+"55":"#1E293B"}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <span style={{fontSize:10,fontWeight:700,color:"#475569"}}>{m.label.toUpperCase()}</span>
                  <span style={{width:6,height:6,borderRadius:"50%",background:ok?"#10B981":warn?"#F59E0B":pct!==null?"#EF4444":"#1E3A5F"}}/>
                </div>
                <div style={{fontSize:24,fontWeight:700,fontFamily:"'DM Mono',monospace",color:m.color}}>{avg}</div>
                {pct !== null && (
                  <>
                    <div style={{height:2,background:"#1E293B",borderRadius:1,marginTop:6}}>
                      <div style={{height:"100%",width:`${Math.min(100,pct)}%`,background:ok?"#10B981":warn?"#F59E0B":"#EF4444",borderRadius:1}}/>
                    </div>
                    <div style={{fontSize:10,color:ok?"#10B981":warn?"#F59E0B":"#EF4444",marginTop:3}}>{pct}% obj. {goals[m.goal_key]}</div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* Recent table */}
      {entries.length > 0 && (
        <Section>
          <SectionTitle>5 derniers jours</SectionTitle>
          {entries.slice(-5).reverse().map((entry, i) => (
            <div key={entry.date} style={{borderBottom:i<4?"1px solid #1E293B":"none",paddingBottom:10,marginBottom:i<4?10:0}}>
              <div style={{fontSize:12,fontWeight:700,color:i===0?"#60A5FA":"#64748B",marginBottom:6}}>
                {entry.date===TODAY?"Aujourd'hui":entry.date.slice(5)}
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {metrics.map(m => {
                  const val = parseFloat(entry[m.key])||0;
                  if (!val) return null;
                  const goal = goals ? parseFloat(goals[m.goal_key])||0 : 0;
                  return (
                    <span key={m.key} style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:m.color+"22",color:goal>0&&val>=goal?"#10B981":m.color,fontWeight:600}}>
                      {m.label} {val}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

/* ── Entry ─────────────────────────────────────────────────────────────── */
function EntryTab({ todayDraft, setTodayDraft, saveEntry, saving, saveMsg, todaySaved, goals }) {
  const set = (k,v) => setTodayDraft(prev => ({...prev,[k]:v}));
  const groups = [
    {title:"Acquisition Payante",  color:"#F59E0B", metrics:[METRICS[0]]},
    {title:"Acquisition Directe",  color:"#EC4899", metrics:[METRICS[2],METRICS[3],METRICS[4]]},
    {title:"Contenu & Présence",   color:"#3B82F6", metrics:[METRICS[5],METRICS[6],METRICS[7]]},
    {title:"Conversion",           color:"#10B981", metrics:[METRICS[1]]},
  ];

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:"#F1F5F9"}}>{TODAY}</div>
          <div style={{fontSize:11,color:todaySaved?"#10B981":"#64748B",marginTop:2}}>{todaySaved?"✓ Sauvegardé":"Non sauvegardé"}</div>
        </div>
        <button onClick={saveEntry} disabled={saving} style={{
          background:"linear-gradient(135deg,#1D4ED8,#3B82F6)",color:"white",
          padding:"11px 22px",borderRadius:10,border:"none",cursor:"pointer",
          fontSize:14,fontWeight:700,
        }}>{saving?"..." : saveMsg||"Sauvegarder"}</button>
      </div>

      {groups.map(g => (
        <div key={g.title} style={{marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <div style={{width:3,height:14,background:g.color,borderRadius:2}}/>
            <span style={{fontSize:10,fontWeight:700,letterSpacing:2,color:g.color}}>{g.title.toUpperCase()}</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:g.metrics.length===1?"1fr":"1fr 1fr",gap:10}}>
            {g.metrics.map(m => {
              const val  = parseFloat(todayDraft[m.key])||0;
              const goal = goals ? parseFloat(goals[m.goal_key])||0 : 0;
              const ok   = goal>0 && val>=goal;
              return (
                <div key={m.key} style={{background:"#0F1E36",border:`1px solid ${ok?m.color+"66":"#1E3A5F"}`,borderRadius:12,padding:"14px 16px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                    <div>
                      <div style={{fontSize:12,fontWeight:600,color:"#94A3B8"}}>{m.label}</div>
                      {goal>0&&<div style={{fontSize:10,color:"#334155",marginTop:2}}>Obj: {goal}</div>}
                    </div>
                    {ok&&<span style={{color:"#10B981",fontSize:14}}>✓</span>}
                  </div>
                  <input
                    type="number" inputMode="numeric" min="0"
                    step={m.key==="budget_pub"?"0.01":"1"}
                    value={todayDraft[m.key]??""}
                    onChange={e=>set(m.key,e.target.value)}
                    placeholder="0"
                    style={{
                      width:"100%",fontSize:34,fontFamily:"'DM Mono',monospace",fontWeight:700,
                      padding:"4px 0",background:"none",border:"none",
                      borderBottom:`2px solid ${ok?m.color:"#1E3A5F"}`,
                      borderRadius:0,color:ok?m.color:"#E2E8F0",outline:"none",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <Section>
        <SectionTitle>Note du jour</SectionTitle>
        <textarea
          value={todayDraft.note??""}
          onChange={e=>set("note",e.target.value)}
          placeholder="Blocages, opportunités, remarques..."
          rows={3}
          style={{width:"100%",background:"#060C1A",border:"1px solid #1E3A5F",borderRadius:8,padding:"10px 12px",color:"#E2E8F0",fontSize:14,resize:"vertical",outline:"none",lineHeight:1.6}}
        />
      </Section>
    </div>
  );
}

/* ── Trends ────────────────────────────────────────────────────────────── */
function TrendsTab({ entries, metrics }) {
  const [selected, setSelected] = useState("rdv");
  const chartRef = useRef(null);
  const chartInst = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (window.Chart) { setLoaded(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    s.onload = () => setLoaded(true);
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (!loaded || !entries.length || !chartRef.current) return;
    if (chartInst.current) chartInst.current.destroy();
    const m = metrics.find(x => x.key===selected);
    const recent = entries.slice(-14);
    chartInst.current = new window.Chart(chartRef.current, {
      type:"line",
      data:{
        labels: recent.map(e=>e.date.slice(5)),
        datasets:[{
          label:m.label, data:recent.map(e=>parseFloat(e[selected])||0),
          borderColor:m.color, backgroundColor:m.color+"18",
          borderWidth:2.5, fill:true, tension:0.4,
          pointBackgroundColor:m.color, pointRadius:4, pointHoverRadius:7,
        }]
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{legend:{display:false}},
        scales:{
          x:{grid:{color:"#1E293B"},ticks:{color:"#475569",font:{size:10},maxRotation:45}},
          y:{grid:{color:"#1E293B"},ticks:{color:"#475569",font:{size:11}},beginAtZero:true}
        }
      }
    });
  }, [loaded, selected, entries]);

  if (!entries.length) return (
    <div style={{textAlign:"center",padding:"60px 20px",color:"#334155"}}>
      <div style={{fontSize:44,marginBottom:12}}>📊</div>
      <div>Saisis des données pour voir les tendances</div>
    </div>
  );

  const m = metrics.find(x=>x.key===selected);
  const vals = entries.map(e=>parseFloat(e[selected])||0);
  const avg = (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1);
  const max = Math.max(...vals);
  const l7 = vals.slice(-7).reduce((a,b)=>a+b,0)/(vals.slice(-7).length||1);
  const p7 = vals.slice(-14,-7).reduce((a,b)=>a+b,0)/(vals.slice(-14,-7).length||1);
  const trend = p7===0?null:((l7-p7)/p7*100).toFixed(0);

  return (
    <div>
      {/* Metric selector - scrollable pills */}
      <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4,marginBottom:14,scrollbarWidth:"none"}}>
        <style>{`.no-scroll::-webkit-scrollbar{display:none}`}</style>
        {metrics.map(mx => (
          <button key={mx.key} onClick={()=>setSelected(mx.key)} style={{
            flexShrink:0, padding:"7px 14px",fontSize:12,borderRadius:20,cursor:"pointer",
            fontWeight:selected===mx.key?700:400,whiteSpace:"nowrap",
            border:`1.5px solid ${selected===mx.key?mx.color:"#1E3A5F"}`,
            background:selected===mx.key?mx.color+"22":"#0F1E36",
            color:selected===mx.key?mx.color:"#64748B",
          }}>{mx.label}</button>
        ))}
      </div>

      {/* Stats row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
        {[
          {label:"Moyenne",    val:avg,  color:m.color},
          {label:"Maximum",    val:max,  color:"#10B981"},
          {label:"Tendance 7j",val:trend===null?"—":(parseInt(trend)>0?"↑+":"↓")+trend+"%", color:trend===null?"#475569":parseInt(trend)>0?"#10B981":"#EF4444"},
        ].map(s=>(
          <Section key={s.label} style={{marginBottom:0,padding:"12px 14px",textAlign:"center"}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,color:"#475569",marginBottom:6}}>{s.label.toUpperCase()}</div>
            <div style={{fontSize:22,fontWeight:700,fontFamily:"'DM Mono',monospace",color:s.color}}>{s.val}</div>
          </Section>
        ))}
      </div>

      <Section>
        <div style={{position:"relative",height:240}}>
          <canvas ref={chartRef}/>
        </div>
      </Section>
    </div>
  );
}

/* ── AI ────────────────────────────────────────────────────────────────── */
function AITab({ aiText, aiLoading, runAI, entries, goals, metrics }) {
  const chartRef  = useRef(null);
  const chartInst = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (window.Chart) { setLoaded(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    s.onload = () => setLoaded(true);
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (!loaded || !entries.length || !chartRef.current) return;
    if (chartInst.current) chartInst.current.destroy();
    const recent = entries.slice(-7);
    const keys = ["rdv","appels","dms","conversations"];
    const colors = ["#10B981","#3B82F6","#EC4899","#8B5CF6"];
    chartInst.current = new window.Chart(chartRef.current, {
      type:"bar",
      data:{
        labels: recent.map(e=>e.date.slice(5)),
        datasets: keys.map((k,i)=>({
          label:metrics.find(x=>x.key===k)?.label||k,
          data:recent.map(e=>parseFloat(e[k])||0),
          backgroundColor:colors[i]+"BB",borderRadius:4,borderSkipped:false,
        }))
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{legend:{labels:{color:"#94A3B8",font:{size:10},boxWidth:8,boxHeight:8,padding:10}}},
        scales:{
          x:{grid:{color:"#1E293B"},ticks:{color:"#475569",font:{size:10},maxRotation:45}},
          y:{grid:{color:"#1E293B"},ticks:{color:"#475569",font:{size:10}},beginAtZero:true}
        }
      }
    });
  }, [loaded, entries]);

  const sections = aiText ? aiText.split(/(?=🟢|🔴|⚡|🎯)/).filter(s=>s.trim()).map(s=>{
    const emoji = s.match(/^(🟢|🔴|⚡|🎯)/)?.[0]||"";
    const colors = {"🟢":"#10B981","🔴":"#EF4444","⚡":"#F59E0B","🎯":"#3B82F6"};
    return {emoji, color:colors[emoji]||"#64748B", text:s.replace(/^(🟢|🔴|⚡|🎯)\s*/,"").trim()};
  }) : [];

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <div style={{fontSize:16,fontWeight:700,color:"#F1F5F9"}}>Analyse IA</div>
          <div style={{fontSize:11,color:"#64748B",marginTop:2}}>{entries.length} jour{entries.length>1?"s":""} analysé{entries.length>1?"s":""}</div>
        </div>
        <button onClick={runAI} disabled={aiLoading||!entries.length||!goals} style={{
          background:entries.length&&goals?"linear-gradient(135deg,#1D4ED8,#3B82F6)":"#1E293B",
          color:entries.length&&goals?"white":"#475569",
          padding:"11px 18px",borderRadius:10,border:"none",
          cursor:!entries.length||!goals?"not-allowed":"pointer",
          fontSize:13,fontWeight:700,
        }}>{aiLoading?"Analyse...":"Analyser →"}</button>
      </div>

      {entries.length > 0 && (
        <Section>
          <SectionTitle>7 derniers jours</SectionTitle>
          <div style={{position:"relative",height:200}}>
            <canvas ref={chartRef}/>
          </div>
        </Section>
      )}

      {!goals && <Section><div style={{color:"#F59E0B",fontSize:13}}>⚠️ Configure tes objectifs d'abord.</div></Section>}
      {!entries.length && goals && <Section><div style={{color:"#64748B",fontSize:13}}>Saisis au moins une journée de données.</div></Section>}

      {aiLoading && (
        <Section style={{textAlign:"center",padding:"40px 16px"}}>
          <div style={{width:36,height:36,border:"3px solid #1E3A5F",borderTopColor:"#3B82F6",borderRadius:"50%",margin:"0 auto 14px",animation:"spin 0.8s linear infinite"}}/>
          <div style={{color:"#64748B",fontSize:13}}>Analyse en cours...</div>
        </Section>
      )}

      {sections.length > 0 && !aiLoading && sections.map((s,i) => (
        <div key={i} style={{background:"#0F1E36",border:`1px solid ${s.color}33`,borderLeft:`3px solid ${s.color}`,borderRadius:14,padding:"16px",marginBottom:10}}>
          <div style={{fontSize:20,marginBottom:8}}>{s.emoji}</div>
          <div style={{fontSize:13,lineHeight:1.85,color:"#CBD5E1",whiteSpace:"pre-wrap"}}>{s.text}</div>
        </div>
      ))}

      {aiText && !sections.length && !aiLoading && (
        <Section style={{borderLeft:"3px solid #3B82F6"}}>
          <div style={{fontSize:13,lineHeight:1.85,color:"#CBD5E1",whiteSpace:"pre-wrap"}}>{aiText}</div>
        </Section>
      )}
    </div>
  );
}

/* ── Goals tab ─────────────────────────────────────────────────────────── */
function GoalsTab({ goals, setGoalDraft, setScreen }) {
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:16,fontWeight:700,color:"#F1F5F9"}}>Objectifs du mois</div>
        <button onClick={()=>{setGoalDraft(goals||{});setScreen("setup");}} style={{background:"#1E3A5F",color:"#60A5FA",padding:"9px 16px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:700}}>
          Modifier
        </button>
      </div>
      {goals ? (
        <div>
          {GOAL_FIELDS.map(f => goals[f.key] ? (
            <div key={f.key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",background:"#0F1E36",border:"1px solid #1E293B",borderRadius:10,marginBottom:8}}>
              <span style={{fontSize:13,color:"#64748B",flex:1}}>{f.label}</span>
              <span style={{fontSize:14,fontWeight:700,fontFamily:f.numeric?"'DM Mono',monospace":"inherit",color:"#E2E8F0",marginLeft:12,textAlign:"right"}}>{goals[f.key]}</span>
            </div>
          ):null)}
        </div>
      ) : (
        <Section style={{textAlign:"center",padding:"40px 16px"}}>
          <div style={{fontSize:40,marginBottom:14}}>🎯</div>
          <button onClick={()=>{setGoalDraft({});setScreen("setup");}} style={{background:"linear-gradient(135deg,#1D4ED8,#3B82F6)",color:"white",padding:"13px 28px",borderRadius:10,border:"none",cursor:"pointer",fontSize:15,fontWeight:700}}>
            Configurer →
          </button>
        </Section>
      )}
    </div>
  );
}

/* ── Setup ─────────────────────────────────────────────────────────────── */
function Setup({ goalDraft, setGoalDraft, saveGoals, saving, existing }) {
  const set = (k,v) => setGoalDraft(prev=>({...prev,[k]:v}));
  return (
    <div style={{minHeight:"100vh",background:"#060C1A",color:"#E2E8F0",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",padding:"32px 16px 80px"}}>
      <style>{globalCss}</style>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{fontSize:9,letterSpacing:4,color:"#3B82F6",fontWeight:700,marginBottom:10}}>FUNNELS ACQUISITIONS</div>
        <h1 style={{fontSize:26,fontWeight:700,color:"#F1F5F9",margin:"0 0 10px"}}>{existing?"Modifier les objectifs":"Définis tes objectifs"}</h1>
        <p style={{color:"#64748B",fontSize:14,margin:0}}>L'IA analysera tes performances chaque jour</p>
      </div>

      <div style={{background:"#0F1E36",border:"1px solid #1E3A5F",borderRadius:16,padding:"20px 16px",maxWidth:520,margin:"0 auto"}}>
        <div style={{display:"grid",gap:14}}>
          {GOAL_FIELDS.map(f=>(
            <div key={f.key}>
              <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:1.5,color:"#475569",marginBottom:6}}>{f.label.toUpperCase()}</label>
              {f.multiline ? (
                <textarea value={goalDraft[f.key]??""} onChange={e=>set(f.key,e.target.value)} placeholder={f.placeholder} rows={3}
                  style={{width:"100%",background:"#060C1A",border:"1px solid #1E3A5F",borderRadius:8,padding:"11px 14px",color:"#E2E8F0",fontSize:15,resize:"vertical",outline:"none",lineHeight:1.6}}/>
              ):(
                <input type={f.numeric?"number":"text"} inputMode={f.numeric?"numeric":"text"} value={goalDraft[f.key]??""} onChange={e=>set(f.key,e.target.value)} placeholder={f.placeholder} min="0"
                  style={{width:"100%",background:"#060C1A",border:"1px solid #1E3A5F",borderRadius:8,padding:"13px 14px",color:"#E2E8F0",fontSize:16,outline:"none",fontFamily:f.numeric?"'DM Mono',monospace":"inherit"}}/>
              )}
            </div>
          ))}
        </div>
        <button onClick={saveGoals} disabled={saving||!goalDraft.mois} style={{
          width:"100%",marginTop:24,padding:"15px",
          background:goalDraft.mois?"linear-gradient(135deg,#1D4ED8,#3B82F6)":"#1E293B",
          border:"none",borderRadius:10,cursor:!goalDraft.mois?"not-allowed":"pointer",
          fontSize:16,fontWeight:700,color:goalDraft.mois?"white":"#475569",
        }}>{saving?"Sauvegarde...":existing?"Mettre à jour →":"Commencer →"}</button>
      </div>
    </div>
  );
}
