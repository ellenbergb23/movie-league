import { PLAYER_COLORS, DEFAULT_PLAYERS } from "../lib/constants";
import { getPlayerOscarTotals } from "../lib/scoring";
import { SL, Card, OscarBadge } from "./ui";

export function Leaderboard({ rankedPlayers, getPlayerTotal, draft, scoring, t, goToPlayerDraft }) {
  const maxPts = Math.max(...rankedPlayers.map(p => getPlayerTotal(p)), 1);
  const medals = ["🥇","🥈","🥉"];
  return (
    <div>
      <SL t={t}>2026 standings · click a name to view their draft</SL>
      <div style={{ display: "grid", gap: 8 }}>
        {rankedPlayers.map((player, i) => {
          const pts = getPlayerTotal(player);
          const pct = Math.round((pts / maxPts) * 100);
          const color = PLAYER_COLORS[DEFAULT_PLAYERS.indexOf(player) % PLAYER_COLORS.length];
          const { noms, wins } = getPlayerOscarTotals(player, draft, scoring);
          return (
            <Card key={player} t={t}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>{medals[i] || `#${i+1}`}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                    <button className="clickable" onClick={() => goToPlayerDraft(player)} style={{ fontSize: 14, fontWeight: 600, color: t.text, background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline", textDecorationColor: t.border, textUnderlineOffset: 3 }}>{player}</button>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <OscarBadge noms={noms} wins={wins} t={t} />
                      <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: t.gold }}>{pts}</span>
                    </div>
                  </div>
                  <div style={{ height: 3, background: t.surface2, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2 }} />
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
