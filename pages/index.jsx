import { useState, useEffect } from "react";

const METRICS = [
  { key: "budget_pub", label: "Budget pub", unit: "€", icon: "◈", color: "#E4A853", goal_key: "budget_pub_jour", desc: "Dépense publicitaire" },
  { key: "rdv", label: "Rendez-vous", unit: "RDV", icon: "◉", color: "#5DCAA5", goal_key: "rdv_jour", desc: "Rendez-vous reçus" },
  { key: "appels", label: "Appels", unit: "appels", icon: "◎", color: "#85B7EB", goal_key: "appels_jour", desc: "Appels reçus" },
  { key: "conversations", label: "Conversations", unit: "conv.", icon: "◐", color: "#AFA9EC", goal_key: "conversations_jour", desc: "Conversations engagées" },
  { key: "dms", label: "DMs envoyés", unit: "DMs", icon: "◑", color: "#F0997B", goal_key: "dms_jour", desc: "Personnes DM par jour" },
  { key: "posts_facebook", label: "Posts Facebook", unit: "posts", icon: "▣", color: "#378ADD", goal_key: "posts_facebook_jour", desc: "Publications Facebook" },
  { key: "posts_tiktok", label: "Posts TikTok", unit: "posts", icon: "▤", color: "#E24B4A", goal_key: "posts_tiktok_jour", desc: "Publications TikTok" },
  { key: "posts_linkedin", label: "Posts LinkedIn", unit: "posts", icon: "▥", color: "#1D9E75", goal_key: "posts_linkedin_jour", desc: "Publications LinkedIn" },
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
  { key: "strategie", label: "Stratégie du mois", placeholder: "ex: Focus sur l'acquisition via DMs Instagram + pub Facebook...", multiline: true },
];

const TODAY = new Date().toISOString().split("T")[0];

function getMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ── Stockage localStorage ──────────────────────────────────────────────────
function storageGet(key) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

function storageSet(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

// ── Composant principal ────────────────────────────────────────────────────
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
    setGoals(g);
    setEntries(allEntries);
    if (todayEntry) { setTodayDraft(todayEntry); setTodaySaved(true); }
    setView(g ? "dashboard" : "goals");
  }, []);

  const saveGoals = () => {
    setSaving(true);
    storageSet(`goals:${getMonthKey()}`, goalDraft);
    setGoals(goalDraft);
    setSaving(false);
    setView("dashboard");
  };

  const saveTodayEntry = () => {
    setSaving(true);
    const entry = { ...todayDraft, date: TODAY };
    storageSet(`entry:${TODAY}`, entry);
    const allEntries = storageGet("entries:all") || [];
    const idx = allEntries.findIndex(e => e.date === TODAY);
    if (idx >= 0) allEntries[idx] = entry; else allEntries.push(entry);
    allEntries.sort((a, b) => a.date.localeCompare(b.date));
    storageSet("entries:all", allEntries);
    setEntries(allEntries);
    setTodaySaved(true);
    setSaving(false);
    setSaveMsg("Données sauvegardées ✓");
    setTimeout(() => setSaveMsg(""), 3000);
  };

  // ── Analyse IA via proxy /api/analyze ──────────────────────────────────
  const runAiAnalysis = async () => {
    if (!goals || entries.length === 0) return;
    setAiLoading(true);
    setAiAnalysis("");
    const recent = entries.slice(-14);
    const prompt = `Tu es un coach marketing et business. Analyse les performances de ce professionnel et donne des recommandations concrètes et actionnables.

OBJECTIFS DU MOIS (${goals.mois || getMonthKey()}):
- CA visé: ${goals.objectif_ca}€
- Nouveaux clients: ${goals.objectif_clients}
- Stratégie: ${goals.strategie || "Non précisée"}
- Budget pub/jour: ${goals.budget_pub_jour}€
- Rendez-vous/jour: ${goals.rdv_jour}
- Appels/jour: ${goals.appels_jour}
- Conversations/jour: ${goals.conversations_jour}
- DMs/jour: ${goals.dms_jour}
- Posts FB/jour: ${goals.posts_facebook_jour}
- Posts TikTok/jour: ${goals.posts_tiktok_jour}
- Posts LinkedIn/jour: ${goals.posts_linkedin_jour}

DONNÉES DES ${recent.length} DERNIERS JOURS:
${recent.map(e => `${e.date}: budget_pub=${e.budget_pub||0}€, rdv=${e.rdv||0}, appels=${e.appels||0}, conv=${e.conversations||0}, dms=${e.dms||0}, fb=${e.posts_facebook||0}, tt=${e.posts_tiktok||0}, li=${e.posts_linkedin||0}`).join("\n")}

Analyse:
1. Ce qui fonctionne bien (points positifs)
2. Ce qui doit être amélioré en priorité (2-3 points max)
3. Actions concrètes pour les 3 prochains jours
4. Un focus clé pour cette semaine

Sois direct, concis et pratique. Parle en français.`;

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      const text = data.content?.map(c => c.text || "").join("") || "Erreur d'analyse.";
      setAiAnalysis(text);
    } catch {
      setAiAnalysis("Impossible de contacter l'IA. Vérifie ta clé API dans Vercel.");
    }
    setAiLoading(false);
  };

  const calcAvg = (key) => {
    if (entries.length === 0) return 0;
    const sum = entries.reduce((acc, e) => acc + (parseFloat(e[key]) || 0), 0);
    return (sum / entries.length).toFixed(1);
  };

  const calcPct = (key, goalKey) => {
    if (!goals || !goals[goalKey]) return null;
    const avg = parseFloat(calcAvg(key));
    return Math.round((avg / parseFloat(goals[goalKey])) * 100);
  };

  const lastDays = (n) => entries.slice(-n);

  if (view === "loading") return (
    <div style={{ padding: "3rem", textAlign: "center", color: "#888", fontFamily: "monospace" }}>
      Chargement...
    </div>
  );

  if (view === "goals") return (
    <GoalSetup goalDraft={goalDraft} setGoalDraft={setGoalDraft} saveGoals={saveGoals} saving={saving} existingGoals={goals} />
  );

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 900, margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>
      <Header goals={goals} entries={entries} />
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} todaySaved={todaySaved} />
      {activeTab === "overview" && <Overview metrics={METRICS} goals={goals} calcAvg={calcAvg} calcPct={calcPct} entries={entries} lastDays={lastDays} />}
      {activeTab === "entry"    && <DailyEntry todayDraft={todayDraft} setTodayDraft={setTodayDraft} saveTodayEntry={saveTodayEntry} saving={saving} saveMsg={saveMsg} todaySaved={todaySaved} />}
      {activeTab === "trends"   && <TrendsView entries={entries} metrics={METRICS} />}
      {activeTab === "ai"       && <AiView aiAnalysis={aiAnalysis} aiLoading={aiLoading} runAiAnalysis={runAiAnalysis} entries={entries} goals={goals} />}
      {activeTab === "goals"    && <GoalView goals={goals} setGoalDraft={setGoalDraft} setViewOuter={setView} />}
    </div>
  );
}

