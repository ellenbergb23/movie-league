import { useState, useEffect } from "react";
import { BO_TIERS, RT_OPTIONS, RT_AUD_OPTIONS, OSCAR_CATEGORIES } from "../lib/constants";
import { calcFilmScore, getFilmOscarStatus, isFilmReleased, getRTPoints, getBOPoints } from "../lib/scoring";
import { Card, Poster } from "./ui";

export function Scoring({ scoring, movies, canEdit, isCommissioner, requireAuth, updateScoring, updateScoringRoot, updateOscarField, updateMovieName, scoringFilm, setScoringFilm, showToast, t }) {
  const [film, setFilm] = useState(scoringFilm || movies[0]);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState("");
  const [filmSearch, setFilmSearch] = useState(film || "");
  const [filmSearchOpen, setFilmSearchOpen] = useState(false);
  useEffect(() => { if (scoringFilm) { setFilm(scoringFilm); setFilmSearch(scoringFilm); } }, [scoringFilm]);

  const fs = scoring[film] || {};
  const total = calcFilmScore(film, scoring);
  const status = getFilmOscarStatus(film, scoring);
  const biggestOpening = scoring._biggestOpeningFilm || "";
  const mostNumber1 = scoring._mostNumber1Film || "";
  const filteredFilms = movies.filter(m => m.toLowerCase().includes(filmSearch.toLowerCase()));

  function withAuth(fn) { if (canEdit) fn(); else requireAuth(fn); }
  function set(field, val) { withAuth(() => updateScoring(film, field, val)); }
  function selectFilm(m) { setFilm(m); setScoringFilm(m); setFilmSearch(m); setFilmSearchOpen(false); setRenaming(false); }

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

      {!canEdit && <Card t={t} style={{ marginBottom: 10, fontSize: 13, color: t.textSub, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Log in to edit scores</span>
        <button onClick={() => requireAuth(() => {})} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "none", background: t.gold, color: "#fff", cursor: "pointer", fontWeight: 600 }}>Log in</button>
      </Card>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <Card t={t}>
          <span style={lbl}>Box office</span>
          <select disabled={!canEdit} value={fs.bo || ""} onChange={e => set("bo", e.target.value)} style={sel}>
            <option value="">— select tier —</option>
            {BO_TIERS.map(tier => <option key={tier.label} value={tier.label}>{tier.label} = {tier.pts} pts</option>)}
          </select>
          {fs.bo && <p style={{ marginTop: 8, fontSize: 13, color: t.gold, fontFamily: "monospace", fontWeight: 600 }}>{getBOPoints(fs.bo)} pts</p>}
        </Card>
        <Card t={t}>
          <span style={lbl}>Rotten tomatoes</span>
          <label style={{ fontSize: 12, color: t.textMuted, display: "block", marginBottom: 4 }}>Critics</label>
          <select disabled={!canEdit} value={fs.criticsRT || ""} onChange={e => set("criticsRT", e.target.value)} style={{ ...sel, marginBottom: 8 }}>
            {RT_OPTIONS.map(o => <option key={o} value={o}>{o || "— select —"}</option>)}
          </select>
          <label style={{ fontSize: 12, color: t.textMuted, display: "block", marginBottom: 4 }}>Audience</label>
          <select disabled={!canEdit} value={fs.audienceRT || ""} onChange={e => set("audienceRT", e.target.value)} style={sel}>
            {RT_AUD_OPTIONS.map(o => <option key={o} value={o}>{o || "— select —"}</option>)}
          </select>
          <p style={{ marginTop: 8, fontSize: 13, color: t.gold, fontFamily: "monospace", fontWeight: 600 }}>{getRTPoints(fs.criticsRT || "", fs.audienceRT || "")} pts</p>
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
          {OSCAR_CATEGORIES.map((cat, i) => {
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
