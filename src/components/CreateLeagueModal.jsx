import { useState } from "react";
import { dbCreateLeague } from "../lib/db";

export function CreateLeagueModal({ t, authUser, onClose, showToast }) {
  const [name, setName] = useState("");
  const [teamCount, setTeamCount] = useState(10);
  const [filmsPerTeam, setFilmsPerTeam] = useState(9);
  const [visibility, setVisibility] = useState("private");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null); // { id, joinCode } | null

  async function handleCreate() {
    setError("");
    if (!name.trim()) { setError("League name is required."); return; }
    if (teamCount < 1 || teamCount > 10) { setError("Teams must be between 1 and 10."); return; }
    if (filmsPerTeam < 1) { setError("Films per team must be at least 1."); return; }
    setLoading(true);
    try {
      const created = await dbCreateLeague(authUser.id, { name: name.trim(), teamCount, filmsPerTeam, visibility });
      setResult(created);
      showToast?.("League created");
    } catch (e) {
      setError(e.message || "Something went wrong creating the league.");
    }
    setLoading(false);
  }

  const inp = { width: "100%", fontSize: 14, padding: "10px 12px", borderRadius: 8, border: `0.5px solid ${t.border}`, background: t.surface2, color: t.text, marginBottom: 12, boxSizing: "border-box" };
  const label = { fontSize: 12, fontWeight: 600, color: t.textMuted, marginBottom: 6, display: "block" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div style={{ width: 380, background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 16, padding: 32 }} onClick={e => e.stopPropagation()}>
        {!result ? (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 20 }}>Create a league</h2>

            <label style={label}>League name</label>
            <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. The 2027 Film League" />

            <label style={label}>Number of teams (max 10)</label>
            <input type="number" min={1} max={10} style={inp} value={teamCount} onChange={e => setTeamCount(parseInt(e.target.value, 10) || 0)} />

            <label style={label}>Films per team</label>
            <input type="number" min={1} style={inp} value={filmsPerTeam} onChange={e => setFilmsPerTeam(parseInt(e.target.value, 10) || 0)} />

            <label style={label}>Visibility</label>
            <div style={{ display: "flex", marginBottom: 20, background: t.surface2, borderRadius: 8, padding: 3 }}>
              {["private", "public"].map(v => (
                <button key={v} onClick={() => setVisibility(v)} style={{ flex: 1, padding: "7px 0", fontSize: 13, fontWeight: visibility === v ? 600 : 400, color: visibility === v ? t.text : t.textMuted, background: visibility === v ? t.surface : "transparent", border: "none", borderRadius: 6, cursor: "pointer", textTransform: "capitalize" }}>
                  {v}
                </button>
              ))}
            </div>

            {error && <p style={{ fontSize: 12, color: t.red, marginBottom: 12 }}>{error}</p>}

            <button onClick={handleCreate} disabled={loading} style={{ width: "100%", padding: "11px 0", fontSize: 14, fontWeight: 600, color: "#fff", background: t.gold, border: "none", borderRadius: 8, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Creating…" : "Create league"}
            </button>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 8 }}>League created 🎬</h2>
            <p style={{ fontSize: 13, color: t.textMuted, marginBottom: 20 }}>
              Share this join code with your players. (Joining isn't wired up in the app yet — this step is just confirming league creation works.)
            </p>
            <div style={{ textAlign: "center", padding: "16px 0", background: t.surface2, borderRadius: 8, marginBottom: 20 }}>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "0.15em", color: t.gold, fontFamily: "monospace" }}>{result.joinCode}</div>
            </div>
            <button onClick={onClose} style={{ width: "100%", padding: "11px 0", fontSize: 14, fontWeight: 600, color: "#fff", background: t.gold, border: "none", borderRadius: 8, cursor: "pointer" }}>
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}
