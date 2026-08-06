import { useState, useEffect } from "react";
import { calcFilmScore, getFilmOscarStatus, isFilmReleased, getBOPoints } from "../lib/scoring";
import { resolveBOTier, formatBOLabel, getCriticsPoints, getAudiencePoints } from "../lib/scoringRules";
import { Card, Poster } from "./ui";

function formatRevenue(revenue) {
  if (!revenue) return "—";
  if (revenue >= 1_000_000_000) return `$${(revenue / 1_000_000_000).toFixed(2)}bn`;
  if (revenue >= 1_000_000) return `$${(revenue / 1_000_000).toFixed(1)}m`;
  return `$${revenue.toLocaleString()}`;
}

export function Scoring({ scoring, movies, canEdit, isCommissioner, requireAuth, updateScoring, updateScoringMulti, updateScoringRoot, updateOscarField, updateMovieName, scoringFilm, setScoringFilm, showToast, fetchFilmScoring, t, rules }) {
  const [film, setFilm] = useState(scoringFilm || movies[0]);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState("");
  const [filmSearch, setFilmSearch] = useState(film || "");
  const [filmSearchOpen, setFilmSearchOpen] = useState(false);
  const [overrideManualFilm, setOverrideManualFilm] = useState(false); // false = Fill Auto Scores Only, true = Override Manual Scores
  const [fetchingMode, setFetchingMode] = useState(null); // "bo" | "rt" | "all" | null
  useEffect(() => { if (scoringFilm) { setFilm(scoringFilm); setFilmSearch(scoringFilm); } }, [scoringFilm]);
  useEffect(() => { window.scrollTo(0, 0); }, [film]);

  const fs = scoring[film] || {};
  const total = calcFilmScore(film, scoring, rules);
  const status = getFilmOscarStatus(film, scoring, rules);
  const boTiersSorted = [...(rules.boTiers || [])].sort((a, b) => b.millions - a.millions);
  const oscarCategories = rules.oscarCategories || [];
  const biggestOpening = scoring._biggestOpeningFilm || "";
  const mostNumber1 = scoring._mostNumber1Film || "";
  const filteredFilms = movies.filter(m => m.toLowerCase().includes(filmSearch.toLowerCase()));

  function withAuth(fn) { if (canEdit) fn(); else requireAuth(fn); }
  function set(field, val) { withAuth(() => updateScoring(film, field, val)); }
  function selectFilm(m) { setFilm(m); setScoringFilm(m); setFilmSearch(m); setFilmSearchOpen(false); setRenaming(false); }

  async function runFilmFetch(mode) {
    setFetchingMode(mode);
    await fetchFilmScoring(film, mode, overrideManualFilm);
    setFetchingMode(null);
  }

  const sel = { width: "100%", fontSize: 13, padding: "8px 10px", borderRadius: 7, border: `0.5px solid ${t.border}`, background: t.selectBg, color: t.text, cursor: canEdit ? "pointer" : "default" };
  const lbl = { fontSize: 11, fontWeight: 600, color: t.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 6 };

  return (
    <div>
      <div style={{ background: status.winner ? t.goldBg : t.surface, border: status.winner ? `2px solid ${t.gold}` : status.nominated ? `1.5px solid ${t.gold}` : `0.5px solid ${t.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: renaming ? 10 : 0 }}>
          <Poster film={film} scoring={scoring} size="large" t={t} />
          <div style={{ flex: 1 }}>
            <div style={{ position: "relative", marginBottom: 8 }}>
              <input
                value={filmSearch}
                onChange={e => { setFilmSearch(e.target.value); setFilmSearchOpen(true); }}
                onFocus={e => { setFilmSearchOpen(true); e.target.select(); }}
                onBlur={() => setTimeout(() => setFilmSearchOpen(false), 150)}
                placeholder="Search films…"
                style={{ ...sel, width: "100%", fontWeight: 600, fontSize: 14 }}
              />
              {filmSearchOpen && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 6, marginTop: 2, zIndex: 20, maxHeight: 220, overflowY: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                  {filteredFilms.length === 0 && <div style={{ padding: "8px 10px", fontSize: 12, color: t.textMuted }}>No matches</div>}
                  {filteredFilms.map(m => (
                    <div key={m} onMouseDown={() => selectFilm(m)} style={{ padding: "7px 10px", cursor: "pointer", fontSize: 13, color: t.text, borderBottom: `0.5px solid ${t.border}` }} onMouseEnter={e => e.currentTarget.style.background = t.surface2} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      {m}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {isFilmReleased(film, scoring) ? (
                <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "monospace", color: t.gold }}>{total} {total === 1 ? "Point" : "Points"}</span>
              ) : (
                <span style={{ fontSize: 16, fontWeight: 600, color: t.textMuted, fontStyle: "italic" }}>Unreleased</span>
              )}
              {isCommissioner && (() => {
                const isReleased = fs.released !== false;
                return (
                  <button
                    onClick={() => updateScoring(film, "released", !isReleased)}
                    style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: isReleased ? t.textMuted : "#FF8A65", background: "none", border: `0.5px solid ${isReleased ? t.border : "#E65100"}`, borderRadius: 5, cursor: "pointer", padding: "3px 8px", fontWeight: 500 }}
                  >
                    <span style={{ width: 26, height: 14, borderRadius: 7, background: isReleased ? t.gold : "#4A3520", position: "relative", display: "inline-block", transition: "background 0.15s" }}>
                      <span style={{ position: "absolute", top: 2, left: isReleased ? 14 : 2, width: 10, height: 10, borderRadius: 5, background: "#fff", transition: "left 0.15s" }} />
                    </span>
                    {isReleased ? "Released" : "Unreleased"}
                  </button>
                );
              })()}
              {status.winner && <span style={{ fontSize: 11, background: t.gold, color: "#fff", padding: "3px 9px", borderRadius: 5, fontWeight: 700 }}>BEST PICTURE ✦</span>}
              {status.nominated && !status.winner && <span style={{ fontSize: 11, background: t.goldBg, color: t.gold, padding: "3px 9px", borderRadius: 5, border: `0.5px solid ${t.gold}`, fontWeight: 600 }}>BP NOM</span>}
              {(canEdit || isCommissioner) && !renaming && <button onClick={() => withAuth(() => { setRenaming(true); setRenameVal(film); })} style={{ fontSize: 11, color: t.textMuted, background: "none", border: `0.5px solid ${t.border}`, borderRadius: 5, cursor: "pointer", padding: "3px 8px" }}>rename</button>}
            </div>
          </div>
        </div>
        {renaming && (
          <div style={{ display: "flex", gap: 8 }}>
            <input value={renameVal} onChange={e => setRenameVal(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { updateMovieName(film, renameVal); setFilm(renameVal); setScoringFilm(renameVal); setFilmSearch(renameVal); setRenaming(false); } if (e.key === "Escape") setRenaming(false); }} autoFocus style={{ flex: 1, fontSize: 13, padding: "6px 10px", borderRadius: 6, border: `0.5px solid ${t.borderStrong}`, background: t.surface2, color: t.text }} />
            <button onClick={() => { updateMovieName(film, renameVal); setFilm(renameVal); setScoringFilm(renameVal); setFilmSearch(renameVal); setRenaming(false); }} style={{ fontSize: 12, padding: "6px 14px", borderRadius: 6, border: "none", background: t.gold, color: "#fff", cursor: "pointer", fontWeight: 600 }}>Save</button>
            <button onClick={() => setRenaming(false)} style={{ fontSize: 12, padding: "6px 10px", borderRadius: 6, border: `0.5px solid ${t.border}`, background: "transparent", color: t.textMuted, cursor: "pointer" }}>Cancel</button>
          </div>
        )}
      </div>

      {isCommissioner && (
        <Card t={t} style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 8 }}>Fetch scoring for this film</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <button onClick={() => runFilmFetch("bo")} disabled={!!fetchingMode} style={{ fontSize: 12, padding: "7px 12px", borderRadius: 8, border: `1.5px solid ${t.gold}`, background: "transparent", color: t.gold, cursor: fetchingMode ? "default" : "pointer", fontWeight: 600, whiteSpace: "nowrap", opacity: fetchingMode ? 0.5 : 1 }}>
              {fetchingMode === "bo" ? "Fetching…" : "Fetch Box Office"}
            </button>
            <button onClick={() => runFilmFetch("rt")} disabled={!!fetchingMode} style={{ fontSize: 12, padding: "7px 12px", borderRadius: 8, border: `1.5px solid ${t.gold}`, background: "transparent", color: t.gold, cursor: fetchingMode ? "default" : "pointer", fontWeight: 600, whiteSpace: "nowrap", opacity: fetchingMode ? 0.5 : 1 }}>
              {fetchingMode === "rt" ? "Fetching…" : "Fetch Rotten Tomatoes"}
            </button>
            <button onClick={() => runFilmFetch("all")} disabled={!!fetchingMode} style={{ fontSize: 13, padding: "8px 16px", borderRadius: 8, border: `1.5px solid ${t.gold}`, background: fetchingMode ? "transparent" : t.gold, color: fetchingMode ? t.gold : "#fff", cursor: fetchingMode ? "default" : "pointer", fontWeight: 600, whiteSpace: "nowrap", opacity: fetchingMode ? 0.7 : 1 }}>
              {fetchingMode === "all" ? "Fetching…" : "Fetch All Scoring"}
            </button>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: t.textSub, cursor: "pointer" }}>
            <input type="checkbox" checked={overrideManualFilm} onChange={e => setOverrideManualFilm(e.target.checked)} />
            {overrideManualFilm
              ? "Override Manual Scores — fetch always wins, even over existing values"
              : "Fill Auto Scores Only — only fills missing box office/RT, never touches existing values"}
          </label>
        </Card>
      )}

      {!canEdit && <Card t={t} style={{ marginBottom: 10, fontSize: 13, color: t.textSub, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Log in to edit scores</span>
        <button onClick={() => requireAuth(() => {})} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "none", background: t.gold, color: "#fff", cursor: "pointer", fontWeight: 600 }}>Log in</button>
      </Card>}

      <Card t={t} style={{ marginBottom: 10, background: t.surface2 }}>
        <span style={lbl}>Stats {isCommissioner && <span style={{ fontSize: 9, color: t.textMuted, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>— enter raw values to auto-set scoring below</span>}</span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <div style={{ textAlign: "center", padding: "8px", borderRadius: 6, background: t.surface, border: `0.5px solid ${t.border}` }}>
            <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 4 }}>Box Office ($m)</div>
            {isCommissioner ? (
              <input
                type="number"
                placeholder="e.g. 117"
                defaultValue={fs.boRaw ? Math.round(fs.boRaw / 1_000_000) : ""}
                key={film + "-bo"}
                onBlur={e => {
                  const raw = e.target.value.trim();
                  if (raw === "") { updateScoringMulti(film, { boRaw: null, bo: "", boManual: false }); return; }
                  const millions = parseFloat(raw);
                  if (isNaN(millions) || millions <= 0) return;
                  const revenue = Math.round(millions * 1_000_000);
                  const tier = resolveBOTier(millions, rules.boTiers);
                  if (tier) updateScoringMulti(film, { boRaw: revenue, bo: tier.label, boManual: true });
                  else updateScoringMulti(film, { boRaw: revenue, boManual: true });
                }}
                style={{ width: "100%", fontSize: 14, fontWeight: 700, fontFamily: "monospace", textAlign: "center", background: "transparent", border: "none", borderBottom: `1px solid ${t.border}`, color: t.text, outline: "none", padding: "2px 0" }}
              />
            ) : (
              <div style={{ fontSize: 15, fontWeight: 700, color: fs.boRaw ? t.text : t.textMuted, fontFamily: "monospace" }}>
                {fs.boRaw ? formatRevenue(fs.boRaw) : fs.bo ? fs.bo : "—"}
              </div>
            )}
          </div>
          <div style={{ textAlign: "center", padding: "8px", borderRadius: 6, background: t.surface, border: `0.5px solid ${t.border}` }}>
            <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 4 }}>RT Critics %</div>
            {isCommissioner ? (
              <input
                type="number"
                min="0" max="100"
                placeholder="e.g. 87"
                defaultValue={fs.criticsRTRaw != null ? fs.criticsRTRaw : ""}
                key={film + "-critics"}
                onBlur={e => {
                  const raw = e.target.value.trim();
                  if (raw === "") { updateScoringMulti(film, { criticsRTRaw: null, criticsRT: "" }); return; }
                  const score = parseInt(raw);
                  if (isNaN(score)) return;
                  updateScoringMulti(film, { criticsRTRaw: score });
                }}
                style={{ width: "100%", fontSize: 14, fontWeight: 700, fontFamily: "monospace", textAlign: "center", background: "transparent", border: "none", borderBottom: `1px solid ${t.border}`, color: t.text, outline: "none", padding: "2px 0" }}
              />
            ) : (
              <div style={{ fontSize: 15, fontWeight: 700, color: fs.criticsRTRaw != null ? t.text : t.textMuted, fontFamily: "monospace" }}>
                {fs.criticsRTRaw != null ? `${fs.criticsRTRaw}%` : "—"}
              </div>
            )}
          </div>
          <div style={{ textAlign: "center", padding: "8px", borderRadius: 6, background: t.surface, border: `0.5px solid ${t.border}` }}>
            <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 4 }}>RT Audience %</div>
            {isCommissioner ? (
              <input
                type="number"
                min="0" max="100"
                placeholder="e.g. 74"
                defaultValue={fs.audienceRTRaw != null ? fs.audienceRTRaw : ""}
                key={film + "-audience"}
                onBlur={e => {
                  const raw = e.target.value.trim();
                  if (raw === "") { updateScoringMulti(film, { audienceRTRaw: null, audienceRT: "" }); return; }
                  const score = parseInt(raw);
                  if (isNaN(score)) return;
                  updateScoringMulti(film, { audienceRTRaw: score });
                }}
                style={{ width: "100%", fontSize: 14, fontWeight: 700, fontFamily: "monospace", textAlign: "center", background: "transparent", border: "none", borderBottom: `1px solid ${t.border}`, color: t.text, outline: "none", padding: "2px 0" }}
              />
            ) : (
              <div style={{ fontSize: 15, fontWeight: 700, color: fs.audienceRTRaw != null ? t.text : t.textMuted, fontFamily: "monospace" }}>
                {fs.audienceRTRaw != null ? `${fs.audienceRTRaw}%` : "—"}
              </div>
            )}
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <Card t={t}>
          <span style={lbl}>Box office</span>
          <select disabled={!canEdit} value={fs.bo || ""} onChange={e => withAuth(() => updateScoringMulti(film, { bo: e.target.value, boManual: !!e.target.value }))} style={sel}>
            <option value="">— select tier —</option>
            {boTiersSorted.map(tier => <option key={tier.millions} value={formatBOLabel(tier.millions)}>{formatBOLabel(tier.millions)}+ = {tier.pts} pts</option>)}
          </select>
          {fs.bo && <p style={{ marginTop: 8, fontSize: 13, color: t.gold, fontFamily: "monospace", fontWeight: 600 }}>{getBOPoints(fs.bo, rules)} pts</p>}
        </Card>
        <Card t={t}>
          <span style={lbl}>Rotten tomatoes</span>
          <label style={{ fontSize: 12, color: t.textMuted, display: "block", marginBottom: 4 }}>Critics</label>
          <select disabled={!canEdit} value={fs.criticsRTRaw ?? ""} onChange={e => withAuth(() => updateScoringMulti(film, { criticsRTRaw: e.target.value === "" ? null : parseInt(e.target.value) }))} style={{ ...sel, marginBottom: 8 }}>
            <option value="">— select —</option>
            {[...(rules.critics?.breakpoints || [])].sort((a, b) => b.min - a.min).map(bp => <option key={bp.min} value={bp.min}>{bp.min}%+ ({bp.pts} pts)</option>)}
          </select>
          <label style={{ fontSize: 12, color: t.textMuted, display: "block", marginBottom: 4 }}>Audience</label>
          <select disabled={!canEdit} value={fs.audienceRTRaw ?? ""} onChange={e => withAuth(() => updateScoringMulti(film, { audienceRTRaw: e.target.value === "" ? null : parseInt(e.target.value) }))} style={sel}>
            <option value="">— select —</option>
            {[...(rules.audience?.breakpoints || [])].sort((a, b) => b.min - a.min).map(bp => <option key={bp.min} value={bp.min}>{bp.min}%+ ({bp.pts} pts)</option>)}
          </select>
          <p style={{ marginTop: 8, fontSize: 13, color: t.gold, fontFamily: "monospace", fontWeight: 600 }}>{getCriticsPoints(fs.criticsRTRaw, rules) + getAudiencePoints(fs.audienceRTRaw, rules)} pts</p>
        </Card>
      </div>

      <Card t={t} style={{ marginBottom: 10 }}>
        <span style={lbl}>Seen film · +1 pt</span>
        <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: fs.seenFilm ? t.goldBg : t.surface2, borderRadius: 8, border: fs.seenFilm ? `1px solid ${t.gold}` : `0.5px solid ${t.border}`, cursor: canEdit ? "pointer" : "default" }}>
          <span style={{ fontSize: 13, color: fs.seenFilm ? t.gold : t.textSub, fontWeight: fs.seenFilm ? 600 : 400 }}>{fs.seenFilm ? "+1 pt awarded" : "Mark as seen"}</span>
          <input type="checkbox" disabled={!canEdit} checked={!!fs.seenFilm} onChange={e => set("seenFilm", e.target.checked)} />
        </label>
      </Card>

      <Card t={t} style={{ marginBottom: 10 }}>
        <span style={lbl}>Season bonuses · +1 pt each · one film only</span>
        <div style={{ display: "grid", gap: 8 }}>
          {[{ label: "Biggest Opening Weekend", key: "_biggestOpeningFilm", val: biggestOpening }, { label: "Most #1 Box Office Weeks", key: "_mostNumber1Film", val: mostNumber1 }].map(({ label, key, val }) => {
            const isChecked = val === film;
            return (
              <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: isChecked ? t.goldBg : t.surface2, borderRadius: 8, border: isChecked ? `1px solid ${t.gold}` : `0.5px solid ${t.border}` }}>
                <div>
                  <span style={{ fontSize: 13, color: t.text, fontWeight: 500 }}>{label}</span>
                  {val && val !== film && <span style={{ fontSize: 11, color: t.textMuted, marginLeft: 8 }}>currently: {val}</span>}
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: isChecked ? t.gold : t.textSub, fontWeight: isChecked ? 600 : 400, cursor: canEdit ? "pointer" : "default" }}>
                  <input type="checkbox" disabled={!canEdit} checked={isChecked} onChange={e => withAuth(() => updateScoringRoot(key, e.target.checked ? film : ""))} />
                  {isChecked ? "+1 pt awarded" : "Award to this film"}
                </label>
              </div>
            );
          })}
        </div>
      </Card>

      <Card t={t}>
        <span style={lbl}>Oscar nominations & wins</span>
        <div style={{ display: "grid", gap: 5 }}>
          {oscarCategories.filter(cat => cat.enabled !== false).map((cat) => {
            const i = oscarCategories.indexOf(cat);
            const isNom = (fs.oscarNoms?.[i] || []).includes(film);
            const isWin = (fs.oscarWinner?.[i] || "") === film;
            const isBP = i === 0;
            return (
              <div key={cat.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: (isNom || isWin) ? (isBP ? t.goldBg : t.surface2) : t.surface2, borderRadius: 6, border: (isNom || isWin) && isBP ? `1px solid ${t.gold}` : `0.5px solid ${t.border}` }}>
                <div>
                  <span style={{ fontSize: 13, color: t.text }}>{cat.name}</span>
                  <span style={{ fontSize: 11, color: t.textMuted, marginLeft: 8 }}>nom {cat.nomPts} / win {cat.winPts}</span>
                </div>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: t.textSub, cursor: canEdit ? "pointer" : "default" }}>
                    <input type="checkbox" disabled={!canEdit} checked={isNom} onChange={e => { const cur = fs.oscarNoms?.[i] || []; withAuth(() => updateOscarField(film, "oscarNoms", i, e.target.checked ? [...cur, film] : cur.filter(f => f !== film))); }} /> Nom
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: t.textSub, cursor: canEdit ? "pointer" : "default" }}>
                    <input type="checkbox" disabled={!canEdit} checked={isWin} onChange={e => { withAuth(() => updateOscarField(film, "oscarWinner", i, e.target.checked ? film : "")); }} /> Win
                  </label>
                  {(isNom || isWin) && <span style={{ fontSize: 12, fontFamily: "monospace", color: t.gold, fontWeight: 700 }}>+{(isNom ? cat.nomPts : 0) + (isWin ? cat.winPts : 0)}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
