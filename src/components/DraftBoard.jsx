import { useState, useEffect } from "react";
import { PLAYER_COLORS, FONT_SERIF } from "../lib/constants";
import { calcFilmScore, getFilmOscarStatus, isFilmReleased, getFilmScoreBreakdown } from "../lib/scoring";
import { searchTMDB } from "../lib/tmdb";
import { SL, Card, Poster, ConfirmDialog, PlaceholderBox } from "./ui";

export function DraftBoard({ draft, players, movies, canEdit, isCommissioner, openScoringMode, updateDraftPick, requireAuth, scoring, goToFilmScoring, t, focusPlayer, addMovie, irSlots, placeOnIR, removeFromIR, replacements, rules, irConfig }) {
  const sel = { width: "100%", fontSize: 11, padding: "4px 6px", borderRadius: 6, border: `0.5px solid ${t.border}`, background: t.selectBg, color: t.text, cursor: "pointer" };
  const [editingSlot, setEditingSlot] = useState(null);
  const [swapQuery, setSwapQuery] = useState("");
  const [tmdbSwapResults, setTmdbSwapResults] = useState([]);
  const [tmdbSwapLoading, setTmdbSwapLoading] = useState(false);
  const [confirmIR, setConfirmIR] = useState(null);
  const [breakdownView, setBreakdownView] = useState({}); // { [player]: true } when showing compact scoring breakdown

  async function handleSwapQueryChange(value) {
    setSwapQuery(value);
    if (!value.trim()) { setTmdbSwapResults([]); return; }
    setTmdbSwapLoading(true);
    const results = await searchTMDB(value);
    setTmdbSwapResults(results);
    setTmdbSwapLoading(false);
  }

  function selectNewFilm(title, poster_path, player, ri) {
    addMovie(title, poster_path);
    updateDraftPick(player, ri, title);
    setEditingSlot(null);
    setSwapQuery("");
    setTmdbSwapResults([]);
  }

  function closeSearch() {
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

  function SearchDropdown({ player, ri, displayFilm }) {
    return (
      <div style={{ position: "relative" }}>
        <input
          autoFocus
          value={swapQuery}
          onChange={e => handleSwapQueryChange(e.target.value)}
          onBlur={() => setTimeout(closeSearch, 150)}
          onKeyDown={e => { if (e.key === "Escape") closeSearch(); }}
          placeholder="Search films…"
          style={sel}
        />
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 6, marginTop: 2, zIndex: 20, maxHeight: 260, overflowY: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
          {movies.filter(m => m.toLowerCase().includes(swapQuery.toLowerCase())).length > 0 && (
            <div style={{ fontSize: 9, color: t.textMuted, fontWeight: 700, letterSpacing: "0.06em", padding: "5px 7px 2px", textTransform: "uppercase" }}>In your league</div>
          )}
          {movies.filter(m => m.toLowerCase().includes(swapQuery.toLowerCase())).slice(0, 5).map(m => (
            <div key={m} onMouseDown={() => { updateDraftPick(player, ri, m); closeSearch(); }} style={{ display: "flex", gap: 6, alignItems: "center", padding: "5px 7px", cursor: "pointer", fontSize: 10, color: t.text, borderBottom: `0.5px solid ${t.border}` }} onMouseEnter={e => e.currentTarget.style.background = t.surface2} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
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
          {displayFilm && (
            <div onMouseDown={() => { updateDraftPick(player, ri, ""); closeSearch(); }} style={{ padding: "6px 7px", cursor: "pointer", fontSize: 10, color: t.textMuted, fontStyle: "italic" }}>— clear pick —</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {confirmIR && (
        <ConfirmDialog
          t={t}
          title="Place on IR?"
          body={<>🏥 <strong style={{ color: t.text }}>{confirmIR.film}</strong> will be moved to IR for <strong style={{ color: t.text }}>{confirmIR.player}</strong>. Their score will be zeroed out and a replacement slot will open. This is permanent unless removed by a commissioner.</>}
          confirmLabel="Confirm IR"
          onCancel={() => setConfirmIR(null)}
          onConfirm={() => { placeOnIR(confirmIR.player, confirmIR.film); setConfirmIR(null); }}
        />
      )}

      <SL t={t}>2026 Draft Board</SL>
      {players.map((player, pi) => {
        const color = PLAYER_COLORS[pi % PLAYER_COLORS.length];
        const picks = draft[player] || Array(9).fill("");
        const irFilms = irSlots?.[player] || [];
        const replacementFilms = replacements?.[player] || [];
        const total = picks.reduce((s, f) => {
          if (!f || irFilms.includes(f)) return s;
          return s + calcFilmScore(f, scoring, rules);
        }, 0);
        const isFocused = focusPlayer === player;
        const showBreakdown = !!breakdownView[player];

        return (
          <Card key={player} t={t} style={{ marginBottom: 10, borderLeft: `3px solid ${color}`, outline: isFocused ? `2px solid ${t.gold}` : "none", outlineOffset: 2, overflow: "visible" }}>
            <div id={`player-${player.replace(/\s/g, "-")}`} style={{ position: "sticky", top: 0, zIndex: 3, background: t.surface, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, padding: "4px 0", borderBottom: `0.5px solid ${t.border}` }}>
              <span style={{ fontFamily: FONT_SERIF, fontSize: 15, fontWeight: 600, color: t.text }}>{player}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  onClick={() => setBreakdownView(v => ({ ...v, [player]: !v[player] }))}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = t.gold; e.currentTarget.style.color = t.gold; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted; }}
                  style={{ fontSize: 9, color: t.textMuted, background: "none", border: `0.5px solid ${t.border}`, borderRadius: 4, cursor: "pointer", padding: "3px 7px", fontWeight: 600, letterSpacing: "0.03em", transition: "border-color 0.15s, color 0.15s" }}
                >
                  {showBreakdown ? "poster view" : "scoring breakdown"}
                </button>
                <span style={{ fontSize: 13, fontFamily: "monospace", color: t.gold, fontWeight: 600 }}>{total} pts</span>
              </div>
            </div>

            {showBreakdown ? (
              /* Compact scoring-breakdown view (Option C) — one stacked row per pick: round +
                 clickable title + total on top, category-by-category point breakdown below.
                 A film still awaiting an IR replacement shows as a pending "add film" slot in
                 its round; the IR'd film itself is bumped to its own row at the bottom, tagged
                 with the round it came from where that's still knowable from current data. */
              (() => {
                const roundLabels = ["1","2","3","4","5","6","7","S1","S2"];
                const irOriginRound = {};
                picks.forEach((f, i) => { if (f && irFilms.includes(f)) irOriginRound[f] = roundLabels[i]; });

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {picks.map((film, ri) => {
                      const round = roundLabels[ri];
                      const isOnIR = film && irFilms.includes(film);
                      const displayFilm = isOnIR ? "" : film;
                      const isReplacement = isOnIR;
                      const isEmpty = !displayFilm;
                      const slotKey = `${player}-${ri}`;
                      const isEditing = editingSlot === slotKey;
                      const isFilledReplacement = displayFilm && replacementFilms.includes(displayFilm);
                      const released = displayFilm ? isFilmReleased(displayFilm, scoring) : false;
                      const score = displayFilm && released ? calcFilmScore(displayFilm, scoring, rules) : null;
                      const breakdown = displayFilm && released ? getFilmScoreBreakdown(displayFilm, scoring, rules) : [];

                      return (
                        <div key={ri} style={{ padding: "6px 8px", borderRadius: 4, background: t.surface2, border: `0.5px solid ${t.border}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                            <span style={{ fontSize: 11, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              <span style={{ fontSize: 9, color: t.textMuted, fontWeight: 700, marginRight: 6 }}>RD {round}</span>
                              {displayFilm ? (
                                <span
                                  onClick={() => goToFilmScoring(displayFilm)}
                                  style={{ color: t.text, fontWeight: 600, cursor: "pointer", textDecoration: "underline", textDecorationColor: "transparent", transition: "text-decoration-color 0.15s" }}
                                  onMouseEnter={e => e.currentTarget.style.textDecorationColor = t.gold}
                                  onMouseLeave={e => e.currentTarget.style.textDecorationColor = "transparent"}
                                >
                                  {displayFilm}
                                </span>
                              ) : (
                                <span style={{ color: t.textMuted, fontStyle: "italic" }}>{isReplacement ? "[replacement]" : "TBD"}</span>
                              )}
                              {isFilledReplacement && <span style={{ fontSize: 8, color: t.gold, fontWeight: 700, letterSpacing: "0.03em", marginLeft: 5 }}>[REPLACEMENT]</span>}
                            </span>
                            {displayFilm && (
                              <span style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, color: released ? t.gold : t.textMuted, fontStyle: released ? "normal" : "italic", flexShrink: 0 }}>
                                {released ? `${score} pts` : "unreleased"}
                              </span>
                            )}
                          </div>

                          {breakdown.length > 0 && (
                            <div style={{ fontSize: 9, color: t.textMuted, marginTop: 3, fontFamily: "monospace", lineHeight: 1.5 }}>
                              {breakdown.map((it, bi) => (
                                <span key={bi}>
                                  {it.label}{it.value ? ` ${it.value}` : ""} <span style={{ color: t.gold, fontWeight: 700 }}>(+{it.pts})</span>
                                  {bi < breakdown.length - 1 ? " · " : ""}
                                </span>
                              ))}
                            </div>
                          )}

                          {canEdit && (isCommissioner || openScoringMode) && (
                            isEditing ? (
                              <div style={{ marginTop: 4 }}><SearchDropdown player={player} ri={ri} displayFilm={displayFilm} /></div>
                            ) : (!isOnIR || isReplacement) && (
                              <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                                <button
                                  onClick={() => { setEditingSlot(slotKey); setSwapQuery(""); }}
                                  style={{ fontSize: 9, color: isEmpty ? t.gold : t.textMuted, background: "none", border: isEmpty ? `0.5px solid ${t.gold}` : `0.5px solid ${t.border}`, borderRadius: 4, cursor: "pointer", padding: "2px 6px", fontWeight: 600 }}
                                >
                                  {isEmpty ? "add film" : "swap"}
                                </button>
                                {!isEmpty && isCommissioner && irConfig?.enabled && displayFilm && irFilms.length < irConfig.maxSlots && (
                                  <button onClick={() => setConfirmIR({ player, film: displayFilm })} style={{ fontSize: 9, color: "#fff", background: "#B71C1C", border: "none", borderRadius: 4, cursor: "pointer", padding: "2px 6px", fontWeight: 700 }}>IR</button>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      );
                    })}

                    {/* Bumped IR films — moved to the bottom, tagged with their originating round
                        where that's still derivable from current picks data. No points shown. */}
                    {irFilms.map(irFilm => (
                      <div key={irFilm} style={{ padding: "6px 8px", borderRadius: 4, background: t.goldBg, border: `0.5px solid ${t.border}`, opacity: 0.85 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                          <span style={{ fontSize: 11, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            <span style={{ fontSize: 9, color: "#B71C1C", fontWeight: 700, marginRight: 6 }}>
                              IR{irOriginRound[irFilm] ? ` (RD ${irOriginRound[irFilm]})` : ""}
                            </span>
                            <span
                              onClick={() => goToFilmScoring(irFilm)}
                              style={{ color: t.textMuted, cursor: "pointer", textDecoration: "underline", textDecorationColor: "transparent", transition: "text-decoration-color 0.15s" }}
                              onMouseEnter={e => e.currentTarget.style.textDecorationColor = t.gold}
                              onMouseLeave={e => e.currentTarget.style.textDecorationColor = "transparent"}
                            >
                              {irFilm}
                            </span>
                          </span>
                        </div>
                        {isCommissioner && (
                          <button
                            onClick={() => { if (window.confirm(`Remove ${irFilm} from IR for ${player}?`)) removeFromIR(player, irFilm); }}
                            style={{ fontSize: 9, color: "#B71C1C", background: "none", border: `0.5px solid #B71C1C`, borderRadius: 4, cursor: "pointer", padding: "2px 6px", fontWeight: 600, marginTop: 4 }}
                          >
                            remove IR
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()
            ) : (
            /* Single grid — picks + IR box all flow together. 7 fixed columns so Rounds 1–7
                sit on one row and S1/S2 (plus any IR box) wrap to the next. */
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(110px, 1fr))", gap: 8 }}>
              {picks.map((film, ri) => {
                const round = ["1","2","3","4","5","6","7","S1","S2"][ri];
                const isOnIR = film && irFilms.includes(film);
                const score = film && !isOnIR ? calcFilmScore(film, scoring, rules) : null;
                const status = film && !isOnIR ? getFilmOscarStatus(film, scoring, rules) : {};
                const { nominated, winner } = status;
                const slotKey = `${player}-${ri}`;
                const isEditing = editingSlot === slotKey;
                const displayFilm = isOnIR ? "" : film;
                const isReplacement = isOnIR;
                const isEmpty = !displayFilm;

                return (
                  <div key={ri} style={{ position: "relative", display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ position: "relative", background: winner ? t.goldBg : isEmpty && !isReplacement ? "transparent" : t.surface2, border: winner ? `2px solid ${t.gold}` : nominated ? `1.5px solid ${t.gold}` : isReplacement ? `1px dashed ${t.gold}` : isEmpty ? `1px dashed ${t.border}` : `0.5px solid ${t.border}`, borderRadius: 4, padding: "8px", height: 230, overflow: "hidden" }}>
                      {winner && <span style={{ position: "absolute", top: -1, right: 3, fontSize: 8, background: t.gold, color: "#fff", padding: "1px 4px", borderRadius: "0 0 3px 3px", fontWeight: 700 }}>BP ✦</span>}
                      {nominated && !winner && <span style={{ position: "absolute", top: -1, right: 3, fontSize: 8, background: t.goldBg, color: t.gold, padding: "1px 4px", borderRadius: "0 0 3px 3px", border: `0.5px solid ${t.gold}`, fontWeight: 600 }}>NOM</span>}
                      <div style={{ fontSize: 9, color: t.textMuted, marginBottom: 4, fontWeight: 600, letterSpacing: "0.06em" }}>RD {round}</div>
                      <div style={{ fontSize: 10, color: t.text, fontWeight: 600, marginBottom: 4, textAlign: "center", lineHeight: 1.2, height: 36, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {displayFilm
                          ? <span onClick={() => goToFilmScoring(displayFilm)} style={{ cursor: "pointer", textDecoration: "underline", textDecorationColor: "transparent", transition: "text-decoration-color 0.15s" }} onMouseEnter={e => e.currentTarget.style.textDecorationColor = t.gold} onMouseLeave={e => e.currentTarget.style.textDecorationColor = "transparent"}>{displayFilm}</span>
                          : isReplacement
                            ? <span style={{ color: t.gold, fontWeight: 700, fontSize: 9 }}>[replacement]</span>
                            : <span style={{ color: t.textMuted, fontWeight: 400 }}>TBD</span>
                        }
                      </div>
                      {displayFilm ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
                          <Poster film={displayFilm} scoring={scoring} size="draft" t={t} />
                          {score !== null && (
                            <div style={{ width: "100%", textAlign: "center" }}>
                              {isFilmReleased(displayFilm, scoring) ? (
                                <span style={{ fontSize: 10, fontFamily: "monospace", color: t.textSub, fontWeight: 600 }}>{score} {score === 1 ? "Point" : "Points"}</span>
                              ) : (
                                <span style={{ fontSize: 10, color: t.textMuted, fontStyle: "italic" }}>Unreleased</span>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ margin: "0 auto", width: 80 }}>
                          <PlaceholderBox width={80} height={120} t={t} label={isReplacement ? undefined : "empty"} />
                        </div>
                      )}
                      {/* Fixed to the bottom of the card, below the score/Unreleased line either way — never overlaps the poster or gets clipped */}
                      {displayFilm && replacementFilms.includes(displayFilm) && (
                        <span style={{ position: "absolute", bottom: 6, left: 6, right: 6, fontSize: 8, color: "#fff", fontWeight: 700, textAlign: "center", letterSpacing: "0.03em", background: `${t.gold}dd`, borderRadius: 3, padding: "2px 3px", lineHeight: 1.2 }}>
                          REPLACEMENT
                        </span>
                      )}
                    </div>

                    {canEdit && (isCommissioner || openScoringMode) && !isOnIR && (
                      isEditing ? (
                        <SearchDropdown player={player} ri={ri} displayFilm={displayFilm} />
                      ) : (
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            onClick={() => { setEditingSlot(slotKey); setSwapQuery(""); }}
                            style={{ flex: 1, fontSize: 9, color: isEmpty ? t.gold : t.textMuted, background: "none", border: isEmpty ? `0.5px solid ${t.gold}` : `0.5px solid ${t.border}`, borderRadius: 4, cursor: "pointer", padding: "2px 6px", fontWeight: 600 }}
                          >
                            {isEmpty ? "add film" : "swap"}
                          </button>
                          {isCommissioner && irConfig?.enabled && displayFilm && irFilms.length < irConfig.maxSlots && (
                            <button onClick={() => setConfirmIR({ player, film: displayFilm })} style={{ fontSize: 9, color: "#fff", background: "#B71C1C", border: "none", borderRadius: 4, cursor: "pointer", padding: "2px 6px", fontWeight: 700 }}>IR</button>
                          )}
                        </div>
                      )
                    )}
                    {isReplacement && canEdit && (isCommissioner || openScoringMode) && (
                      editingSlot === slotKey ? (
                        <SearchDropdown player={player} ri={ri} displayFilm="" />
                      ) : (
                        <button
                          onClick={() => { setEditingSlot(slotKey); setSwapQuery(""); }}
                          style={{ fontSize: 9, color: t.gold, background: "none", border: `0.5px solid ${t.gold}`, borderRadius: 4, cursor: "pointer", padding: "2px 6px", fontWeight: 600 }}
                        >
                          add film
                        </button>
                      )
                    )}
                  </div>
                );
              })}

              {/* IR box(es) — last items in the grid, flow naturally after S1 and S2. One box per IR'd film. */}
              {irFilms.map(irFilm => (
                <div key={irFilm} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ position: "relative", background: t.redBg, border: `1.5px solid ${t.red}`, borderRadius: 4, padding: "8px", height: 230, overflow: "hidden" }}>
                    <div style={{ fontSize: 9, color: t.red, marginBottom: 4, fontWeight: 700, letterSpacing: "0.06em" }}>IR</div>
                    <div style={{ fontSize: 10, color: t.red, fontWeight: 600, marginBottom: 4, textAlign: "center", lineHeight: 1.2, height: 36, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {irFilm}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
                      <Poster film={irFilm} scoring={scoring} size="draft" t={t} />
                    </div>
                  </div>
                  {isCommissioner && (
                    <button
                      onClick={() => { if (window.confirm(`Remove ${irFilm} from IR for ${player}?`)) removeFromIR(player, irFilm); }}
                      style={{ fontSize: 9, color: "#B71C1C", background: "none", border: `0.5px solid #B71C1C`, borderRadius: 4, cursor: "pointer", padding: "2px 6px", fontWeight: 600 }}
                    >
                      remove IR
                    </button>
                  )}
                </div>
              ))}
            </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
