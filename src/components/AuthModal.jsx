import { useState } from "react";
import { supabase, LEAGUE_ID } from "../lib/supabase";

export function AuthModal({ t, onAuth, onClose }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(""); setLoading(true);
    if (mode === "login") {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) { setError(err.message); setLoading(false); return; }
      onAuth(data.user);
    } else {
      const { data, error: err } = await supabase.auth.signUp({ email, password });
      if (err) { setError(err.message); setLoading(false); return; }
      if (data.user) {
        await supabase.from("league_members").upsert({ user_id: data.user.id, league_id: LEAGUE_ID, player_name: null, role: "player" }, { onConflict: "user_id,league_id" });
        onAuth(data.user);
      }
    }
    setLoading(false);
  }

  const inp = { width: "100%", fontSize: 14, padding: "10px 12px", borderRadius: 8, border: `0.5px solid ${t.border}`, background: t.surface2, color: t.text, marginBottom: 12 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div style={{ width: 360, background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 16, padding: 32 }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 4 }}>Sign in to edit</h2>
          <p style={{ fontSize: 13, color: t.textMuted }}>Fantasy Film League · 2026</p>
        </div>
        <div style={{ display: "flex", marginBottom: 20, background: t.surface2, borderRadius: 8, padding: 3 }}>
          {["login","signup"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); }} style={{ flex: 1, padding: "7px 0", fontSize: 13, fontWeight: mode === m ? 600 : 400, color: mode === m ? t.text : t.textMuted, background: mode === m ? t.surface : "transparent", border: "none", borderRadius: 6, cursor: "pointer" }}>
              {m === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inp} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} style={{ ...inp, marginBottom: error ? 8 : 16 }} />
        {error && <p style={{ fontSize: 12, color: t.red, marginBottom: 12 }}>{error}</p>}
        <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", padding: "11px 0", fontSize: 14, fontWeight: 600, color: "#fff", background: t.gold, border: "none", borderRadius: 8, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "…" : mode === "login" ? "Log in" : "Create account"}
        </button>
        {mode === "signup" && <p style={{ fontSize: 12, color: t.textMuted, textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>After signing up, the commissioner will assign you to your team.</p>}
      </div>
    </div>
  );
}
