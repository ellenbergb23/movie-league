import { useState, useEffect, useCallback } from "react";

const MOVIES_2026 = [
  "The Odyssey","Avengers: Doomsday","Disclosure Day","Project Hail Mary",
  "Spiderman: A Brand New Day","Dune: Messiah","Digger","Narnia",
  "Minions & Monsters","Social Reckoning","Adventures of Cliff Booth",
  "Hoppers","Josephine","Toy Story 5","Wild Horse Nine","Super Mario Galaxy",
  "The Great Beyond","The Entertainment System is Down","The Mandalorian & Grogu",
  "Fjord","Michael","Moana","Jumanji 4","The Drama",
  "Avatar the Last Airbender","Hunger Games","The Dog Stars","Saturn Return",
  "Jackass 5","Supergirl","Resident Evil","Werewulf",
  "Godzilla Minus Zero","Devil Wears Prada 2","1949",
  "Nirvanna The Band TSTM","Master of the Universe","Madden",
  "The Cat in the Hat","Behemoth!","Pegasus 3","Paper Tiger",
  "Sense & Sensibility","Untitled Jesse Eisenberg Musical","Backrooms",
  "Coyote vs Acme","I Play Rocky","The Only Living Pickpocket in NY",
  "Here Comes the Flood","Wildwood","I Swear",
  "Untitled Damien Chazelle Prison","Scary Movie 6","Jack of Spades",
  "All of a Sudden","I Love Boosters",
];

const OSCAR_CATEGORIES = [
  { name: "Best Picture", nomPts: 10, winPts: 10 },
  { name: "Best Director", nomPts: 3, winPts: 5 },
  { name: "Best Actor in a Leading Role", nomPts: 3, winPts: 5 },
  { name: "Best Actress in a Leading Role", nomPts: 3, winPts: 5 },
  { name: "Best Adapted Screenplay", nomPts: 3, winPts: 5 },
  { name: "Best Original Screenplay", nomPts: 3, winPts: 5 },
  { name: "Best Cinematography", nomPts: 3, winPts: 5 },
  { name: "Best Film Editing", nomPts: 3, winPts: 5 },
  { name: "Best Actor in a Supporting Role", nomPts: 1, winPts: 2 },
  { name: "Best Actress in a Supporting Role", nomPts: 1, winPts: 2 },
  { name: "Best Production Design", nomPts: 1, winPts: 2 },
  { name: "Best Costume Design", nomPts: 1, winPts: 2 },
  { name: "Best Animated Feature", nomPts: 1, winPts: 2 },
  { name: "Best Makeup", nomPts: 1, winPts: 2 },
  { name: "Best Original Score", nomPts: 1, winPts: 2 },
  { name: "Best International Feature", nomPts: 1, winPts: 2 },
  { name: "Best Original Song", nomPts: 1, winPts: 2 },
  { name: "Best Casting", nomPts: 1, winPts: 1 },
  { name: "Best Sound", nomPts: 1, winPts: 2 },
  { name: "Best Visual Effects", nomPts: 1, winPts: 2 },
];

const BO_TIERS = [
  { label: "$3bn+",  threshold: 3000000000, pts: 74 },
  { label: "$2.9bn", threshold: 2900000000, pts: 68 },
  { label: "$2.8bn", threshold: 2800000000, pts: 64 },
  { label: "$2.7bn", threshold: 2700000000, pts: 60 },
  { label: "$2.6bn", threshold: 2600000000, pts: 56 },
  { label: "$2.5bn", threshold: 2500000000, pts: 54 },
  { label: "$2.4bn", threshold: 2400000000, pts: 50 },
  { label: "$2.3bn", threshold: 2300000000, pts: 48 },
  { label: "$2.2bn", threshold: 2200000000, pts: 46 },
  { label: "$2.1bn", threshold: 2100000000, pts: 44 },
  { label: "$2bn",   threshold: 2000000000, pts: 44 },
  { label: "$1.9bn", threshold: 1900000000, pts: 40 },
  { label: "$1.8bn", threshold: 1800000000, pts: 38 },
  { label: "$1.7bn", threshold: 1700000000, pts: 37 },
  { label: "$1.6bn", threshold: 1600000000, pts: 36 },
  { label: "$1.5bn", threshold: 1500000000, pts: 36 },
  { label: "$1.4bn", threshold: 1400000000, pts: 32 },
  { label: "$1.3bn", threshold: 1300000000, pts: 30 },
  { label: "$1.2bn", threshold: 1200000000, pts: 28 },
  { label: "$1.1bn", threshold: 1100000000, pts: 26 },
  { label: "$1bn",   threshold: 1000000000, pts: 24 },
  { label: "$900m",  threshold:  900000000, pts: 20 },
  { label: "$800m",  threshold:  800000000, pts: 18 },
  { label: "$700m",  threshold:  700000000, pts: 16 },
  { label: "$600m",  threshold:  600000000, pts: 14 },
  { label: "$500m",  threshold:  500000000, pts: 12 },
  { label: "$400m",  threshold:  400000000, pts:  8 },
  { label: "$300m",  threshold:  300000000, pts:  6 },
  { label: "$200m",  threshold:  200000000, pts:  4 },
  { label: "$100m",  threshold:  100000000, pts:  2 },
];

