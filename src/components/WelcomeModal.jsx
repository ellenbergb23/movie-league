import { useState } from "react";
import { dbSetMyTeam } from "../lib/db";
import { TEAM_COLORS } from "../lib/constants";

// Shown the first time a seated member (commissioner or an assigned player)
// has no team_color set yet — covers commissioners from create_league
// (who are seated automatically, never prompted) and anyone assigned the
// old way via CommissionerSettings (which only ever set a name, never a
// color). Reappears on future visits until a color is actually saved —
// "Skip for now" just dismisses for this session rather than writing a
// permanent flag, so there's nothing new to migrate and no one gets stuck.
export function WelcomeModal({ t, leagueId, defaultName, takenColors, onSaved, onSkip }) {
  const [playerName, setPlayerName] = useState("");
  const [teamColor, setTeamColor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    if (!playerName.trim()) { setError("Enter your name."); return; }
    if (!teamColor) { setError("Pick a team color."); return; }
    setLoading(true);
    try {
      await dbSetMyTeam(leagueId, { playerName: playerName.trim(), teamColor });
      onSaved?.({ playerName: playerName.trim(), teamColor });
    } catch (e) {
      setError(e.message || "Something went wrong saving your team.");
    }
    setLoading(false);
  }

  const inp = { width: "100%", fontSize: 14, padding: "10px 12px", borderRadius: 8, border: `0.5px solid ${t.border}`, background: t.surface2, color: t.text, marginBottom: 16, boxSizing: "border-box" };
  const label = { fontSize: 12, fontWeight: 600, color: t.textMuted, marginBottom: 6, display: "block" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ width: 380, background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 16, padding: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 4 }}>Welcome to the league 🎬</h2>
        <p style={{ fontSize: 13, color: t.textMuted, marginBottom: 20 }}>Set your name and team color so everyone can tell your team apart.</p>

        <label style={label}>Your name</label>
        <input style={inp} value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder={defaultName ? `e.g. Jordan (was "${defaultName}")` : "e.g. Jordan"} />

        <label style={label}>Team color</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {TEAM_COLORS.map(c => {
            const taken = (takenColors || []).includes(c.hex);
            const selected = teamColor === c.hex;
            return (
              <button
                key={c.hex}
                onClick={() => !taken && setTeamColor(c.hex)}
                disabled={taken}
                aria-label={taken ? `${c.name} (taken)` : c.name}
                title={taken ? `${c.name} — already taken` : c.name}
                style={{
                  width: 28, height: 28, borderRadius: "50%", background: c.hex, border: selected ? `2px solid ${t.text}` : "2px solid transparent",
                  boxShadow: selected ? `0 0 0 2px ${t.surface}, 0 0 0 4px ${t.gold}` : "none",
                  cursor: taken ? "not-allowed" : "pointer", opacity: taken ? 0.25 : 1, padding: 0,
                }}
              />
            );
          })}
        </div>

        {error && <p style={{ fontSize: 12, color: t.red, marginBottom: 12 }}>{error}</p>}

        <button onClick={handleSave} disabled={loading} style={{ width: "100%", padding: "11px 0", fontSize: 14, fontWeight: 600, color: "#fff", background: t.gold, border: "none", borderRadius: 8, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "Saving…" : "Save"}
        </button>
        <button onClick={onSkip} style={{ width: "100%", marginTop: 10, padding: "8px 0", fontSize: 12, color: t.textMuted, background: "none", border: "none", cursor: "pointer" }}>
          Skip for now
        </button>
      </div>
    </div>
  );
}
