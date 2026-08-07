import { useState } from "react";
import { supabase } from "../lib/supabase";
import { dbPreviewLeagueByCode, dbJoinLeague } from "../lib/db";
import { TEAM_COLORS } from "../lib/constants";
import { leaguePath } from "../lib/router";

// Step 2c join flow: enter a code -> preview the league + pick an open slot
// and color -> (sign up if needed) -> claim the slot. Mirrors
// CreateLeagueModal's step shape (preview/result split, inline signup) so
// the two modals feel consistent.
export function JoinLeagueModal({ t, authUser, onAuth, onClose, showToast, navigate }) {
  const [code, setCode] = useState("");
  const [preview, setPreview] = useState(null); // { id, name, teamCount, filmsPerTeam, openSlots, takenColors }
  const [slotName, setSlotName] = useState("");
  const [teamColor, setTeamColor] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLookup() {
    setError("");
    if (!code.trim()) { setError("Enter a join code."); return; }
    setLoading(true);
    try {
      const result = await dbPreviewLeagueByCode(code.trim());
      setPreview(result);
      setSlotName(result.openSlots[0] || "");
    } catch (e) {
      setError(e.message?.includes("Invalid join code") ? "That code doesn't match a league." : (e.message || "Couldn't look up that code."));
    }
    setLoading(false);
  }

  async function refreshPreview() {
    try {
      const result = await dbPreviewLeagueByCode(code.trim());
      setPreview(result);
      if (!result.openSlots.includes(slotName)) setSlotName(result.openSlots[0] || "");
      if (result.takenColors.includes(teamColor)) setTeamColor("");
    } catch {
      // if the refresh itself fails, leave the stale preview in place — the
      // next submit attempt will surface the real error
    }
  }

  async function handleJoin() {
    setError("");
    if (!slotName) { setError("Pick a team slot."); return; }
    if (!teamColor) { setError("Pick a team color."); return; }
    if (!playerName.trim()) { setError("Enter your name."); return; }
    if (!authUser && (!email.trim() || !password)) { setError("Enter an email and password to create your account."); return; }

    setLoading(true);
    try {
      if (!authUser) {
        const { data, error: signUpErr } = await supabase.auth.signUp({ email: email.trim(), password });
        if (signUpErr) { setError(signUpErr.message); setLoading(false); return; }
        onAuth?.(data.user);
      }
      const joined = await dbJoinLeague({ joinCode: code.trim(), slotName, playerName: playerName.trim(), teamColor });
      showToast?.("Joined league");
      onClose();
      navigate?.(leaguePath(joined.id));
    } catch (e) {
      const msg = e.message || "Something went wrong joining the league.";
      setError(msg);
      // slot/color races are the two conditions the RPC can raise after the
      // preview was already fetched — refresh so the picker reflects reality
      if (msg.includes("just taken")) refreshPreview();
    }
    setLoading(false);
  }

  const inp = { width: "100%", fontSize: 14, padding: "10px 12px", borderRadius: 8, border: `0.5px solid ${t.border}`, background: t.surface2, color: t.text, marginBottom: 12, boxSizing: "border-box" };
  const label = { fontSize: 12, fontWeight: 600, color: t.textMuted, marginBottom: 6, display: "block" };
  const goldBtn = { width: "100%", padding: "11px 0", fontSize: 14, fontWeight: 600, color: "#fff", background: t.gold, border: "none", borderRadius: 8, cursor: "pointer" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div style={{ width: 380, maxHeight: "85vh", overflowY: "auto", background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 16, padding: 32 }} onClick={e => e.stopPropagation()}>
        {!preview ? (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 20 }}>Join a league</h2>
            <label style={label}>Join code</label>
            <input
              style={{ ...inp, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "monospace" }}
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLookup()}
              placeholder="e.g. K7X2QP"
              maxLength={12}
            />
            {error && <p style={{ fontSize: 12, color: t.red, marginBottom: 12 }}>{error}</p>}
            <button onClick={handleLookup} disabled={loading} style={{ ...goldBtn, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Looking up…" : "Find league"}
            </button>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 4 }}>{preview.name}</h2>
            <p style={{ fontSize: 12, color: t.textMuted, marginBottom: 20 }}>{preview.teamCount} teams · {preview.filmsPerTeam} films per team</p>

            {preview.openSlots.length === 0 ? (
              <p style={{ fontSize: 13, color: t.textMuted, marginBottom: 8 }}>This league is full — every team slot has been claimed.</p>
            ) : (
              <>
                <label style={label}>Pick a team slot</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                  {preview.openSlots.map(slot => (
                    <button
                      key={slot}
                      onClick={() => setSlotName(slot)}
                      style={{ padding: "6px 12px", fontSize: 13, fontWeight: slotName === slot ? 600 : 400, color: slotName === slot ? "#fff" : t.text, background: slotName === slot ? t.gold : t.surface2, border: `0.5px solid ${slotName === slot ? t.gold : t.border}`, borderRadius: 6, cursor: "pointer" }}
                    >
                      {slot}
                    </button>
                  ))}
                </div>

                <label style={label}>Team color</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                  {TEAM_COLORS.map(c => {
                    const taken = preview.takenColors.includes(c.hex);
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
                          cursor: taken ? "not-allowed" : "pointer", opacity: taken ? 0.25 : 1, position: "relative", padding: 0,
                        }}
                      />
                    );
                  })}
                </div>

                <label style={label}>Your name</label>
                <input style={inp} value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="e.g. Jordan" />

                {!authUser && (
                  <>
                    <label style={label}>Your email</label>
                    <input type="email" style={inp} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                    <label style={label}>Choose a password</label>
                    <input type="password" style={inp} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
                    <p style={{ fontSize: 11, color: t.textMuted, marginTop: -6, marginBottom: 16 }}>This creates your account and joins you to this league.</p>
                  </>
                )}

                {error && <p style={{ fontSize: 12, color: t.red, marginBottom: 12 }}>{error}</p>}

                <button onClick={handleJoin} disabled={loading} style={{ ...goldBtn, opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Joining…" : "Join league"}
                </button>
              </>
            )}

            <button onClick={() => { setPreview(null); setError(""); }} style={{ width: "100%", marginTop: 10, padding: "8px 0", fontSize: 12, color: t.textMuted, background: "none", border: "none", cursor: "pointer" }}>
              ← Try a different code
            </button>
          </>
        )}
      </div>
    </div>
  );
}
