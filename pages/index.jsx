import { useState, useRef, useEffect } from "react";
import Head from "next/head";

const QUICK_ACTIONS = [
  { emoji: "📧", label: "Envoyer un message", prompt: "Comment envoyer un message à quelqu'un ?" },
  { emoji: "📸", label: "Voir mes photos", prompt: "Comment voir mes photos sur mon téléphone ?" },
  { emoji: "📞", label: "Passer un appel", prompt: "Comment appeler quelqu'un en vidéo ?" },
  { emoji: "🌐", label: "Chercher sur internet", prompt: "Comment chercher quelque chose sur internet ?" },
  { emoji: "🔋", label: "Problème de batterie", prompt: "Ma batterie se vide trop vite, que faire ?" },
  { emoji: "🔊", label: "Son trop bas", prompt: "Comment monter le son de mon téléphone ?" },
];

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "16px 20px" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          width: 10, height: 10, borderRadius: "50%", backgroundColor: "#C27D3A",
          animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex", justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 16, animation: "fadeSlideUp 0.3s ease-out",
    }}>
      {!isUser && (
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          background: "linear-gradient(135deg, #C27D3A, #E8A55C)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, flexShrink: 0, marginRight: 12, marginTop: 2,
          boxShadow: "0 2px 8px rgba(194,125,58,0.3)",
        }}>🧵</div>
      )}
      <div style={{
        maxWidth: "75%", padding: "14px 20px",
        borderRadius: isUser ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
        background: isUser ? "linear-gradient(135deg, #2C4A3E, #3D6357)" : "#FFFBF5",
        color: isUser ? "#F5EDD8" : "#2C2416",
        fontSize: 18, lineHeight: 1.7,
        boxShadow: isUser ? "0 2px 12px rgba(44,74,62,0.25)" : "0 2px 12px rgba(0,0,0,0.08)",
        border: isUser ? "none" : "1px solid rgba(194,125,58,0.15)",
        fontFamily: "'Lora', Georgia, serif", whiteSpace: "pre-wrap",
      }}>
        {msg.content}
      </div>
    </div>
  );
}

