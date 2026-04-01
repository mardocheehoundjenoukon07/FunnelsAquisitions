export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { prompt } = req.body;
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );
    const data = await r.json();
    console.log("Gemini response:", JSON.stringify(data));
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Erreur d'analyse.";
    res.json({ content: [{ text }] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ content: [{ text: "Erreur serveur: " + err.message }] });
  }
}