// ── Header ─────────────────────────────────────────────────────────────────
function Header({ goals, entries }) {
  const d = new Date();
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const monthProgress = Math.round((d.getDate() / daysInMonth) * 100);
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, color: "#999", textTransform: "uppercase", marginBottom: 4 }}>FunnelsAcquisitions</div>
          <h1 style={{ fontSize: 26, fontWeight: 600, margin: "0 0 2px", letterSpacing: -0.5 }}>{goals?.mois || "Tableau de bord"}</h1>
          <div style={{ fontSize: 13, color: "#666" }}>{entries.length} jour{entries.length > 1 ? "s" : ""} enregistré{entries.length > 1 ? "s" : ""} · {monthProgress}% du mois écoulé</div>
        </div>
        {goals?.objectif_ca && (
          <div style={{ background: "#f5f5f5", borderRadius: 8, padding: "8px 14px", textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#999" }}>Objectif CA</div>
            <div style={{ fontSize: 20, fontWeight: 600, fontFamily: "monospace" }}>{parseInt(goals.objectif_ca).toLocaleString()}€</div>
          </div>
        )}
      </div>
      <div style={{ marginTop: 12, height: 3, background: "#eee", borderRadius: 2 }}>
        <div style={{ height: "100%", width: `${Math.min(100, (entries.length / 30) * 100)}%`, background: "#5DCAA5", borderRadius: 2 }} />
      </div>
    </div>
  );
}

// ── TabBar ──────────────────────────────────────────────────────────────────
function TabBar({ activeTab, setActiveTab, todaySaved }) {
  const tabs = [
    { id: "overview", label: "Vue d'ensemble" },
    { id: "entry",    label: todaySaved ? "Saisie ✓" : "Saisie du jour" },
    { id: "trends",   label: "Tendances" },
    { id: "ai",       label: "Analyse IA" },
    { id: "goals",    label: "Objectifs" },
  ];
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: "1.5rem", borderBottom: "1px solid #e5e5e5", flexWrap: "wrap" }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
          padding: "8px 14px", fontSize: 13, fontWeight: activeTab === t.id ? 600 : 400,
          background: "none", border: "none", cursor: "pointer",
          color: activeTab === t.id ? "#111" : "#666",
          borderBottom: activeTab === t.id ? "2px solid #111" : "2px solid transparent",
          marginBottom: -1,
        }}>{t.label}</button>
      ))}
    </div>
  );
}

