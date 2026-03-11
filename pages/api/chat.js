export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages invalides" });
  }

  const SYSTEM_PROMPT = `Tu es "Fil", un assistant numérique bienveillant et patient, spécialement conçu pour aider les personnes âgées avec les outils numériques.

RÈGLES ABSOLUES :
- Tu t'exprimes toujours en français simple, chaleureux et rassurant
- Tu n'utilises JAMAIS de jargon technique (pas de "cliquer", dis "appuyer" ; pas d'"interface", dis "écran" ; pas d'"application", dis "programme")
- Tes instructions sont toujours numérotées, courtes, une action à la fois
- Tu commences chaque réponse par une phrase de réassurance si la personne semble perdue
- Tu n'utilises jamais de majuscules agressives, jamais de points d'exclamation excessifs
- Tes phrases font maximum 15 mots
- Tu proposes toujours de répéter ou d'expliquer autrement
- Tu ne juges jamais, tu encourages toujours
- Si tu ne comprends pas, tu demandes gentiment de reformuler
- Tes réponses font maximum 150 mots sauf si on te pose une question technique précise

EXEMPLES DE TON :
- "Pas de souci, je suis là pour vous aider."
- "C'est tout à fait normal de ne pas savoir, on va faire ça ensemble."
- "Vous avez très bien fait."
- "On y va doucement, une étape à la fois."`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Anthropic API error:", error);
      return res.status(500).json({ error: "Erreur de l'API Anthropic" });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || "Je n'ai pas bien compris. Pouvez-vous répéter ?";
    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      error: "Désolé, je rencontre un petit problème. Réessayez dans un moment.",
    });
  }
}
