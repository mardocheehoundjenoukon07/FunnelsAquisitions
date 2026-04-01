export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const key = process.env.GROQ_API_KEY;
  if (!key) return res.json({ content: [{ text: "❌ Clé GROQ_API_KEY manquante dans Vercel" }] });

  const { prompt } = req.body;

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000
      })
    });
    const data = await r.json();
    if (data.error) return res.json({ content: [{ text: "❌ " + data.error.message }] });
    const text = data.choices?.[0]?.message?.content || "Réponse vide.";
    res.json({ content: [{ text }] });
  } catch (err) {
    res.json({ content: [{ text: "❌ Erreur: " + err.message }] });
  }
}
