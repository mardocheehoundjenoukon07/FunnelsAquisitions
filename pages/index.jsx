import { useState, useEffect, useRef } from "react";

const METRICS = [
  { key: "budget_pub", label: "Budget pub", unit: "€", color: "#F59E0B", bg: "#F59E0B22", goal_key: "budget_pub_jour", desc: "Dépense pub" },
  { key: "rdv", label: "Rendez-vous", unit: "RDV", color: "#10B981", bg: "#10B98122", goal_key: "rdv_jour", desc: "RDV reçus" },
  { key: "appels", label: "Appels", unit: "", color: "#3B82F6", bg: "#3B82F622", goal_key: "appels_jour", desc: "Appels reçus" },
  { key: "conversations", label: "Conversations", unit: "", color: "#8B5CF6", bg: "#8B5CF622", goal_key: "conversations_jour", desc: "Conv. engagées" },
  { key: "dms", label: "DMs envoyés", unit: "", color: "#EC4899", bg: "#EC489922", goal_key: "dms_jour", desc: "DMs/jour" },
  { key: "posts_facebook", label: "Facebook", unit: "", color: "#60A5FA", bg: "#60A5FA22", goal_key: "posts_facebook_jour", desc: "Posts FB" },
  { key: "posts_tiktok", label: "TikTok", unit: "", color: "#F43F5E", bg: "#F43F5E22", goal_key: "posts_tiktok_jour", desc: "Posts TT" },
  { key: "posts_linkedin", label: "LinkedIn", unit: "", color: "#06B6D4", bg: "#06B6D422", goal_key: "posts_linkedin_jour", desc: "Posts LI" },
];

const GOAL_FIELDS = [
  { key: "mois", label: "Mois objectif", placeholder: "ex: Avril 2026" },
  { key: "objectif_ca", label: "Objectif CA mensuel (€)", placeholder: "ex: 10000", numeric: true },
  { key: "objectif_clients", label: "Nouveaux clients visés", placeholder: "ex: 5", numeric: true },
  { key: "budget_pub_jour", label: "Budget pub/jour (€)", placeholder: "ex: 30", numeric: true },
  { key: "rdv_jour", label: "Rendez-vous/jour visés", placeholder: "ex: 2", numeric: true },
  { key: "appels_jour", label: "Appels/jour visés", placeholder: "ex: 5", numeric: true },
  { key: "conversations_jour", label: "Conversations/jour visées", placeholder: "ex: 10", numeric: true },
  { key: "dms_jour", label: "DMs/jour visés", placeholder: "ex: 20", numeric: true },
  { key: "posts_facebook_jour", label: "Posts Facebook/jour", placeholder: "ex: 1", numeric: true },
  { key: "posts_tiktok_jour", label: "Posts TikTok/jour", placeholder: "ex: 1", numeric: true },
  { key: "posts_linkedin_jour", label: "Posts LinkedIn/jour", placeholder: "ex: 1", numeric: true },
  { key: "strategie", label: "Stratégie du mois", placeholder: "Décris ton plan d'action...", multiline: true },
];

const TODAY = new Date().toISOString().split("T")[0];

function getMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function storageGet(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; }
}
function storageSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #060C1A; }
  input[type=number]::-webkit-inner-spin-button { opacity: 0.3; }
  input::placeholder, textarea::placeholder { color: #334155; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .fade-in { animation: fadeIn 0.3s ease; }
  ::-webkit-scrollbar { width: 4px; } 
  ::-webkit-scrollbar-track { background: #0B1628; }
  ::-webkit-scrollbar-thumb { background: #1E3A5F; border-radius: 2px; }
`;

export default function App() {
  const [view, setView] = useState("loading");
  const [goals, setGoals] = useState(null);
  const [goalDraft, setGoalDraft] = useState({});
  const [entries, setEntries] = useState([]);
  const [todayDraft, setTodayDraft] = useState({});
  const [todaySaved, setTodaySaved] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    const g = storageGet(`goals:${getMonthKey()}`);
    const allEntries = storageGet("entries:all") || [];
    const todayEntry = storageGet(`entry:${TODAY}`);
    setGoals(g); setEntries(allEntries);
    if (todayEntry) { setTodayDraft(todayEntry); setTodaySaved(true); }
    setView(g ? "dashboard" : "goals");
  }, []);

  const saveGoals = () => {
    setSaving(true);
    storageSet(`goals:${getMonthKey()}`, goalDraft);
    setGoals(goalDraft); setSaving(false); setView("dashboard");
  };

  const saveTodayEntry = () => {
    setSaving(true);
    const entry = { ...todayDraft, date: TODAY };
    storageSet(`entry:${TODAY}`, entry);
    const all = storageGet("entries:all") || [];
    const idx = all.findIndex(e => e.date === TODAY);
    if (idx >= 0) all[idx] = entry; else all.push(entry);
    all.sort((a, b) => a.date.localeCompare(b.date));
    storageSet("entries:all", all);
    setEntries(all); setTodaySaved(true); setSaving(false);
    setSaveMsg("✓ Sauvegardé"); setTimeout(() => setSaveMsg(""), 3000);
  };

  const runAiAnalysis = async () => {
    if (!goals || entries.length === 0) return;
    setAiLoading(true); setAiAnalysis("");
    const recent = entries.slice(-14);
    const prompt = `Tu es un coach marketing expert. Analyse ces données et donne des recommandations ultra-concrètes.

OBJECTIFS (${goals.mois}):
CA visé: ${goals.objectif_ca}€ | Clients: ${goals.objectif_clients} | Stratégie: ${goals.strategie || "Non précisée"}
Cibles/jour: pub=${goals.budget_pub_jour}€, rdv=${goals.rdv_jour}, appels=${goals.appels_jour}, conv=${goals.conversations_jour}, dms=${goals.dms_jour}, fb=${goals.posts_facebook_jour}, tt=${goals.posts_tiktok_jour}, li=${goals.posts_linkedin_jour}

DONNÉES (${recent.length} derniers jours):
${recent.map(e => `${e.date}: pub=${e.budget_pub||0}€ rdv=${e.rdv||0} appels=${e.appels||0} conv=${e.conversations||0} dms=${e.dms||0} fb=${e.posts_facebook||0} tt=${e.posts_tiktok||0} li=${e.posts_linkedin||0}`).join("\n")}

Réponds OBLIGATOIREMENT avec ces 4 sections dans cet ordre exact:
🟢 CE QUI MARCHE
🔴 PRIORITÉS D'AMÉLIORATION
⚡ ACTIONS POUR DEMAIN
🎯 FOCUS DE LA SEMAINE

Sois direct, chiffré, actionnable. Français uniquement.`;
    try {
      const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) });
      const data = await res.json();
      setAiAnalysis(data.content?.[0]?.text || "Erreur d'analyse.");
    } catch { setAiAnalysis("Impossible de contacter l'IA. Vérifie ta clé API."); }
    setAiLoading(false);
  };

  const calcAvg = (key) => {
    if (!entries.length) return 0;
    return (entries.reduce((a, e) => a + (parseFloat(e[key]) || 0), 0) / entries.length).toFixed(1);
  };
  const calcPct = (key, goalKey) => {
    if (!goals?.[goalKey]) return null;
    return Math.round((parseFloat(calcAvg(key)) / parseFloat(goals[goalKey])) * 100);
  };

  if (view === "loading") return (
    <div style={{ minHeight: "100vh", background: "#060C1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{css}</style>
      <div style={{ color: "#3B82F6", fontSize: 13, letterSpacing: 4, fontFamily: "system-ui" }}>CHARGEMENT...</div>
    </div>
  );

  if (view === "goals") return <GoalSetup goalDraft={goalDraft} setGoalDraft={setGoalDraft} saveGoals={saveGoals} saving={saving} existingGoals={goals} />;

  const tabs = [
    { id: "overview", label: "Vue d'ensemble", icon: "⊞" },
    { id: "entry", label: todaySaved ? "Saisie ✓" : "Saisie du jour", icon: "✦" },
    { id: "trends", label: "Tendances", icon: "⌇" },
    { id: "ai", label: "Analyse IA", icon: "◈" },
    { id: "goals", label: "Objectifs", icon: "⊙" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#060C1A", color: "#E2E8F0", fontFamily: "'DM Sans', system-ui, sans-serif", display: "flex" }}>
      <style>{css}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Sidebar */}
      <div style={{ width: 230, background: "#0B1628", borderRight: "1px solid #1E293B", padding: "28px 0", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 100 }}>
        <div style={{ padding: "0 24px 24px", borderBottom: "1px solid #1E293B", marginBottom: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: 4, color: "#3B82F6", fontWeight: 700, marginBottom: 6 }}>FUNNEL</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#F1F5F9" }}>Acquisitions</div>
        </div>
        {tabs.map(t => {
          const active = activeTab === t.id;
          return (
            <div key={t.id} onClick={() => setActiveTab(t.id)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "11px 24px", cursor: "pointer",
              color: active ? "#60A5FA" : "#64748B", background: active ? "#1E3A5F33" : "none",
              borderLeft: active ? "2px solid #3B82F6" : "2px solid transparent",
              fontSize: 13, fontWeight: active ? 600 : 400, transition: "all 0.15s", marginBottom: 2,
            }}>
              <span style={{ fontSize: 14 }}>{t.icon}</span>
              <span>{t.label}</span>
            </div>
          );
        })}
        <div style={{ marginTop: "auto", padding: "20px 24px", borderTop: "1px solid #1E293B" }}>
          <div style={{ fontSize: 11, color: "#334155", marginBottom: 4, letterSpacing: 1 }}>MOIS EN COURS</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#60A5FA" }}>{goals?.mois || getMonthKey()}</div>
          <div style={{ fontSize: 11, color: "#334155", marginTop: 6 }}>{entries.length} jours enregistrés</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ marginLeft: 230, flex: 1, padding: "36px 36px 80px" }} className="fade-in">
        {activeTab === "overview" && <Overview metrics={METRICS} goals={goals} calcAvg={calcAvg} calcPct={calcPct} entries={entries} />}
        {activeTab === "entry" && <DailyEntry todayDraft={todayDraft} setTodayDraft={setTodayDraft} saveTodayEntry={saveTodayEntry} saving={saving} saveMsg={saveMsg} todaySaved={todaySaved} goals={goals} />}
        {activeTab === "trends" && <TrendsView entries={entries} metrics={METRICS} />}
        {activeTab === "ai" && <AiView aiAnalysis={aiAnalysis} aiLoading={aiLoading} runAiAnalysis={runAiAnalysis} entries={entries} goals={goals} metrics={METRICS} />}
        {activeTab === "goals" && <GoalView goals={goals} setGoalDraft={setGoalDraft} setViewOuter={setView} />}
      </div>
    </div>
  );
}

function PageHeader({ label, title, subtitle }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: "#3B82F6", marginBottom: 8 }}>{label}</div>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "#F1F5F9", margin: 0 }}>{title}</h1>
      {subtitle && <div style={{ fontSize: 13, color: "#64748B", marginTop: 6 }}>{subtitle}</div>}
    </div>
  );
}

function Card({ children, style = {}, glow }) {
  return (
    <div style={{ background: "#0F1E36", border: `1px solid ${glow || "#1E3A5F"}`, borderRadius: 16, padding: "20px 24px", ...style }}>
      {children}
    </div>
  );
}

function Overview({ metrics, goals, calcAvg, calcPct, entries }) {
  const d = new Date();
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const monthPct = Math.round((d.getDate() / daysInMonth) * 100);

  return (
    <div>
      <PageHeader label="TABLEAU DE BORD" title={goals?.mois || "Ce mois-ci"} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Avancement du mois", val: monthPct + "%", sub: `Jour ${d.getDate()} / ${daysInMonth}`, color: "#3B82F6", pct: monthPct },
          { label: "Jours suivis", val: entries.length, sub: `${Math.round((entries.length/daysInMonth)*100)}% de couverture`, color: "#10B981", pct: Math.round((entries.length/daysInMonth)*100) },
          { label: "Objectif CA", val: goals?.objectif_ca ? parseInt(goals.objectif_ca).toLocaleString() + "€" : "—", sub: `${goals?.objectif_clients || "—"} clients visés`, color: "#F59E0B", pct: null },
        ].map(item => (
          <Card key={item.label}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#475569", marginBottom: 10 }}>{item.label.toUpperCase()}</div>
            <div style={{ fontSize: 36, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: item.color, marginBottom: 4 }}>{item.val}</div>
            {item.pct !== null && (
              <div style={{ height: 3, background: "#1E293B", borderRadius: 2, margin: "8px 0" }}>
                <div style={{ height: "100%", width: `${Math.min(100, item.pct)}%`, background: item.color, borderRadius: 2, transition: "width 1s ease" }} />
              </div>
            )}
            <div style={{ fontSize: 12, color: "#475569" }}>{item.sub}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
        {metrics.map(m => {
          const avg = calcAvg(m.key);
          const pct = calcPct(m.key, m.goal_key);
          const ok = pct !== null && pct >= 100;
          const warn = pct !== null && pct >= 70 && pct < 100;
          return (
            <div key={m.key} style={{ background: "#0F1E36", border: `1px solid ${ok ? m.color + "55" : "#1E3A5F"}`, borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: "#475569" }}>{m.label.toUpperCase()}</span>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: ok ? "#10B981" : warn ? "#F59E0B" : pct !== null ? "#EF4444" : "#1E3A5F" }} />
              </div>
              <div style={{ fontSize: 30, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: m.color }}>{avg}</div>
              <div style={{ fontSize: 10, color: "#334155", marginBottom: 8 }}>moy/jour</div>
              {pct !== null && (
                <>
                  <div style={{ height: 2, background: "#1E293B", borderRadius: 1 }}>
                    <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: ok ? "#10B981" : warn ? "#F59E0B" : "#EF4444", borderRadius: 1 }} />
                  </div>
                  <div style={{ fontSize: 10, color: ok ? "#10B981" : warn ? "#F59E0B" : "#EF4444", marginTop: 4 }}>
                    {pct}% · objectif {goals[m.goal_key]}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {entries.length > 0 && (
        <Card>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#475569", marginBottom: 16 }}>7 DERNIERS JOURS</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 700 }}>
              <thead>
                <tr>
                  <th style={{ padding: "8px 12px", textAlign: "left", color: "#334155", fontWeight: 600, borderBottom: "1px solid #1E293B", fontSize: 11 }}>DATE</th>
                  {metrics.map(m => <th key={m.key} style={{ padding: "8px 10px", textAlign: "center", color: m.color, fontWeight: 700, borderBottom: "1px solid #1E293B", fontSize: 10, letterSpacing: 1 }}>{m.label.toUpperCase()}</th>)}
                </tr>
              </thead>
              <tbody>
                {entries.slice(-7).reverse().map((entry, i) => (
                  <tr key={entry.date}>
                    <td style={{ padding: "11px 12px", color: i === 0 ? "#60A5FA" : "#64748B", fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: i === 0 ? 600 : 400, borderBottom: "1px solid #0B1628" }}>
                      {entry.date === TODAY ? "Aujourd'hui" : entry.date.slice(5)}
                    </td>
                    {metrics.map(m => {
                      const val = parseFloat(entry[m.key]) || 0;
                      const goal = goals ? parseFloat(goals[m.goal_key]) || 0 : 0;
                      return (
                        <td key={m.key} style={{ padding: "11px 10px", textAlign: "center", fontFamily: "'DM Mono', monospace", color: goal > 0 && val >= goal ? "#10B981" : val > 0 ? "#CBD5E1" : "#1E3A5F", borderBottom: "1px solid #0B1628" }}>
                          {val > 0 ? val : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function DailyEntry({ todayDraft, setTodayDraft, saveTodayEntry, saving, saveMsg, todaySaved, goals }) {
  const set = (key, val) => setTodayDraft(prev => ({ ...prev, [key]: val }));
  const groups = [
    { title: "Acquisition Payante", color: "#F59E0B", metrics: [METRICS[0]] },
    { title: "Acquisition Directe", color: "#EC4899", metrics: [METRICS[2], METRICS[3], METRICS[4]] },
    { title: "Contenu & Présence", color: "#3B82F6", metrics: [METRICS[5], METRICS[6], METRICS[7]] },
    { title: "Conversion", color: "#10B981", metrics: [METRICS[1]] },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <PageHeader label="SAISIE QUOTIDIENNE" title={`Journée du ${TODAY}`} subtitle={todaySaved ? "✓ Données sauvegardées" : "Renseigne tes chiffres du jour"} />
        <button onClick={saveTodayEntry} disabled={saving} style={{
          background: "linear-gradient(135deg, #1D4ED8, #3B82F6)", color: "white",
          padding: "12px 28px", borderRadius: 10, border: "none", cursor: saving ? "not-allowed" : "pointer",
          fontSize: 14, fontWeight: 700, opacity: saving ? 0.7 : 1,
        }}>{saving ? "Sauvegarde..." : saveMsg || "Sauvegarder →"}</button>
      </div>

      {groups.map(g => (
        <div key={g.title} style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 3, height: 18, background: g.color, borderRadius: 2 }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, color: g.color }}>{g.title.toUpperCase()}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            {g.metrics.map(m => {
              const val = parseFloat(todayDraft[m.key]) || 0;
              const goal = goals ? parseFloat(goals[m.goal_key]) || 0 : 0;
              const ok = goal > 0 && val >= goal;
              return (
                <div key={m.key} style={{ background: "#0F1E36", border: `1px solid ${ok ? m.color + "66" : "#1E3A5F"}`, borderRadius: 14, padding: "18px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#94A3B8" }}>{m.label}</div>
                      {goal > 0 && <div style={{ fontSize: 10, color: "#334155", marginTop: 3 }}>Objectif : {goal}{m.unit}</div>}
                    </div>
                    {ok && <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#10B98133", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#10B981" }}>✓</div>}
                  </div>
                  <input
                    type="number" min="0" step={m.key === "budget_pub" ? "0.01" : "1"}
                    value={todayDraft[m.key] ?? ""}
                    onChange={e => set(m.key, e.target.value)}
                    placeholder="0"
                    style={{
                      width: "100%", fontSize: 32, fontFamily: "'DM Mono', monospace", fontWeight: 700,
                      padding: "4px 0", background: "none", border: "none",
                      borderBottom: `2px solid ${ok ? m.color : "#1E3A5F"}`, borderRadius: 0,
                      color: ok ? m.color : "#E2E8F0", outline: "none",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#475569", marginBottom: 10 }}>NOTE DU JOUR</div>
        <textarea
          value={todayDraft.note ?? ""} onChange={e => set("note", e.target.value)}
          placeholder="Ce qui s'est passé, blocages, opportunités..."
          rows={3}
          style={{ width: "100%", background: "#0F1E36", border: "1px solid #1E3A5F", borderRadius: 10, padding: "12px 16px", color: "#E2E8F0", fontSize: 14, fontFamily: "'DM Sans', system-ui", resize: "vertical", outline: "none", lineHeight: 1.6 }}
        />
      </div>
    </div>
  );
}

function TrendsView({ entries, metrics }) {
  const [selected, setSelected] = useState("rdv");
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [loaded, setLoaded] = useState(!!window.Chart);

  useEffect(() => {
    if (window.Chart) { setLoaded(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    s.onload = () => setLoaded(true);
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (!loaded || !entries.length || !chartRef.current) return;
    if (chartInstance.current) chartInstance.current.destroy();
    const metric = metrics.find(m => m.key === selected);
    const recent = entries.slice(-21);
    chartInstance.current = new window.Chart(chartRef.current, {
      type: "line",
      data: {
        labels: recent.map(e => e.date.slice(5)),
        datasets: [{
          label: metric.label, data: recent.map(e => parseFloat(e[selected]) || 0),
          borderColor: metric.color, backgroundColor: metric.color + "15",
          borderWidth: 2.5, fill: true, tension: 0.4,
          pointBackgroundColor: metric.color, pointRadius: 4, pointHoverRadius: 6,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: "#1E293B88" }, ticks: { color: "#475569", font: { size: 11, family: "'DM Mono'" }, maxRotation: 45 } },
          y: { grid: { color: "#1E293B88" }, ticks: { color: "#475569", font: { size: 11 } }, beginAtZero: true }
        }
      }
    });
  }, [loaded, selected, entries]);

  if (!entries.length) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400 }}>
      <div style={{ textAlign: "center", color: "#334155" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <div style={{ fontSize: 14 }}>Saisis quelques jours pour voir les tendances</div>
      </div>
    </div>
  );

  const metric = metrics.find(m => m.key === selected);
  const vals = entries.map(e => parseFloat(e[selected]) || 0);
  const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  const max = Math.max(...vals);
  const l7 = vals.slice(-7); const p7 = vals.slice(-14, -7);
  const l7avg = l7.reduce((a, b) => a + b, 0) / (l7.length || 1);
  const p7avg = p7.reduce((a, b) => a + b, 0) / (p7.length || 1);
  const trend = p7avg === 0 ? null : ((l7avg - p7avg) / p7avg * 100).toFixed(0);

  return (
    <div>
      <PageHeader label="ANALYTICS" title="Évolution des métriques" />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {metrics.map(m => (
          <button key={m.key} onClick={() => setSelected(m.key)} style={{
            padding: "7px 14px", fontSize: 12, borderRadius: 8, cursor: "pointer",
            fontWeight: selected === m.key ? 700 : 400, fontFamily: "'DM Sans', system-ui",
            border: `1.5px solid ${selected === m.key ? m.color : "#1E3A5F"}`,
            background: selected === m.key ? m.color + "22" : "#0F1E36",
            color: selected === m.key ? m.color : "#64748B", transition: "all 0.15s",
          }}>{m.label}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "MOYENNE TOTALE", val: avg, color: metric.color },
          { label: "MEILLEUR JOUR", val: max, color: "#10B981" },
          { label: "TENDANCE 7J", val: trend === null ? "—" : (parseInt(trend) > 0 ? "↑ +" : "↓ ") + trend + "%", color: trend === null ? "#475569" : parseInt(trend) > 0 ? "#10B981" : "#EF4444" },
        ].map(s => (
          <Card key={s.label} style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#475569", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 34, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: s.color }}>{s.val}</div>
          </Card>
        ))}
      </div>

      <Card>
        <div style={{ position: "relative", height: 300 }}>
          <canvas ref={chartRef}></canvas>
        </div>
      </Card>
    </div>
  );
}

function AiView({ aiAnalysis, aiLoading, runAiAnalysis, entries, goals, metrics }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [loaded, setLoaded] = useState(!!window.Chart);

  useEffect(() => {
    if (window.Chart) { setLoaded(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    s.onload = () => setLoaded(true);
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (!loaded || !entries.length || !chartRef.current) return;
    if (chartInstance.current) chartInstance.current.destroy();
    const recent = entries.slice(-10);
    const keys = ["rdv", "appels", "dms", "conversations"];
    const colors = ["#10B981", "#3B82F6", "#EC4899", "#8B5CF6"];
    chartInstance.current = new window.Chart(chartRef.current, {
      type: "bar",
      data: {
        labels: recent.map(e => e.date.slice(5)),
        datasets: keys.map((key, i) => {
          const m = metrics.find(x => x.key === key);
          return { label: m?.label || key, data: recent.map(e => parseFloat(e[key]) || 0), backgroundColor: colors[i] + "CC", borderRadius: 4, borderSkipped: false };
        })
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: "#94A3B8", font: { size: 11, family: "'DM Sans'" }, boxWidth: 10, boxHeight: 10, padding: 16 } } },
        scales: {
          x: { grid: { color: "#1E293B88" }, ticks: { color: "#475569", font: { size: 10 }, maxRotation: 45 } },
          y: { grid: { color: "#1E293B88" }, ticks: { color: "#475569", font: { size: 11 } }, beginAtZero: true }
        }
      }
    });
  }, [loaded, entries]);

  const sections = aiAnalysis ? aiAnalysis.split(/(?=🟢|🔴|⚡|🎯)/).filter(s => s.trim()).map(s => {
    const emoji = s.match(/^(🟢|🔴|⚡|🎯)/)?.[0] || "";
    const colorMap = { "🟢": "#10B981", "🔴": "#EF4444", "⚡": "#F59E0B", "🎯": "#3B82F6" };
    return { emoji, color: colorMap[emoji] || "#64748B", text: s.replace(/^(🟢|🔴|⚡|🎯)\s*/, "").trim() };
  }) : [];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <PageHeader label="INTELLIGENCE ARTIFICIELLE" title="Analyse & Recommandations" subtitle={entries.length === 0 ? "Aucune donnée disponible" : `Basé sur ${entries.length} jour${entries.length > 1 ? "s" : ""} de données`} />
        <button onClick={runAiAnalysis} disabled={aiLoading || !entries.length || !goals} style={{
          background: entries.length > 0 && goals ? "linear-gradient(135deg, #1D4ED8, #3B82F6)" : "#1E293B",
          color: entries.length > 0 && goals ? "white" : "#475569",
          padding: "12px 28px", borderRadius: 10, border: "none",
          cursor: !entries.length || !goals ? "not-allowed" : "pointer",
          fontSize: 14, fontWeight: 700,
        }}>{aiLoading ? "Analyse en cours..." : "Lancer l'analyse IA →"}</button>
      </div>

      {entries.length > 0 && (
        <Card style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#475569", marginBottom: 16 }}>APERÇU — 10 DERNIERS JOURS</div>
          <div style={{ position: "relative", height: 230 }}>
            <canvas ref={chartRef}></canvas>
          </div>
        </Card>
      )}

      {!goals && <div style={{ background: "#F59E0B11", border: "1px solid #F59E0B33", borderRadius: 12, padding: "14px 18px", color: "#F59E0B", fontSize: 13 }}>⚠️ Configure tes objectifs du mois d'abord pour obtenir une analyse.</div>}
      {!entries.length && goals && <div style={{ background: "#0F1E36", border: "1px solid #1E3A5F", borderRadius: 12, padding: "14px 18px", color: "#64748B", fontSize: 13 }}>Saisis au moins une journée de données pour lancer l'analyse.</div>}

      {aiLoading && (
        <Card style={{ textAlign: "center", padding: "56px 24px" }}>
          <div style={{ width: 44, height: 44, border: "3px solid #1E3A5F", borderTopColor: "#3B82F6", borderRadius: "50%", margin: "0 auto 20px", animation: "spin 0.8s linear infinite" }} />
          <div style={{ color: "#64748B", fontSize: 14 }}>Gemini analyse tes performances...</div>
        </Card>
      )}

      {sections.length > 0 && !aiLoading && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="fade-in">
          {sections.map((s, i) => (
            <div key={i} style={{ background: "#0F1E36", border: `1px solid ${s.color}33`, borderLeft: `3px solid ${s.color}`, borderRadius: 14, padding: "20px 24px" }}>
              <div style={{ fontSize: 22, marginBottom: 12 }}>{s.emoji}</div>
              <div style={{ fontSize: 13, lineHeight: 1.85, color: "#CBD5E1", whiteSpace: "pre-wrap" }}>{s.text}</div>
            </div>
          ))}
        </div>
      )}

      {aiAnalysis && !sections.length && !aiLoading && (
        <Card style={{ borderLeft: "3px solid #3B82F6" }} className="fade-in">
          <div style={{ fontSize: 13, lineHeight: 1.85, color: "#CBD5E1", whiteSpace: "pre-wrap" }}>{aiAnalysis}</div>
        </Card>
      )}
    </div>
  );
}

function GoalView({ goals, setGoalDraft, setViewOuter }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <PageHeader label="CONFIGURATION" title="Objectifs du mois" />
        <button onClick={() => { setGoalDraft(goals || {}); setViewOuter("goals"); }} style={{
          background: "#1E3A5F", color: "#60A5FA", padding: "11px 22px", borderRadius: 10,
          border: "1px solid #1E3A5F", cursor: "pointer", fontSize: 13, fontWeight: 600,
        }}>Modifier les objectifs</button>
      </div>
      {goals ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {GOAL_FIELDS.map(f => goals[f.key] ? (
            <div key={f.key} style={{ background: "#0F1E36", border: "1px solid #1E3A5F", borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#64748B" }}>{f.label}</span>
              <span style={{ fontSize: 14, fontWeight: 700, fontFamily: f.numeric ? "'DM Mono', monospace" : "inherit", color: "#E2E8F0", maxWidth: "55%", textAlign: "right" }}>{goals[f.key]}</span>
            </div>
          ) : null)}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "64px 24px", color: "#334155" }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🎯</div>
          <button onClick={() => { setGoalDraft({}); setViewOuter("goals"); }} style={{ background: "linear-gradient(135deg, #1D4ED8, #3B82F6)", color: "white", padding: "13px 32px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 15, fontWeight: 700 }}>
            Configurer mes objectifs →
          </button>
        </div>
      )}
    </div>
  );
}

function GoalSetup({ goalDraft, setGoalDraft, saveGoals, saving, existingGoals }) {
  const set = (key, val) => setGoalDraft(prev => ({ ...prev, [key]: val }));
  return (
    <div style={{ minHeight: "100vh", background: "#060C1A", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{css}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 10, letterSpacing: 5, color: "#3B82F6", fontWeight: 700, marginBottom: 14 }}>FUNNELS ACQUISITIONS</div>
          <h1 style={{ fontSize: 34, fontWeight: 700, color: "#F1F5F9", margin: "0 0 12px" }}>{existingGoals ? "Modifier les objectifs" : "Définis tes objectifs"}</h1>
          <p style={{ color: "#64748B", fontSize: 15, margin: 0 }}>L'IA utilisera ces données pour analyser tes performances chaque jour</p>
        </div>
        <div style={{ background: "#0F1E36", border: "1px solid #1E3A5F", borderRadius: 20, padding: "36px" }}>
          <div style={{ display: "grid", gap: 18 }}>
            {GOAL_FIELDS.map(f => (
              <div key={f.key}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: "#475569", marginBottom: 7 }}>{f.label.toUpperCase()}</label>
                {f.multiline ? (
                  <textarea value={goalDraft[f.key] ?? ""} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} rows={3}
                    style={{ width: "100%", background: "#060C1A", border: "1px solid #1E3A5F", borderRadius: 8, padding: "11px 14px", color: "#E2E8F0", fontSize: 14, fontFamily: "'DM Sans', system-ui", resize: "vertical", outline: "none", lineHeight: 1.6, boxSizing: "border-box" }} />
                ) : (
                  <input type={f.numeric ? "number" : "text"} value={goalDraft[f.key] ?? ""} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} min="0"
                    style={{ width: "100%", background: "#060C1A", border: "1px solid #1E3A5F", borderRadius: 8, padding: "11px 14px", color: "#E2E8F0", fontSize: 14, fontFamily: f.numeric ? "'DM Mono', monospace" : "'DM Sans', system-ui", outline: "none", boxSizing: "border-box" }} />
                )}
              </div>
            ))}
          </div>
          <button onClick={saveGoals} disabled={saving || !goalDraft.mois} style={{
            width: "100%", marginTop: 28, padding: "15px",
            background: goalDraft.mois ? "linear-gradient(135deg, #1D4ED8, #3B82F6)" : "#1E293B",
            border: "none", borderRadius: 10, cursor: !goalDraft.mois ? "not-allowed" : "pointer",
            fontSize: 16, fontWeight: 700, color: goalDraft.mois ? "white" : "#475569", fontFamily: "'DM Sans', system-ui",
          }}>{saving ? "Sauvegarde..." : existingGoals ? "Mettre à jour →" : "Commencer le suivi →"}</button>
        </div>
      </div>
    </div>
  );
}