// ── Overview ────────────────────────────────────────────────────────────────
function Overview({ metrics, goals, calcAvg, calcPct, entries, lastDays }) {
  const recent = lastDays(7);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: "1.5rem" }}>
        {metrics.map(m => {
          const avg = calcAvg(m.key);
          const pct = calcPct(m.key, m.goal_key);
          return (
            <div key={m.key} style={{ background: "#f9f9f9", borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: "#999" }}>{m.label}</span>
                <span style={{ fontSize: 16, color: m.color }}>{m.icon}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, fontFamily: "monospace" }}>{avg}</div>
              <div style={{ fontSize: 11, color: "#999", marginBottom: 6 }}>moy/jour</div>
              {pct !== null && (
                <div>
                  <div style={{ height: 3, background: "#e5e5e5", borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: pct >= 100 ? "#5DCAA5" : pct >= 70 ? m.color : "#E24B4A", borderRadius: 2 }} />
                  </div>
                  <div style={{ fontSize: 10, color: pct >= 100 ? "#5DCAA5" : pct >= 70 ? "#888" : "#E24B4A", marginTop: 3 }}>
                    {pct}% de l'objectif ({goals[m.goal_key]} visé)
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {recent.length > 0 && (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#666", marginBottom: 10 }}>7 derniers jours</h3>
          <div style={{ border: "1px solid #e5e5e5", borderRadius: 10, overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f5f5f5" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", color: "#999", fontWeight: 400 }}>Date</th>
                  {metrics.map(m => <th key={m.key} style={{ padding: "8px 8px", textAlign: "center", color: m.color, fontWeight: 400 }}>{m.icon}</th>)}
                </tr>
              </thead>
              <tbody>
                {recent.slice().reverse().map((entry, i) => (
                  <tr key={entry.date} style={{ borderTop: "1px solid #f0f0f0", background: i === 0 ? "#f0faf6" : "white" }}>
                    <td style={{ padding: "8px 12px", color: "#666", fontFamily: "monospace", fontSize: 11 }}>
                      {entry.date === TODAY ? "Aujourd'hui" : entry.date.slice(5)}
                    </td>
                    {metrics.map(m => {
                      const val = parseFloat(entry[m.key]) || 0;
                      const goal = goals ? parseFloat(goals[m.goal_key]) || 0 : 0;
                      return (
                        <td key={m.key} style={{ padding: "8px 8px", textAlign: "center", fontFamily: "monospace", color: goal > 0 && val >= goal ? "#5DCAA5" : val > 0 ? "#111" : "#ccc" }}>
                          {val > 0 ? val : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Daily Entry ─────────────────────────────────────────────────────────────
function DailyEntry({ todayDraft, setTodayDraft, saveTodayEntry, saving, saveMsg, todaySaved }) {
  const set = (key, val) => setTodayDraft(prev => ({ ...prev, [key]: val }));
  const groups = [
    { title: "Acquisition payante", metrics: METRICS.slice(0, 1) },
    { title: "Acquisition directe (DM & appels)", metrics: METRICS.slice(2, 5) },
    { title: "Contenu & présence", metrics: METRICS.slice(5, 8) },
    { title: "Conversion", metrics: METRICS.slice(1, 2) },
  ];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: 8 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Saisie du {TODAY}</h2>
          <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>{todaySaved ? "✓ Sauvegardé" : "Non sauvegardé"}</div>
        </div>
        <button onClick={saveTodayEntry} disabled={saving} style={{ padding: "9px 20px", background: "#5DCAA5", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#fff" }}>
          {saving ? "Sauvegarde..." : saveMsg || "Sauvegarder"}
        </button>
      </div>

      {groups.map(g => (
        <div key={g.title} style={{ marginBottom: "1.25rem" }}>
          <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#aaa", marginBottom: 8 }}>{g.title}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            {g.metrics.map(m => (
              <div key={m.key} style={{ background: "white", border: "1px solid #e5e5e5", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 500 }}>{m.label}</label>
                  <span style={{ color: m.color }}>{m.icon}</span>
                </div>
                <input
                  type="number" min="0" step={m.key === "budget_pub" ? "0.01" : "1"}
                  value={todayDraft[m.key] ?? ""}
                  onChange={e => set(m.key, e.target.value)}
                  placeholder={`0 ${m.unit}`}
                  style={{ width: "100%", fontSize: 20, fontFamily: "monospace", fontWeight: 600, padding: "6px 0", background: "none", border: "none", borderBottom: "1px solid #e0e0e0", outline: "none", boxSizing: "border-box" }}
                />
                <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ marginTop: "1rem" }}>
        <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#aaa", marginBottom: 8 }}>Note du jour (optionnel)</div>
        <textarea
          value={todayDraft.note ?? ""} onChange={e => set("note", e.target.value)}
          placeholder="Ce qui s'est passé aujourd'hui, blocages, opportunités..."
          rows={3}
          style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e5e5", borderRadius: 8, fontSize: 13, resize: "vertical", boxSizing: "border-box", outline: "none" }}
        />
      </div>
    </div>
  );
}

// ── Trends ──────────────────────────────────────────────────────────────────
function TrendsView({ entries, metrics }) {
  const [selected, setSelected] = useState("rdv");
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    if (window.Chart) { setChartReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    s.onload = () => setChartReady(true);
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (!chartReady || entries.length === 0) return;
    const ctx = document.getElementById("trendsChart");
    if (!ctx) return;
    if (ctx._chart) ctx._chart.destroy();
    const metric = metrics.find(m => m.key === selected);
    const recent = entries.slice(-21);
    ctx._chart = new window.Chart(ctx, {
      type: "bar",
      data: {
        labels: recent.map(e => e.date.slice(5)),
        datasets: [{ label: metric.label, data: recent.map(e => parseFloat(e[selected]) || 0), backgroundColor: metric.color + "99", borderColor: metric.color, borderWidth: 1.5, borderRadius: 3 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { font: { size: 11 }, maxRotation: 45 } },
          y: { beginAtZero: true, ticks: { font: { size: 11 } } }
        }
      }
    });
  }, [chartReady, selected, entries]);

  if (entries.length === 0) return <div style={{ padding: "3rem", textAlign: "center", color: "#888" }}>Saisis quelques jours pour voir les tendances.</div>;

  const metric = metrics.find(m => m.key === selected);
  const vals = entries.map(e => parseFloat(e[selected]) || 0);
  const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  const max = Math.max(...vals);
  const l7 = vals.slice(-7).reduce((a, b) => a + b, 0) / Math.max(vals.slice(-7).length, 1);
  const p7 = vals.slice(-14, -7).reduce((a, b) => a + b, 0) / Math.max(vals.slice(-14, -7).length, 1);
  const trend = p7 === 0 ? null : ((l7 - p7) / p7 * 100).toFixed(0);

  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "1.25rem" }}>
        {metrics.map(m => (
          <button key={m.key} onClick={() => setSelected(m.key)} style={{
            padding: "6px 12px", fontSize: 12, borderRadius: 8,
            border: selected === m.key ? `2px solid ${m.color}` : "1px solid #e5e5e5",
            background: selected === m.key ? m.color + "22" : "white",
            color: selected === m.key ? m.color : "#666", cursor: "pointer", fontWeight: selected === m.key ? 600 : 400
          }}>{m.icon} {m.label}</button>
        ))}
      </div>
      <div style={{ position: "relative", width: "100%", height: 260 }}>
        <canvas id="trendsChart"></canvas>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: "1rem" }}>
        {[
          { label: "Moyenne totale", val: `${avg} ${metric.unit}` },
          { label: "Meilleur jour", val: `${max} ${metric.unit}` },
          { label: "Tendance 7j", val: trend === null ? "—" : (trend > 0 ? "+" : "") + trend + "%", positive: parseInt(trend) > 0 },
        ].map(s => (
          <div key={s.label} style={{ background: "#f9f9f9", borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ fontSize: 11, color: "#999" }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 600, fontFamily: "monospace", color: s.label === "Tendance 7j" && trend ? (parseInt(trend) > 0 ? "#5DCAA5" : "#E24B4A") : "#111" }}>{s.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AI Analysis ─────────────────────────────────────────────────────────────
function AiView({ aiAnalysis, aiLoading, runAiAnalysis, entries, goals }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Analyse IA</h2>
          <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
            {entries.length === 0 ? "Aucune donnée à analyser" : `Basée sur ${entries.length} jour${entries.length > 1 ? "s" : ""} de données`}
          </div>
        </div>
        <button onClick={runAiAnalysis} disabled={aiLoading || entries.length === 0 || !goals} style={{
          padding: "9px 20px", background: entries.length > 0 && goals ? "#111" : "#eee",
          border: "none", borderRadius: 8, cursor: entries.length > 0 && goals ? "pointer" : "not-allowed",
          fontSize: 13, fontWeight: 600, color: entries.length > 0 && goals ? "white" : "#999"
        }}>{aiLoading ? "Analyse en cours..." : "Lancer l'analyse →"}</button>
      </div>

      {!goals && <div style={{ padding: "1rem", background: "#fff8e1", borderRadius: 8, fontSize: 13, color: "#856404" }}>Configure tes objectifs du mois d'abord.</div>}
      {entries.length === 0 && goals && <div style={{ padding: "1rem", background: "#f5f5f5", borderRadius: 8, fontSize: 13, color: "#666" }}>Saisis au moins une journée de données.</div>}

      {aiLoading && (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <div style={{ width: 32, height: 32, border: "2px solid #eee", borderTopColor: "#111", borderRadius: "50%", margin: "0 auto 1rem", animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: 13, color: "#666" }}>Analyse de tes performances...</div>
        </div>
      )}

      {aiAnalysis && !aiLoading && (
        <div style={{ background: "white", border: "1px solid #e5e5e5", borderRadius: 10, padding: "1.25rem 1.5rem" }}>
          <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#aaa", marginBottom: "1rem" }}>Recommandations IA</div>
          <div style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{aiAnalysis}</div>
        </div>
      )}
    </div>
  );
}

// ── Goal View ───────────────────────────────────────────────────────────────
function GoalView({ goals, setGoalDraft, setViewOuter }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Objectifs du mois</h2>
        <button onClick={() => { setGoalDraft(goals || {}); setViewOuter("goals"); }} style={{ padding: "8px 16px", background: "none", border: "1px solid #ddd", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
          Modifier
        </button>
      </div>
      {goals ? (
        <div style={{ display: "grid", gap: 8 }}>
          {GOAL_FIELDS.map(f => goals[f.key] ? (
            <div key={f.key} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#f9f9f9", borderRadius: 8 }}>
              <span style={{ fontSize: 13, color: "#666" }}>{f.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, fontFamily: f.numeric ? "monospace" : "inherit", maxWidth: "55%", textAlign: "right" }}>{goals[f.key]}</span>
            </div>
          ) : null)}
        </div>
      ) : (
        <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
          Aucun objectif.{" "}
          <button onClick={() => { setGoalDraft({}); setViewOuter("goals"); }} style={{ background: "none", border: "none", color: "#5DCAA5", cursor: "pointer", fontWeight: 600 }}>
            Configurer
          </button>
        </div>
      )}
    </div>
  );
}

// ── Goal Setup ──────────────────────────────────────────────────────────────
function GoalSetup({ goalDraft, setGoalDraft, saveGoals, saving, existingGoals }) {
  const set = (key, val) => setGoalDraft(prev => ({ ...prev, [key]: val }));
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 620, margin: "0 auto", padding: "2rem 1rem 4rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#aaa", marginBottom: 8 }}>FunnelsAcquisitions</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px" }}>{existingGoals ? "Modifier les objectifs" : "Objectifs du mois"}</h1>
        <p style={{ fontSize: 14, color: "#666", margin: 0 }}>Définis tes cibles avant de commencer le suivi. L'IA s'en servira pour t'analyser.</p>
      </div>
      <div style={{ display: "grid", gap: 14 }}>
        {GOAL_FIELDS.map(f => (
          <div key={f.key}>
            <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 5 }}>{f.label}</label>
            {f.multiline ? (
              <textarea value={goalDraft[f.key] ?? ""} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} rows={3}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, resize: "vertical", boxSizing: "border-box", outline: "none" }} />
            ) : (
              <input type={f.numeric ? "number" : "text"} value={goalDraft[f.key] ?? ""} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} min="0"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, boxSizing: "border-box", outline: "none", fontFamily: f.numeric ? "monospace" : "inherit" }} />
            )}
          </div>
        ))}
      </div>
      <button onClick={saveGoals} disabled={saving || !goalDraft.mois} style={{
        width: "100%", marginTop: "1.5rem", padding: "13px",
        background: goalDraft.mois ? "#5DCAA5" : "#eee", border: "none", borderRadius: 8,
        cursor: goalDraft.mois ? "pointer" : "not-allowed",
        fontSize: 15, fontWeight: 700, color: goalDraft.mois ? "white" : "#aaa"
      }}>{saving ? "Sauvegarde..." : existingGoals ? "Mettre à jour" : "Commencer le suivi →"}</button>
    </div>
  );
}
