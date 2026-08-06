import { PLAYER_COLORS, DEFAULT_PLAYERS, FONT_SERIF } from "../lib/constants";
import { getPlayerOscarTotals, getPlayerReleaseStats } from "../lib/scoring";
import { SL, Card, OscarBadge } from "./ui";

export function Leaderboard({ rankedPlayers, getPlayerTotal, draft, scoring, t, goToPlayerDraft, irSlots, rules }) {
  const maxPts = Math.max(...rankedPlayers.map(p => getPlayerTotal(p)), 1);
  return (
    <div>
      <SL t={t}>2026 Standings · click a name to view their draft</SL>
      <div style={{ display: "grid", gap: 8 }}>
        {rankedPlayers.map((player, i) => {
          const pts = getPlayerTotal(player);
          const pct = Math.round((pts / maxPts) * 100);
          const color = PLAYER_COLORS[DEFAULT_PLAYERS.indexOf(player) % PLAYER_COLORS.length];
          const { noms, wins } = getPlayerOscarTotals(player, draft, scoring, rules);
          const irFilms = irSlots?.[player] || [];
          const { released, unreleased, onIR, avgScore } = getPlayerReleaseStats(player, draft, scoring, irFilms, rules);
          // An all-unreleased team has no data yet, not a score of zero — treat the main
          // score and the avg the same way (both "—") instead of "0" next to "avg — pts",
          // and style the card as an empty state so it doesn't read as broken.
          const isEmpty = released === 0;
          return (
            <Card key={player} t={t} style={isEmpty ? { borderStyle: "dashed" } : {}}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontFamily: FONT_SERIF, fontSize: 18, width: 28, textAlign: "center", color: t.textMuted }}>{String(i + 1).padStart(2, "0")}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                    <button className="clickable" onClick={() => goToPlayerDraft(player)} style={{ fontFamily: FONT_SERIF, fontSize: 15, fontWeight: 600, color: t.text, background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline", textDecorationColor: t.border, textUnderlineOffset: 3 }}>{player}</button>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <OscarBadge noms={noms} wins={wins} t={t} />
                      <span style={{ fontFamily: FONT_SERIF, fontSize: 16, fontWeight: 700, color: isEmpty ? t.textMuted : t.gold }}>{isEmpty ? "—" : pts}</span>
                    </div>
                  </div>
                  {isEmpty ? (
                    <div style={{ fontSize: 11, color: t.textMuted, fontStyle: "italic", padding: "2px 0" }}>No films released yet</div>
                  ) : (
                    <div style={{ height: 3, background: t.surface2, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2 }} />
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, marginTop: 6, fontSize: 11, color: t.textMuted }}>
                    <span>{released} released</span>
                    <span>·</span>
                    <span>{unreleased} unreleased</span>
                    {onIR > 0 && (
                      <>
                        <span>·</span>
                        <span style={{ color: t.red, fontWeight: 600 }}>{onIR} on IR</span>
                      </>
                    )}
                    <span>·</span>
                    <span>avg {isEmpty ? "—" : avgScore.toFixed(1)} pts</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
