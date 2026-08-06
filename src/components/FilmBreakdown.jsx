import { calcFilmScore, getFilmOscarStatus, isFilmReleased, getBOPoints } from "../lib/scoring";
import { getCriticsPoints, getAudiencePoints } from "../lib/scoringRules";
import { formatRevenue } from "../lib/scoring-utils";
import { Card, Poster } from "./ui";
import { FONT_SERIF } from "../lib/constants";

// Read-only scoring breakdown — single source of truth for "how did this film score",
// shared between the All Films list (inline, view-only) and anywhere else that needs the
// same summary without the editing controls that live in Scoring.jsx.
export function FilmBreakdown({ film, scoring, rules, t, onGoToScoring }) {
  const fs = scoring[film] || {};
  const total = calcFilmScore(film, scoring, rules);
  const status = getFilmOscarStatus(film, scoring, rules);
  const oscarCategories = (rules.oscarCategories || []).filter(cat => cat.enabled !== false);
  const released = isFilmReleased(film, scoring);
  const biggestOpening = scoring._biggestOpeningFilm === film;
  const mostNumber1 = scoring._mostNumber1Film === film;

  const lbl = { fontSize: 11, fontWeight: 600, color: t.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 6 };
  const row = (label, awarded) => (
    <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: awarded ? t.goldBg : t.surface2, borderRadius: 4, border: awarded ? `1px solid ${t.gold}` : `0.5px solid ${t.border}` }}>
      <span style={{ fontSize: 13, color: t.text }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: awarded ? t.gold : t.textMuted }}>{awarded ? "Awarded · +1 pt" : "Not awarded"}</span>
    </div>
  );

  return (
    <div>
      <div style={{ background: status.winner ? t.goldBg : t.surface, border: status.winner ? `2px solid ${t.gold}` : status.nominated ? `1.5px solid ${t.gold}` : `0.5px solid ${t.border}`, borderRadius: 4, padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <Poster film={film} scoring={scoring} size="large" t={t} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONT_SERIF, fontSize: 22, fontWeight: 500, color: t.text, marginBottom: 8 }}>{film}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {released ? (
                <span style={{ fontFamily: FONT_SERIF, fontSize: 18, fontWeight: 700, color: t.gold }}>{total} {total === 1 ? "Point" : "Points"}</span>
              ) : (
                <span style={{ fontSize: 15, fontWeight: 600, color: t.textMuted, fontStyle: "italic" }}>Unreleased</span>
              )}
              {status.winner && <span style={{ fontSize: 11, background: t.gold, color: "#fff", padding: "3px 9px", borderRadius: 4, fontWeight: 700 }}>BEST PICTURE ✦</span>}
              {status.nominated && !status.winner && <span style={{ fontSize: 11, background: t.goldBg, color: t.gold, padding: "3px 9px", borderRadius: 4, border: `0.5px solid ${t.gold}`, fontWeight: 600 }}>BP NOM</span>}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
        <Card t={t} style={{ textAlign: "center" }}>
          <span style={lbl}>Box office</span>
          <div style={{ fontSize: 14, color: t.text, marginBottom: 4 }}>{fs.boRaw ? formatRevenue(fs.boRaw) : fs.bo || "—"}</div>
          <div style={{ fontFamily: FONT_SERIF, fontSize: 15, fontWeight: 700, color: t.gold }}>{getBOPoints(fs.bo, rules)} pts</div>
        </Card>
        <Card t={t} style={{ textAlign: "center" }}>
          <span style={lbl}>RT critics</span>
          <div style={{ fontSize: 14, color: t.text, marginBottom: 4 }}>{fs.criticsRTRaw != null ? `${fs.criticsRTRaw}%+` : "—"}</div>
          <div style={{ fontFamily: FONT_SERIF, fontSize: 15, fontWeight: 700, color: t.gold }}>{getCriticsPoints(fs.criticsRTRaw, rules)} pts</div>
        </Card>
        <Card t={t} style={{ textAlign: "center" }}>
          <span style={lbl}>RT audience</span>
          <div style={{ fontSize: 14, color: t.text, marginBottom: 4 }}>{fs.audienceRTRaw != null ? `${fs.audienceRTRaw}%+` : "—"}</div>
          <div style={{ fontFamily: FONT_SERIF, fontSize: 15, fontWeight: 700, color: t.gold }}>{getAudiencePoints(fs.audienceRTRaw, rules)} pts</div>
        </Card>
      </div>

      <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
        {row("Seen film", !!fs.seenFilm)}
        {row("Biggest opening weekend", biggestOpening)}
        {row("Most #1 box office weeks", mostNumber1)}
      </div>

      <span style={lbl}>Oscar nominations & wins</span>
      <div style={{ display: "grid", gap: 5, marginBottom: 14 }}>
        {oscarCategories.map((cat) => {
          const i = (rules.oscarCategories || []).indexOf(cat);
          const isNom = (fs.oscarNoms?.[i] || []).includes(film);
          const isWin = (fs.oscarWinner?.[i] || "") === film;
          const pts = (isNom ? cat.nomPts : 0) + (isWin ? cat.winPts : 0);
          return (
            <div key={cat.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: t.surface2, borderRadius: 4, borderBottom: `0.5px solid ${t.border}` }}>
              <div>
                <span style={{ fontSize: 13, color: t.text }}>{cat.name}</span>
                <span style={{ fontSize: 11, color: t.textMuted, marginLeft: 8 }}>nom {cat.nomPts} / win {cat.winPts}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: isWin ? t.gold : isNom ? t.gold : t.textMuted }}>
                {isWin ? `Won · +${pts}` : isNom ? `Nominated · +${pts}` : "—"}
              </span>
            </div>
          );
        })}
      </div>

      {onGoToScoring && (
        <button onClick={onGoToScoring} style={{ width: "100%", fontSize: 13, padding: "10px 16px", borderRadius: 4, border: `1.5px solid ${t.gold}`, background: "transparent", color: t.gold, cursor: "pointer", fontWeight: 600 }}>
          Go to full scoring page →
        </button>
      )}
    </div>
  );
}