const RT_OPTIONS = ["", "90%+ (7pts)", "Fresh 60-89% (2pts)", "Rotten (0pts)"];
const RT_AUD_OPTIONS = ["", "90%+ (5pts)", "Below 90% (0pts)"];

const PLAYERS = ["Ryan Williams","Illike","Walker","Nook","Ben Hillman","Chrinny","Ben E","IRobis"];
const ROUNDS = ["1","2","3","4","5","6","7","S1","S2"];

const PLAYER_COLORS = [
  "#1565C0","#6A1B4D","#1B5E20","#E65100",
  "#37474F","#4A148C","#B71C1C","#00695C",
];

const YEARS = ["2023","2024","2025","2026"];

function getRTPoints(critics, audience) {
  let pts = 0;
  if (critics === "90%+ (7pts)") pts += 7;
  else if (critics === "Fresh 60-89% (2pts)") pts += 2;
  if (audience === "90%+ (5pts)") pts += 5;
  return pts;
}

function getBOPoints(boLabel) {
  const tier = BO_TIERS.find(t => t.label === boLabel);
  return tier ? tier.pts : 0;
}

function calcFilmScore(film, scoring) {
  if (!scoring) return 0;
  let total = 0;
  const fs = scoring[film];
  if (!fs) return 0;
  total += getBOPoints(fs.bo || "");
  total += getRTPoints(fs.criticsRT || "", fs.audienceRT || "");
  OSCAR_CATEGORIES.forEach((cat, i) => {
    const noms = fs.oscarNoms?.[i] || [];
    const winner = fs.oscarWinner?.[i] || "";
    if (noms.includes(film)) total += cat.nomPts;
    if (winner === film) total += cat.winPts;
  });
  return total;
}

const STORAGE_KEY = "movieleague_v1";

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    leagues: {},
    currentLeague: null,
    user: null,
  };
}

function saveData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

const DEMO_LEAGUE = {
  id: "demo2026",
  name: "The 2026 Film League",
  year: "2026",
  commissioner: "Ben Ellenberg",
  members: PLAYERS,
  draft: {
    "Ryan Williams": ["The Odyssey","Minions & Monsters","The Great Beyond","Avatar the Last Airbender","Godzilla Minus Zero","Pegasus 3","Here Comes the Flood","",""],
    "Illike":        ["Avengers: Doomsday","Social Reckoning","Adventures of Cliff Booth","Hunger Games","Devil Wears Prada 2","Paper Tiger","Wildwood","",""],
    "Walker":        ["Disclosure Day","Adventures of Cliff Booth","The Mandalorian & Grogu","The Dog Stars","1949","Sense & Sensibility","I Swear","",""],
    "Nook":          ["Project Hail Mary","Hoppers","Fjord","Saturn Return","Nirvanna The Band TSTM","Untitled Jesse Eisenberg Musical","Untitled Damien Chazelle Prison","",""],
    "Ben Hillman":   ["Spiderman: A Brand New Day","Josephine","Michael","Jackass 5","Master of the Universe","Backrooms","Scary Movie 6","",""],
    "Chrinny":       ["Dune: Messiah","Toy Story 5","Moana","Supergirl","Madden","Coyote vs Acme","Jack of Spades","",""],
    "Ben E":         ["Digger","Wild Horse Nine","Jumanji 4","Resident Evil","The Cat in the Hat","I Play Rocky","All of a Sudden","",""],
    "IRobis":        ["Narnia","Super Mario Galaxy","The Drama","Werewulf","Behemoth!","The Only Living Pickpocket in NY","I Love Boosters","",""],
  },
  scoring: {},
  historicalPoints: {
    "Ryan Williams": { "2023": 37, "2024": 97, "2025": 104 },
    "Illike":        { "2023": 48, "2024": 77, "2025": 106 },
    "Walker":        { "2023": 0, "2024": 0, "2025": 61 },
    "Nook":          { "2023": 74, "2024": 134, "2025": 79 },
    "Ben Hillman":   { "2023": 35, "2024": 111, "2025": 103 },
    "Chrinny":       { "2023": 0, "2024": 0, "2025": 144 },
    "Ben E":         { "2023": 23, "2024": 58, "2025": 136 },
    "IRobis":        { "2023": 0, "2024": 0, "2025": 113 },
  },
};

