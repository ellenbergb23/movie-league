import { useState, useEffect } from "react";
import { THEMES, FONT_SANS, FONT_SERIF } from "../lib/constants";
import { dbGetUserLeagues } from "../lib/db";
import { leaguePath } from "../lib/router";

export default function YourLeagues({ authUser, darkMode, toggleDark, onShowAuthModal, onShowCreateLeagueModal, signOut, navigate }) {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);

  const t = darkMode ? THEMES.dark : THEMES.light;

  useEffect(() => {
    if (!authUser) { setLeagues([]); setLoading(false); return; }
    setLoading(true);
    dbGetUserLeagues(authUser.id).then(rows => { setLeagues(rows); setLoading(false); });
  }, [authUser]);

  const btn = { background: "none", border: `0.5px solid ${t.border}`, borderRadius: 6, padding: "5px 10px", fontSize: 12, color: t.textMuted, cursor: "pointer" };
  const goldBtn = { padding: "10px 20px", fontSize: 13, fontWeight: 600, color: "#fff", background: t.gold, border: "none", borderRadius: 8, cursor: "pointer" };

  return (
    <div style={{ fontFamily: FONT_SANS, minHeight: "100vh", background: t.bg, color: t.text }}>
      <header style={{ background: t.header, borderBottom: `0.5px solid ${t.border}`, padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", border: `0.5px solid ${t.gold}`, borderRadius: 4, fontFamily: FONT_SERIF, fontSize: 13, fontWeight: 600, color: t.gold, flexShrink: 0 }}>FFL</span>
          <div>
            <div style={{ fontFamily: FONT_SERIF, fontSize: 19, fontWeight: 500, color: t.text, lineHeight: 1.2 }}>Your Leagues</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.1em", textTransform: "uppercase" }}>Fantasy Film League</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={onShowCreateLeagueModal} style={btn}>+ New League</button>
          {authUser ? (
            <button onClick={signOut} style={btn}>Sign out</button>
          ) : (
            <button onClick={onShowAuthModal} style={{ ...btn, color: t.textSub }}>Log in</button>
          )}
          <button
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            style={{ position: "relative", width: 40, height: 22, borderRadius: 11, border: `0.5px solid ${t.border}`, background: t.surface2, cursor: "pointer", flexShrink: 0, padding: 0 }}
          >
            <span style={{ position: "absolute", left: 4, top: "50%", transform: "translateY(-50%)", fontSize: 9, lineHeight: 1 }}>☀</span>
            <span style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", fontSize: 9, lineHeight: 1 }}>☾</span>
            <span style={{ position: "absolute", top: 2, left: darkMode ? 20 : 2, width: 16, height: 16, borderRadius: "50%", background: t.gold, transition: "left 0.15s" }} />
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        {!authUser ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
            <p style={{ fontSize: 14, color: t.textMuted, marginBottom: 20 }}>Sign in to see the leagues you're part of, or create a new one to get started.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={onShowAuthModal} style={goldBtn}>Log in</button>
              <button onClick={onShowCreateLeagueModal} style={{ ...goldBtn, background: "none", border: `0.5px solid ${t.border}`, color: t.text }}>Create a league</button>
            </div>
          </div>
        ) : loading ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem", color: t.textMuted, fontSize: 14 }}>Loading your leagues…</div>
        ) : leagues.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
            <p style={{ fontSize: 14, color: t.textMuted, marginBottom: 20 }}>You're not part of any leagues yet.</p>
            <button onClick={onShowCreateLeagueModal} style={goldBtn}>Create a league</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {leagues.map(league => (
              <button
                key={league.id}
                onClick={() => navigate(leaguePath(league.id))}
                style={{ textAlign: "left", padding: "16px 18px", background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <div>
                  <div style={{ fontFamily: FONT_SERIF, fontSize: 16, fontWeight: 500, color: t.text }}>{league.name}</div>
                  <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>
                    {league.year || "2026"} · {league.team_count} team{league.team_count === 1 ? "" : "s"}
                    {league.playerName ? ` · ${league.playerName}` : ""}
                  </div>
                </div>
                {league.role === "commissioner" && (
                  <span style={{ fontSize: 10, color: t.gold, border: `0.5px solid ${t.gold}`, borderRadius: 10, padding: "1px 7px", flexShrink: 0 }}>Commissioner</span>
                )}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
