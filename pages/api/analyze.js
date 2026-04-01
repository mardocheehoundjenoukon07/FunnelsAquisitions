export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.json({ content: [{ text: "❌ Clé API manquante dans Vercel" }] });

  const { prompt } = req.body;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );
    const data = await r.json();

    if (data.error) {
      return res.json({ content: [{ text: "❌ Erreur Gemini: " + data.error.message }] });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Réponse vide.";
    res.json({ content: [{ text }] });

  } catch (err) {
    res.json({ content: [{ text: "❌ Erreur réseau: " + err.message }] });
  }
}