export default function App() {
  const [data, setData] = useState(() => {
    const d = loadData();
    if (!d.leagues["demo2026"]) d.leagues["demo2026"] = DEMO_LEAGUE;
    if (!d.currentLeague) d.currentLeague = "demo2026";
    if (!d.user) d.user = { name: "Ben Ellenberg", isCommissioner: true };
    return d;
  });

  const [tab, setTab] = useState("leaderboard");
  const [scoringFilm, setScoringFilm] = useState(null);
  const [showCreateLeague, setShowCreateLeague] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState("");
  const [toast, setToast] = useState(null);

  const league = data.leagues[data.currentLeague];
  const isCommissioner = data.user?.name === league?.commissioner;

  const persist = useCallback((next) => {
    setData(next);
    saveData(next);
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function updateScoring(film, field, value) {
    persist({
      ...data,
      leagues: {
        ...data.leagues,
        [data.currentLeague]: {
          ...league,
          scoring: {
            ...league.scoring,
            [film]: { ...(league.scoring?.[film] || {}), [field]: value },
          },
        },
      },
    });
  }

  function updateOscarField(film, field, catIndex, value) {
    const filmScoring = league.scoring?.[film] || {};
    const arr = [...(filmScoring[field] || [])];
    arr[catIndex] = value;
    updateScoring(film, field, arr);
  }

  function updateDraftPick(player, roundIdx, value) {
    persist({
      ...data,
      leagues: {
        ...data.leagues,
        [data.currentLeague]: {
          ...league,
          draft: {
            ...league.draft,
            [player]: league.draft[player].map((v, i) => i === roundIdx ? value : v),
          },
        },
      },
    });
  }

  function getPlayerTotal(player) {
    const picks = league.draft?.[player] || [];
    return picks.reduce((sum, film) => sum + (film ? calcFilmScore(film, league.scoring) : 0), 0);
  }

  function getAllTimeTotal(player) {
    const hist = league.historicalPoints?.[player] || {};
    const histTotal = Object.values(hist).reduce((s, v) => s + v, 0);
    return histTotal + getPlayerTotal(player);
  }

  const rankedPlayers = [...PLAYERS].sort((a, b) => getPlayerTotal(b) - getPlayerTotal(a));

  const s = {
    app: { fontFamily: "var(--font-sans)", minHeight: "100vh", background: "var(--surface-0)", color: "var(--text-primary)" },
    header: { background: "#0D0D0D", borderBottom: "0.5px solid #2A2A2A", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52 },
    logo: { fontSize: 15, fontWeight: 500, color: "#F5A623", letterSpacing: "0.08em", textTransform: "uppercase" },
    leagueName: { fontSize: 12, color: "#888880", marginLeft: 12 },
    tabs: { display: "flex", gap: 2, padding: "0 1.5rem", background: "#0D0D0D", borderBottom: "0.5px solid #2A2A2A" },
    tab: (active) => ({ padding: "10px 16px", fontSize: 13, fontWeight: active ? 500 : 400, color: active ? "#F5A623" : "#888880", borderBottom: active ? "2px solid #F5A623" : "2px solid transparent", background: "none", border: "none", borderBottom: active ? "2px solid #F5A623" : "2px solid transparent", cursor: "pointer", letterSpacing: "0.03em" }),
    page: { maxWidth: 900, margin: "0 auto", padding: "1.5rem" },
    card: { background: "var(--surface-1)", border: "0.5px solid var(--border)", borderRadius: 12, padding: "1.25rem", marginBottom: 12 },
    sectionLabel: { fontSize: 11, fontWeight: 500, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 },
    filmSelect: { width: "100%", fontSize: 13, padding: "6px 8px", borderRadius: "var(--radius)", border: "0.5px solid var(--border)", background: "var(--surface-2)", color: "var(--text-primary)", cursor: "pointer" },
    scoreTag: (pts) => ({ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 500, background: pts > 0 ? "#1B5E2022" : pts < 0 ? "#B71C1C22" : "var(--surface-1)", color: pts > 0 ? "#2ECC71" : pts < 0 ? "#E74C3C" : "var(--text-muted)", fontFamily: "var(--font-mono)" }),
    btn: { padding: "7px 14px", fontSize: 13, borderRadius: "var(--radius)", border: "0.5px solid var(--border-strong)", background: "transparent", color: "var(--text-primary)", cursor: "pointer" },
    btnGold: { padding: "7px 14px", fontSize: 13, borderRadius: "var(--radius)", border: "0.5px solid #F5A623", background: "transparent", color: "#F5A623", cursor: "pointer" },
    input: { padding: "7px 10px", fontSize: 13, borderRadius: "var(--radius)", border: "0.5px solid var(--border)", background: "var(--surface-2)", color: "var(--text-primary)", width: "100%" },
  };

  return (
    <div style={s.app}>
      <h2 className="sr-only">Movie Fantasy League — 2026 season tracker</h2>

      {toast && (
        <div style={{ position: "fixed", top: 16, right: 16, background: "#F5A623", color: "#0D0D0D", padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, zIndex: 999 }}>
          {toast}
        </div>
      )}

      <header style={s.header}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={s.logo}>🎬 Film League</span>
          <span style={s.leagueName}>{league?.name}</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#888880" }}>{data.user?.name}</span>
          {isCommissioner && <span style={{ fontSize: 11, color: "#F5A623", border: "0.5px solid #F5A623", padding: "2px 6px", borderRadius: 4 }}>commissioner</span>}
        </div>
      </header>

      <nav style={s.tabs}>
        {["leaderboard","draft board","scoring","all time"].map(t => (
          <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>{t}</button>
        ))}
      </nav>

      <main style={s.page}>
        {tab === "leaderboard" && <Leaderboard rankedPlayers={rankedPlayers} getPlayerTotal={getPlayerTotal} league={league} s={s} />}
        {tab === "draft board" && <DraftBoard league={league} isCommissioner={isCommissioner} updateDraftPick={updateDraftPick} calcFilmScore={calcFilmScore} setScoringFilm={setScoringFilm} setTab={setTab} s={s} showToast={showToast} />}
        {tab === "scoring" && <Scoring league={league} isCommissioner={isCommissioner} updateScoring={updateScoring} updateOscarField={updateOscarField} scoringFilm={scoringFilm} setScoringFilm={setScoringFilm} s={s} showToast={showToast} />}
        {tab === "all time" && <AllTime league={league} getPlayerTotal={getPlayerTotal} getAllTimeTotal={getAllTimeTotal} s={s} />}
      </main>
    </div>
  );
}

function Leaderboard({ rankedPlayers, getPlayerTotal, league, s }) {
  const maxPts = Math.max(...rankedPlayers.map(p => getPlayerTotal(p)), 1);

  return (
    <div>
      <p style={s.sectionLabel}>2026 standings</p>
      {rankedPlayers.map((player, i) => {
        const pts = getPlayerTotal(player);
        const pct = Math.round((pts / maxPts) * 100);
        const color = PLAYER_COLORS[PLAYERS.indexOf(player)];
        const medals = ["🥇","🥈","🥉"];
        return (
          <div key={player} style={{ ...s.card, display: "flex", alignItems: "center", gap: 16, padding: "1rem 1.25rem" }}>
            <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>{medals[i] || `#${i+1}`}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{player}</span>
                <span style={{ fontSize: 15, fontWeight: 500, fontFamily: "var(--font-mono)", color: pts > 0 ? "#F5A623" : "var(--text-muted)" }}>{pts} pts</span>
              </div>
              <div style={{ height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.4s ease" }} />
              </div>
            </div>
          </div>
        );
      })}

      <p style={{ ...s.sectionLabel, marginTop: 24 }}>film scores</p>
      <div style={{ ...s.card, padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "0.5px solid var(--border)" }}>
              <th style={{ padding: "10px 16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 400 }}>Film</th>
              <th style={{ padding: "10px 16px", textAlign: "center", color: "var(--text-muted)", fontWeight: 400 }}>Score</th>
              <th style={{ padding: "10px 16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 400 }}>Drafted by</th>
            </tr>
          </thead>
          <tbody>
            {MOVIES_2026.map((film, i) => {
              const score = calcFilmScore(film, league.scoring);
              const owner = PLAYERS.find(p => league.draft?.[p]?.includes(film));
              if (!owner && score === 0) return null;
              return (
                <tr key={film} style={{ borderBottom: "0.5px solid var(--border)", background: i % 2 === 0 ? "transparent" : "var(--surface-1)" }}>
                  <td style={{ padding: "8px 16px" }}>{film}</td>
                  <td style={{ padding: "8px 16px", textAlign: "center" }}>
                    <span style={s.scoreTag(score)}>{score}</span>
                  </td>
                  <td style={{ padding: "8px 16px", color: owner ? PLAYER_COLORS[PLAYERS.indexOf(owner)] : "var(--text-muted)" }}>
                    {owner || "—"}
                  </td>
                </tr>
              );
            }).filter(Boolean)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DraftBoard({ league, isCommissioner, updateDraftPick, calcFilmScore, setScoringFilm, setTab, s, showToast }) {
  return (
    <div>
      <p style={s.sectionLabel}>2026 draft board</p>
      {PLAYERS.map((player, pi) => {
        const color = PLAYER_COLORS[pi];
        const picks = league.draft?.[player] || Array(9).fill("");
        const total = picks.reduce((sum, f) => sum + (f ? calcFilmScore(f, league.scoring) : 0), 0);
        return (
          <div key={player} style={{ ...s.card, borderLeft: `3px solid ${color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{player}</span>
              <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: "#F5A623" }}>{total} pts</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
              {ROUNDS.map((round, ri) => {
                const film = picks[ri] || "";
                const score = film ? calcFilmScore(film, league.scoring) : null;
                return (
                  <div key={round} style={{ background: "var(--surface-2)", borderRadius: 8, padding: "8px 10px", border: "0.5px solid var(--border)" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, letterSpacing: "0.08em" }}>ROUND {round}</div>
                    {isCommissioner ? (
                      <select
                        value={film}
                        onChange={e => updateDraftPick(player, ri, e.target.value)}
                        style={s.filmSelect}
                      >
                        <option value="">— pick a film —</option>
                        {MOVIES_2026.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    ) : (
                      <div style={{ fontSize: 13, color: film ? "var(--text-primary)" : "var(--text-muted)" }}>{film || "TBD"}</div>
                    )}
                    {film && score !== null && (
                      <div style={{ marginTop: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={s.scoreTag(score)}>{score} pts</span>
                        <button
                          onClick={() => { setScoringFilm(film); setTab("scoring"); }}
                          style={{ fontSize: 11, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                        >
                          edit score →
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Scoring({ league, isCommissioner, updateScoring, updateOscarField, scoringFilm, setScoringFilm, s, showToast }) {
  const [film, setFilm] = useState(scoringFilm || MOVIES_2026[0]);

  useEffect(() => { if (scoringFilm) setFilm(scoringFilm); }, [scoringFilm]);

  const fs = league.scoring?.[film] || {};
  const total = calcFilmScore(film, league.scoring);

  function set(field, val) {
    updateScoring(film, field, val);
    showToast("Saved");
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <select
          value={film}
          onChange={e => { setFilm(e.target.value); setScoringFilm(e.target.value); }}
          style={{ ...s.filmSelect, maxWidth: 320, fontSize: 14 }}
        >
          {MOVIES_2026.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <span style={{ fontSize: 18, fontWeight: 500, fontFamily: "var(--font-mono)", color: "#F5A623" }}>{total} pts</span>
      </div>

      {!isCommissioner && (
        <div style={{ ...s.card, background: "#F5A62311", border: "0.5px solid #F5A62344", color: "#F5A623", fontSize: 13 }}>
          Only the commissioner can update scores.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div style={s.card}>
          <p style={s.sectionLabel}>Box office</p>
          <select
            disabled={!isCommissioner}
            value={fs.bo || ""}
            onChange={e => set("bo", e.target.value)}
            style={s.filmSelect}
          >
            <option value="">— select tier —</option>
            {BO_TIERS.map(t => <option key={t.label} value={t.label}>{t.label} = {t.pts} pts</option>)}
          </select>
          {fs.bo && <p style={{ marginTop: 8, fontSize: 13, color: "#F5A623" }}>{getBOPoints(fs.bo)} pts</p>}
        </div>

        <div style={s.card}>
          <p style={s.sectionLabel}>Rotten tomatoes</p>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Critics</label>
            <select
              disabled={!isCommissioner}
              value={fs.criticsRT || ""}
              onChange={e => set("criticsRT", e.target.value)}
              style={s.filmSelect}
            >
              {RT_OPTIONS.map(o => <option key={o} value={o}>{o || "— select —"}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Audience</label>
            <select
              disabled={!isCommissioner}
              value={fs.audienceRT || ""}
              onChange={e => set("audienceRT", e.target.value)}
              style={s.filmSelect}
            >
              {RT_AUD_OPTIONS.map(o => <option key={o} value={o}>{o || "— select —"}</option>)}
            </select>
          </div>
          <p style={{ marginTop: 8, fontSize: 13, color: "#F5A623" }}>{getRTPoints(fs.criticsRT || "", fs.audienceRT || "")} pts</p>
        </div>
      </div>

      <div style={s.card}>
        <p style={s.sectionLabel}>Oscar nominations & wins</p>
        <div style={{ display: "grid", gap: 8 }}>
          {OSCAR_CATEGORIES.map((cat, i) => {
            const isNominated = (fs.oscarNoms?.[i] || []).includes(film);
            const isWinner = (fs.oscarWinner?.[i] || "") === film;
            return (
              <div key={cat.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: (isNominated || isWinner) ? "#F5A62311" : "var(--surface-2)", borderRadius: 8, border: `0.5px solid ${(isNominated || isWinner) ? "#F5A62344" : "var(--border)"}` }}>
                <div>
                  <span style={{ fontSize: 13 }}>{cat.name}</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>nom {cat.nomPts}pt / win {cat.winPts}pt</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-secondary)", cursor: isCommissioner ? "pointer" : "default" }}>
                    <input
                      type="checkbox"
                      disabled={!isCommissioner}
                      checked={isNominated}
                      onChange={e => {
                        const cur = fs.oscarNoms?.[i] || [];
                        const next = e.target.checked ? [...cur, film] : cur.filter(f => f !== film);
                        updateOscarField(film, "oscarNoms", i, next);
                        showToast("Saved");
                      }}
                    />
                    Nom
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-secondary)", cursor: isCommissioner ? "pointer" : "default" }}>
                    <input
                      type="checkbox"
                      disabled={!isCommissioner}
                      checked={isWinner}
                      onChange={e => {
                        updateOscarField(film, "oscarWinner", i, e.target.checked ? film : "");
                        showToast("Saved");
                      }}
                    />
                    Win
                  </label>
                  {(isNominated || isWinner) && (
                    <span style={s.scoreTag(cat.nomPts)}>
                      +{(isNominated ? cat.nomPts : 0) + (isWinner ? cat.winPts : 0)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AllTime({ league, getPlayerTotal, getAllTimeTotal, s }) {
  const sorted = [...PLAYERS].sort((a, b) => getAllTimeTotal(b) - getAllTimeTotal(a));

  return (
    <div>
      <p style={s.sectionLabel}>all-time standings</p>
      <div style={{ ...s.card, padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "0.5px solid var(--border)" }}>
              <th style={{ padding: "10px 16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 400 }}>#</th>
              <th style={{ padding: "10px 16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 400 }}>Player</th>
              {YEARS.map(y => <th key={y} style={{ padding: "10px 16px", textAlign: "center", color: "var(--text-muted)", fontWeight: 400 }}>{y}</th>)}
              <th style={{ padding: "10px 16px", textAlign: "center", color: "#F5A623", fontWeight: 500 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((player, i) => {
              const color = PLAYER_COLORS[PLAYERS.indexOf(player)];
              const medals = ["🥇","🥈","🥉"];
              return (
                <tr key={player} style={{ borderBottom: "0.5px solid var(--border)" }}>
                  <td style={{ padding: "10px 16px" }}>{medals[i] || `#${i+1}`}</td>
                  <td style={{ padding: "10px 16px", fontWeight: 500, color }}>{player}</td>
                  {YEARS.map(y => {
                    const pts = y === "2026"
                      ? getPlayerTotal(player)
                      : (league.historicalPoints?.[player]?.[y] || 0);
                    return (
                      <td key={y} style={{ padding: "10px 16px", textAlign: "center", fontFamily: "var(--font-mono)", color: pts > 0 ? "var(--text-primary)" : "var(--text-muted)" }}>
                        {pts || "—"}
                      </td>
                    );
                  })}
                  <td style={{ padding: "10px 16px", textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 500, color: "#F5A623" }}>
                    {getAllTimeTotal(player)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