export default function LeFil() {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Bonjour ! Je suis Fil, votre assistant numérique.\n\nJe suis là pour vous aider avec votre téléphone ou votre ordinateur.\n\nPas de souci si vous ne savez pas comment faire quelque chose. On va avancer ensemble, doucement.",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text) {
    const userText = text || input.trim();
    if (!userText || loading) return;

    setInput("");
    setShowQuick(false);
    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await response.json();
      setMessages([...newMessages, {
        role: "assistant",
        content: data.reply || "Je n'ai pas bien compris. Pouvez-vous répéter ?",
      }]);
    } catch {
      setMessages([...newMessages, {
        role: "assistant",
        content: "Désolé, je rencontre un petit problème de connexion. Pouvez-vous réessayer dans un moment ?",
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Fil — Votre assistant numérique</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-8px); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F5EDD8; }
        .send-btn:hover { transform: scale(1.05); box-shadow: 0 4px 16px rgba(194,125,58,0.45) !important; }
        .send-btn:active { transform: scale(0.97); }
        .quick-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(44,74,62,0.2) !important; }
        textarea:focus { outline: none; border-color: #C27D3A !important; box-shadow: 0 0 0 3px rgba(194,125,58,0.15) !important; }
        textarea::placeholder { color: #A8957A; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(194,125,58,0.3); border-radius: 3px; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #F5EDD8 0%, #EDE0C4 50%, #E5D4B0 100%)",
        display: "flex", flexDirection: "column", alignItems: "center",
        fontFamily: "'Lora', Georgia, serif",
      }}>
        {/* Header */}
        <div style={{ width: "100%", maxWidth: 680, padding: "24px 24px 0" }}>
          <div style={{
            background: "linear-gradient(135deg, #2C4A3E 0%, #3D6357 100%)",
            borderRadius: "24px 24px 0 0", padding: "22px 28px",
            display: "flex", alignItems: "center", gap: 16,
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "linear-gradient(135deg, #C27D3A, #E8A55C)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26, boxShadow: "0 3px 12px rgba(0,0,0,0.2)",
            }}>🧵</div>
            <div>
              <div style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 26, fontWeight: 700, color: "#F5EDD8", letterSpacing: "0.5px", lineHeight: 1.1,
              }}>Fil</div>
              <div style={{ fontSize: 14, color: "#A8C5BB", marginTop: 2, fontStyle: "italic" }}>
                Votre assistant numérique
              </div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: "#4CAF50", boxShadow: "0 0 8px rgba(76,175,80,0.6)",
              }} />
              <span style={{ fontSize: 13, color: "#A8C5BB" }}>En ligne</span>
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div style={{ width: "100%", maxWidth: 680, flex: 1, display: "flex", flexDirection: "column", padding: "0 24px" }}>
          <div style={{
            background: "rgba(255,251,245,0.7)", backdropFilter: "blur(10px)",
            flex: 1, minHeight: 340, maxHeight: 420, overflowY: "auto",
            padding: "24px 20px",
            borderLeft: "1px solid rgba(194,125,58,0.1)",
            borderRight: "1px solid rgba(194,125,58,0.1)",
          }}>
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}
            {loading && (
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: "linear-gradient(135deg, #C27D3A, #E8A55C)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, flexShrink: 0, marginRight: 12,
                }}>🧵</div>
                <div style={{
                  background: "#FFFBF5", borderRadius: "20px 20px 20px 4px",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                  border: "1px solid rgba(194,125,58,0.15)",
                }}>
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick actions */}
          {showQuick && (
            <div style={{
              background: "rgba(255,251,245,0.85)", padding: "16px 20px",
              borderLeft: "1px solid rgba(194,125,58,0.1)",
              borderRight: "1px solid rgba(194,125,58,0.1)",
            }}>
              <div style={{ fontSize: 13, color: "#A8957A", marginBottom: 12, fontStyle: "italic", textAlign: "center" }}>
                Ou choisissez une question fréquente :
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {QUICK_ACTIONS.map((action, i) => (
                  <button key={i} className="quick-btn" onClick={() => sendMessage(action.prompt)} style={{
                    background: "white", border: "1.5px solid rgba(194,125,58,0.2)",
                    borderRadius: 14, padding: "12px 8px", cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    transition: "all 0.2s ease", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}>
                    <span style={{ fontSize: 24 }}>{action.emoji}</span>
                    <span style={{
                      fontSize: 12, color: "#2C4A3E", fontFamily: "'Lora', Georgia, serif",
                      fontWeight: 600, textAlign: "center", lineHeight: 1.3,
                    }}>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div style={{
            background: "#FFFBF5", borderRadius: "0 0 24px 24px",
            padding: "16px 20px 20px",
            borderLeft: "1px solid rgba(194,125,58,0.1)",
            borderRight: "1px solid rgba(194,125,58,0.1)",
            borderBottom: "1px solid rgba(194,125,58,0.1)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
          }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Écrivez votre question ici..."
                rows={2}
                style={{
                  flex: 1, resize: "none", border: "2px solid rgba(194,125,58,0.2)",
                  borderRadius: 16, padding: "14px 18px", fontSize: 18,
                  fontFamily: "'Lora', Georgia, serif", color: "#2C2416",
                  background: "#FDFAF4", lineHeight: 1.5, transition: "all 0.2s ease",
                }}
              />
              <button className="send-btn" onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{
                width: 54, height: 54, borderRadius: "50%",
                background: loading || !input.trim() ? "#D4C5A9" : "linear-gradient(135deg, #C27D3A, #E8A55C)",
                border: "none", cursor: loading || !input.trim() ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, transition: "all 0.2s ease",
                boxShadow: loading || !input.trim() ? "none" : "0 4px 14px rgba(194,125,58,0.35)",
                flexShrink: 0,
              }}>➤</button>
            </div>
            <div style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: "#C5B49A", fontStyle: "italic" }}>
              Appuyez sur Entrée pour envoyer · Pas de question trop simple
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px 24px", display: "flex", gap: 16, justifyContent: "center" }}>
          <button onClick={() => setShowQuick(v => !v)} style={{
            background: "rgba(255,255,255,0.5)", border: "1.5px solid rgba(194,125,58,0.25)",
            borderRadius: 12, padding: "10px 18px", fontSize: 14, color: "#2C4A3E",
            cursor: "pointer", fontFamily: "'Lora', Georgia, serif", transition: "all 0.2s",
          }}>
            {showQuick ? "Masquer les suggestions" : "Voir les suggestions"}
          </button>
          <button onClick={() => { setMessages([{ role: "assistant", content: "Bonjour ! Je suis Fil, votre assistant numérique.\n\nJe suis là pour vous aider avec votre téléphone ou votre ordinateur.\n\nPas de souci si vous ne savez pas comment faire quelque chose. On va avancer ensemble, doucement." }]); setShowQuick(true); }} style={{
            background: "rgba(255,255,255,0.5)", border: "1.5px solid rgba(194,125,58,0.25)",
            borderRadius: 12, padding: "10px 18px", fontSize: 14, color: "#7A5C3A",
            cursor: "pointer", fontFamily: "'Lora', Georgia, serif", transition: "all 0.2s",
          }}>↺ Recommencer</button>
        </div>
      </div>
    </>
  );
}
