import { useState } from "react";
import { calcFilmScore, isFilmReleased } from "../lib/scoring";
import { SL, Card, Poster } from "./ui";
import { FilmBreakdown } from "./FilmBreakdown";

export function AllFilms({ movies, scoring, rules, t, goToFilmScoring }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null); // film title currently expanded, or null

  const filtered = movies.filter(m => m.toLowerCase().includes(search.toLowerCase()));

  // Released films sorted highest → lowest score; unreleased films grouped below,
  // alphabetical — same "unreleased sorts last" convention used elsewhere in the app.
  const sorted = [...filtered].sort((a, b) => {
    const aReleased = isFilmReleased(a, scoring);
    const bReleased = isFilmReleased(b, scoring);
    if (aReleased && !bReleased) return -1;
    if (!aReleased && bReleased) return 1;
    if (aReleased && bReleased) return calcFilmScore(b, scoring, rules) - calcFilmScore(a, scoring, rules);
    return a.localeCompare(b);
  });

  const inp = { fontSize: 13, padding: "8px 10px", borderRadius: 4, border: `0.5px solid ${t.borderStrong}`, background: t.selectBg, color: t.text, width: "100%", boxSizing: "border-box" };

  function toggle(film) {
    setExpanded(cur => cur === film ? null : film);
  }

  return (
    <div>
      <SL t={t}>All Films · sorted by score</SL>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search films…"
        style={{ ...inp, marginBottom: 12 }}
      />
      <div style={{ display: "grid", gap: 8 }}>
        {sorted.map(film => {
          const released = isFilmReleased(film, scoring);
          const total = calcFilmScore(film, scoring, rules);
          const isOpen = expanded === film;
          return (
            <Card key={film} t={t} style={{ padding: 0, overflow: "hidden" }}>
              <button
                onClick={() => toggle(film)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
              >
                <Poster film={film} scoring={scoring} size="mini" t={t} />
                <span style={{ flex: 1, fontSize: 14, color: t.text, fontWeight: 500 }}>{film}</span>
                {released ? (
                  <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: t.gold }}>{total} pts</span>
                ) : (
                  <span style={{ fontSize: 12, color: t.textMuted, fontStyle: "italic" }}>Unreleased</span>
                )}
                <span style={{ fontSize: 11, color: t.textMuted, transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>▶</span>
              </button>
              {isOpen && (
                <div style={{ padding: "0 14px 14px", borderTop: `0.5px solid ${t.border}` }}>
                  <div style={{ paddingTop: 14 }}>
                    <FilmBreakdown film={film} scoring={scoring} rules={rules} t={t} onGoToScoring={() => goToFilmScoring(film)} onlyAwardedOscars onlyAwardedBadges />
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        {sorted.length === 0 && <p style={{ fontSize: 13, color: t.textMuted, textAlign: "center", padding: "20px 0" }}>No films match "{search}"</p>}
      </div>
    </div>
  );
}
