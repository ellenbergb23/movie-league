import { useState, useEffect } from "react";
import { PLAYER_COLORS } from "../lib/constants";
import { calcFilmScore, getFilmOscarStatus, isFilmReleased } from "../lib/scoring";
import { searchTMDB } from "../lib/tmdb";
import { SL, Card, Poster } from "./ui";

export function DraftBoard({ draft, players, movies, canEdit, isCommissioner, marxistMode, updateDraftPick, requireAuth, scoring, goToFilmScoring, t, focusPlayer, addMovie }) {
  const sel = { width: "100%", fontSize: 11, padding: "4px 6px", borderRadius: 6, border: `0.5px solid ${t.border}`, background: t.selectBg, color: t.text, cursor: "pointer" };
  const [editingSlot, setEditingSlot] = useState(null); // `${player}-${roundIndex}` or null
  const [swapQuery, setSwapQuery] = useState("");
  const [tmdbSwapResults, setTmdbSwapResults] = useState([]);
  const [tmdbSwapLoading, setTmdbSwapLoading] = useState(false);

  async function handleSwapQueryChange(value) {
    setSwapQuery(value);
    if (!value.trim()) { setTmdbSwapResults([]); return; }
    setTmdbSwapLoading(true);
    const results = await searchTMDB(value);
    setTmdbSwapResults(results);
    setTmdbSwapLoading(false);
  }

  function selectNewFilm(title, poster_path, player, ri) {
    addMovie(title, poster_path); // safe no-op if it already exists
    updateDraftPick(player, ri, title);
    setEditingSlot(null);
    setSwapQuery("");
    setTmdbSwapResults([]);
  }
  useEffect(() => {
    if (focusPlayer) {
      const el = document.getElementById(`player-${focusPlayer.replace(/\s/g, "-")}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [focusPlayer]);
  return (
    <div>
      <SL t={t}>2026 draft board</SL>
      {players.map((player, pi) => {
        const color = PLAYER_COLORS[pi % PLAYER_COLORS.length];
        const picks = draft[player] || Array(9).fill("");
        const total = picks.reduce((s, f) => s + (f ? calcFilmScore(f, scoring) : 0), 0);
        const isFocused = focusPlayer === player;
        return (
          <Card key={player} t={t} style={{ marginBottom: 10, borderLeft: `3px solid ${color}`, outline: isFocused ? `2px solid ${t.gold}` : "none", outlineOffset: 2 }}>
            <div id={`player-${player.replace(/\s/g, "-")}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{player}</span>
              <span style={{ fontSize: 13, fontFamily: "monospace", color: t.gold, fontWeight: 600 }}>{total} pts</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8 }}>
              {picks.map((film, ri) => {
                const round = ["1","2","3","4","5","6","7","S1","S2"][ri];
                const score = film ? calcFilmScore(film, scoring) : null;
                const status = film ? getFilmOscarStatus(film, scoring) : {};
                const { nominated, winner } = status;
                const slotKey = `${player}-${ri}`;
                const isEditing = editingSlot === slotKey;
                return (
                  <div key={ri} style={{ position: "relative", display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ position: "relative", background: winner ? t.goldBg : t.surface2, border: winner ? `2px solid ${t.gold}` : nominated ? `1.5px solid ${t.gold}` : `0.5px solid ${t.border}`, borderRadius: 8, padding: "8px", minHeight: 145 }}>
                      {winner && <span style={{ position: "absolute", top: -1, right: 3, fontSize: 8, background: t.gold, color: "#fff", padding: "1px 4px", borderRadius: "0 0 3px 3px", fontWeight: 700 }}>BP ✦</span>}
                      {nominated && !winner && <span style={{ position: "absolute", top: -1, right: 3, fontSize: 8, background: t.goldBg, color: t.gold, padding: "1px 4px", borderRadius: "0 0 3px 3px", border: `0.5px solid ${t.gold}`, fontWeight: 600 }}>NOM</span>}
                      <div style={{ fontSize: 9, color: t.textMuted, marginBottom: 4, fontWeight: 600, letterSpacing: "0.06em" }}>RD {round}</div>
                      <div style={{ fontSize: 10, color: t.text, fontWeight: 600, marginBottom: 4, textAlign: "center", lineHeight: 1.2, height: 36, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {film || <span style={{ color: t.textMuted, fontWeight: 400 }}>TBD</span>}
                      </div>
                      {film ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
                          <Poster film={film} scoring={scoring} size="small" t={t} />
                          {score !== null && (
                            <div style={{ width: "100%", textAlign: "center" }}>
                              {isFilmReleased(film, scoring) ? (
                                <span style={{ fontSize: 10, fontFamily: "monospace", color: t.textSub, fontWeight: 600 }}>{score} {score === 1 ? "Point" : "Points"}</span>
                              ) : (
                                <span style={{ fontSize: 10, color: t.textMuted, fontStyle: "italic" }}>Unreleased</span>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ width: 60, height: 90, margin: "0 auto", background: t.surface, border: `1px dashed ${t.border}`, borderRadius: 4 }} />
                      )}
                    </div>
                    {canEdit && (isCommissioner || marxistMode) && (
                      isEditing ? (
                        <div style={{ position: "relative" }}>
                          <input
                            autoFocus
                            value={swapQuery}
                            onChange={e => handleSwapQueryChange(e.target.value)}
                            onBlur={() => setTimeout(() => { setEditingSlot(null); setSwapQuery(""); setTmdbSwapResults([]); }, 150)}
                            onKeyDown={e => { if (e.key === "Escape") { setEditingSlot(null); setSwapQuery(""); setTmdbSwapResults([]); } }}
                            placeholder="Search films…"
                            style={sel}
                          />
                          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 6, marginTop: 2, zIndex: 20, maxHeight: 260, overflowY: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                            {movies.filter(m => m.toLowerCase().includes(swapQuery.toLowerCase())).length > 0 && (
                              <div style={{ fontSize: 9, color: t.textMuted, fontWeight: 700, letterSpacing: "0.06em", padding: "5px 7px 2px", textTransform: "uppercase" }}>In your league</div>
                            )}
                            {movies.filter(m => m.toLowerCase().includes(swapQuery.toLowerCase())).slice(0, 5).map(m => (
                              <div key={m} onMouseDown={() => { updateDraftPick(player, ri, m); setEditingSlot(null); setSwapQuery(""); setTmdbSwapResults([]); }} style={{ display: "flex", gap: 6, alignItems: "center", padding: "5px 7px", cursor: "pointer", fontSize: 10, color: t.text, borderBottom: `0.5px solid ${t.border}` }} onMouseEnter={e => e.currentTarget.style.background = t.surface2} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                <Poster film={m} scoring={scoring} size="mini" t={t} />
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m}</span>
                              </div>
                            ))}
                            {swapQuery.trim() && (
                              <div style={{ fontSize: 9, color: t.textMuted, fontWeight: 700, letterSpacing: "0.06em", padding: "6px 7px 2px", textTransform: "uppercase", borderTop: `0.5px solid ${t.border}` }}>Search TMDB (add new film)</div>
                            )}
                            {tmdbSwapLoading && <div style={{ padding: "6px 7px", fontSize: 10, color: t.textMuted }}>Searching…</div>}
                            {!tmdbSwapLoading && swapQuery.trim() && tmdbSwapResults.map(r => {
                              const year = r.release_date ? r.release_date.slice(0, 4) : null;
                              return (
                                <div key={r.tmdbId} onMouseDown={() => selectNewFilm(r.title, r.poster_path, player, ri)} style={{ display: "flex", gap: 6, alignItems: "center", padding: "5px 7px", cursor: "pointer", fontSize: 10, color: t.text, borderBottom: `0.5px solid ${t.border}` }} onMouseEnter={e => e.currentTarget.style.background = t.surface2} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                  <img src={r.poster} alt="" style={{ width: 26, height: 39, borderRadius: 4, objectFit: "cover", flexShrink: 0 }} />
                                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</span>
                                  {year && <span style={{ fontSize: 9, color: t.textMuted, fontFamily: "monospace" }}>{year}</span>}
                                </div>
                              );
                            })}
                            {film && (
                              <div onMouseDown={() => { updateDraftPick(player, ri, ""); setEditingSlot(null); setSwapQuery(""); setTmdbSwapResults([]); }} style={{ padding: "6px 7px", cursor: "pointer", fontSize: 10, color: t.textMuted, fontStyle: "italic" }}>— clear pick —</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingSlot(slotKey); setSwapQuery(""); }} style={{ fontSize: 9, color: t.textMuted, background: "none", border: `0.5px solid ${t.border}`, borderRadius: 4, cursor: "pointer", padding: "2px 6px", fontWeight: 600 }}>
                          {film ? "swap" : "set film"}
                        </button>
                      )
                    )}
                    {film && (
                      <button onClick={() => goToFilmScoring(film)} style={{ fontSize: 9, color: t.gold, background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600 }}>scoring →</button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
