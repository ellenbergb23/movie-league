import { useState, useEffect, useCallback } from "react";

const DEFAULT_MOVIES = [
  "The Odyssey","Avengers: Doomsday","Disclosure Day","Project Hail Mary",
  "Spider-Man: Brand New Day","Dune: Messiah","Digger","Narnia",
  "Minions & Monsters","Social Reckoning","Adventures of Cliff Booth",
  "Hoppers","Josephine","Toy Story 5","Wild Horse Nine","Super Mario Galaxy",
  "The Great Beyond","The Entertainment System is Down","The Mandalorian & Grogu",
  "Fjord","Michael","Moana 2","Jumanji 4","The Drama",
  "Avatar: The Last Airbender","Hunger Games: Sunrise on the Reaping","The Dog Stars","Saturn Return",
  "Jackass 5","Supergirl: Woman of Tomorrow","Resident Evil","Werewulf",
  "Godzilla Minus Zero","The Devil Wears Prada 2","1949",
  "Nirvanna The Band TSTM","Master of the Universe","Madden",
  "The Cat in the Hat","Behemoth!","Pegasus 3","Paper Tiger",
  "Sense & Sensibility","Untitled Jesse Eisenberg Musical","Backrooms",
  "Coyote vs. Acme","I Play Rocky","The Only Living Pickpocket in NY",
  "Here Comes the Flood","Wildwood","I Swear",
  "Untitled Damien Chazelle","Scary Movie 6","Jack of Spades",
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

const RT_OPTIONS     = ["", "90%+ (7pts)", "Fresh 60-89% (2pts)", "Rotten (0pts)"];
const RT_AUD_OPTIONS = ["", "90%+ (5pts)", "Below 90% (0pts)"];

const PLAYERS = ["Ryan Williams","Illike","Walker","Nook","Ben Hillman","Chrinny","Ben E","IRobis"];
const ROUNDS  = ["1","2","3","4","5","6","7","S1","S2"];
const YEARS   = ["2023","2024","2025","2026"];

const PLAYER_COLORS = [
  "#1565C0","#6A1B4D","#1B5E20","#E65100",
  "#37474F","#4A148C","#B71C1C","#00695C",
];

const GOLD = "#C9A84C";
const GOLD_BG = "#FBF5E6";
const GOLD_BORDER = `1.5px solid ${GOLD}`;

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
  if (!scoring || !film) return 0;
  const fs = scoring[film];
  if (!fs) return 0;
  let total = 0;
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

function getFilmOscarStatus(film, scoring) {
  if (!scoring || !film) return { nominated: false, winner: false, totalNoms: 0, totalWins: 0 };
  const fs = scoring[film];
  if (!fs) return { nominated: false, winner: false, totalNoms: 0, totalWins: 0 };
  const bpNoms = fs.oscarNoms?.[0] || [];
  const bpWinner = fs.oscarWinner?.[0] || "";
  let totalNoms = 0, totalWins = 0;
  OSCAR_CATEGORIES.forEach((_, i) => {
    const noms = fs.oscarNoms?.[i] || [];
    const winner = fs.oscarWinner?.[i] || "";
    if (noms.includes(film)) totalNoms++;
    if (winner === film) totalWins++;
  });
  return {
    nominated: bpNoms.includes(film),
    winner: bpWinner === film,
    totalNoms,
    totalWins,
  };
}

function getPlayerOscarTotals(player, league) {
  const picks = league.draft?.[player] || [];
  let noms = 0, wins = 0;
  picks.forEach(film => {
    if (!film) return;
    const status = getFilmOscarStatus(film, league.scoring);
    noms += status.totalNoms;
    wins += status.totalWins;
  });
  return { noms, wins };
}

const STORAGE_KEY = "movieleague_v2";

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { leagues: {}, currentLeague: null, user: null };
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
  movies: [...DEFAULT_MOVIES],
  draft: {
    "Ryan Williams": ["The Odyssey","Minions & Monsters","The Great Beyond","Avatar: The Last Airbender","Godzilla Minus Zero","Pegasus 3","Here Comes the Flood","",""],
    "Illike":        ["Avengers: Doomsday","Social Reckoning","Adventures of Cliff Booth","Hunger Games: Sunrise on the Reaping","The Devil Wears Prada 2","Paper Tiger","Wildwood","",""],
    "Walker":        ["Disclosure Day","Adventures of Cliff Booth","The Mandalorian & Grogu","The Dog Stars","1949","Sense & Sensibility","I Swear","",""],
    "Nook":          ["Project Hail Mary","Hoppers","Fjord","Saturn Return","Nirvanna The Band TSTM","Untitled Jesse Eisenberg Musical","Untitled Damien Chazelle","",""],
    "Ben Hillman":   ["Spider-Man: Brand New Day","Josephine","Michael","Jackass 5","Master of the Universe","Backrooms","Scary Movie 6","",""],
    "Chrinny":       ["Dune: Messiah","Toy Story 5","Moana 2","Supergirl: Woman of Tomorrow","Madden","Coyote vs. Acme","Jack of Spades","",""],
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
  const [toast, setToast] = useState(null);

  const league = data.leagues[data.currentLeague];
  const isCommissioner = data.user?.name === league?.commissioner || data.user?.isCommissioner;
  const movies = league?.movies || DEFAULT_MOVIES;

  const persist = useCallback((next) => {
    setData(next);
    saveData(next);
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
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

  function updateMovieName(oldName, newName) {
    if (!newName.trim() || newName === oldName) return;
    const newMovies = movies.map(m => m === oldName ? newName.trim() : m);
    const newDraft = {};
    Object.entries(league.draft).forEach(([player, picks]) => {
      newDraft[player] = picks.map(p => p === oldName ? newName.trim() : p);
    });
    const newScoring = {};
    Object.entries(league.scoring || {}).forEach(([film, val]) => {
      newScoring[film === oldName ? newName.trim() : film] = val;
    });
    persist({
      ...data,
      leagues: {
        ...data.leagues,
        [data.currentLeague]: { ...league, movies: newMovies, draft: newDraft, scoring: newScoring },
      },
    });
    showToast("Film renamed");
  }

  function getPlayerTotal(player) {
    const picks = league.draft?.[player] || [];
    return picks.reduce((sum, film) => sum + (film ? calcFilmScore(film, league.scoring) : 0), 0);
  }

  function getAllTimeTotal(player) {
    const hist = league.historicalPoints?.[player] || {};
    const histTotal = Object.values(hist).reduce((s, v) => s + (Number(v) || 0), 0);
    return histTotal + getPlayerTotal(player);
  }

  const rankedPlayers = [...PLAYERS].sort((a, b) => getPlayerTotal(b) - getPlayerTotal(a));

  return (
    <div style={{ fontFamily: "var(--font-sans)", minHeight: "100vh", background: "#FAFAF8", color: "var(--text-primary)" }}>
      <h2 className="sr-only">Movie Fantasy League — 2026 season</h2>

      {toast && (
        <div style={{ position: "fixed", top: 16, right: 16, background: "#1A1A1A", color: "#fff", padding: "9px 14px", borderRadius: 8, fontSize: 13, zIndex: 999 }}>
          {toast}
        </div>
      )}

      <header style={{ background: "#fff", borderBottom: "0.5px solid var(--border)", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: "0.04em" }}>Film League</span>
          <span style={{ fontSize: 12, color: "var(--text-muted)", borderLeft: "0.5px solid var(--border)", paddingLeft: 10 }}>{league?.name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{data.user?.name}</span>
          {isCommissioner && <span style={{ fontSize: 11, color: GOLD, border: `0.5px solid ${GOLD}`, padding: "2px 6px", borderRadius: 4 }}>commissioner</span>}
        </div>
      </header>

      <nav style={{ background: "#fff", borderBottom: "0.5px solid var(--border)", padding: "0 1.5rem", display: "flex", gap: 0 }}>
        {["leaderboard","draft board","scoring","all time","settings"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "11px 16px", fontSize: 13, fontWeight: tab === t ? 500 : 400, color: tab === t ? "#1A1A1A" : "var(--text-muted)", borderBottom: tab === t ? "2px solid #1A1A1A" : "2px solid transparent", background: "none", border: "none", borderBottom: tab === t ? "2px solid #1A1A1A" : "2px solid transparent", cursor: "pointer" }}>{t}</button>
        ))}
      </nav>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "1.5rem" }}>
        {tab === "leaderboard" && <Leaderboard rankedPlayers={rankedPlayers} getPlayerTotal={getPlayerTotal} league={league} />}
        {tab === "draft board" && <DraftBoard league={league} movies={movies} isCommissioner={isCommissioner} updateDraftPick={updateDraftPick} calcFilmScore={calcFilmScore} getFilmOscarStatus={getFilmOscarStatus} setScoringFilm={setScoringFilm} setTab={setTab} showToast={showToast} />}
        {tab === "scoring" && <Scoring league={league} movies={movies} isCommissioner={isCommissioner} updateScoring={updateScoring} updateOscarField={updateOscarField} scoringFilm={scoringFilm} setScoringFilm={setScoringFilm} getFilmOscarStatus={getFilmOscarStatus} showToast={showToast} />}
        {tab === "all time" && <AllTime league={league} getPlayerTotal={getPlayerTotal} getAllTimeTotal={getAllTimeTotal} />}
        {tab === "settings" && <Settings league={league} movies={movies} isCommissioner={isCommissioner} updateMovieName={updateMovieName} showToast={showToast} />}
      </main>
    </div>
  );
}

function OscarBadge({ noms, wins }) {
  if (noms === 0 && wins === 0) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: GOLD_BG, border: `0.5px solid ${GOLD}`, borderRadius: 4, padding: "2px 7px", fontSize: 11, color: GOLD, fontWeight: 500 }}>
      ✦ {noms} nom{noms !== 1 ? "s" : ""}{wins > 0 ? ` · ${wins} win${wins !== 1 ? "s" : ""}` : ""}
    </span>
  );
}

function FilmCard({ film, score, status, children, compact }) {
  const isBPWinner = status?.winner;
  const isBPNom = status?.nominated;

  const style = {
    background: isBPWinner ? GOLD_BG : "#fff",
    border: isBPWinner ? `2px solid ${GOLD}` : isBPNom ? `1.5px solid ${GOLD}` : "0.5px solid var(--border)",
    borderRadius: 8,
    padding: compact ? "8px 10px" : "10px 12px",
    position: "relative",
  };

  return (
    <div style={style}>
      {isBPWinner && (
        <span style={{ position: "absolute", top: -1, right: 8, fontSize: 10, background: GOLD, color: "#fff", padding: "1px 6px", borderRadius: "0 0 4px 4px", fontWeight: 500, letterSpacing: "0.05em" }}>
          BEST PICTURE
        </span>
      )}
      {isBPNom && !isBPWinner && (
        <span style={{ position: "absolute", top: -1, right: 8, fontSize: 10, background: GOLD_BG, color: GOLD, padding: "1px 6px", borderRadius: "0 0 4px 4px", border: `0.5px solid ${GOLD}`, fontWeight: 500, letterSpacing: "0.05em" }}>
          BP NOM
        </span>
      )}
      {children}
    </div>
  );
}

function Leaderboard({ rankedPlayers, getPlayerTotal, league }) {
  const maxPts = Math.max(...rankedPlayers.map(p => getPlayerTotal(p)), 1);
  const medals = ["🥇","🥈","🥉"];

  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>2026 standings</p>
      <div style={{ display: "grid", gap: 8 }}>
        {rankedPlayers.map((player, i) => {
          const pts = getPlayerTotal(player);
          const pct = Math.round((pts / maxPts) * 100);
          const color = PLAYER_COLORS[PLAYERS.indexOf(player)];
          const { noms, wins } = getPlayerOscarTotals(player, league);
          return (
            <div key={player} style={{ background: "#fff", border: "0.5px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 16, width: 24 }}>{medals[i] || `#${i+1}`}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{player}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <OscarBadge noms={noms} wins={wins} />
                      <span style={{ fontSize: 15, fontWeight: 500, fontFamily: "var(--font-mono)" }}>{pts}</span>
                    </div>
                  </div>
                  <div style={{ height: 3, background: "var(--surface-1)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2 }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DraftBoard({ league, movies, isCommissioner, updateDraftPick, calcFilmScore, getFilmOscarStatus, setScoringFilm, setTab, showToast }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>2026 draft board</p>
      {PLAYERS.map((player, pi) => {
        const color = PLAYER_COLORS[pi];
        const picks = league.draft?.[player] || Array(9).fill("");
        const total = picks.reduce((sum, f) => sum + (f ? calcFilmScore(f, league.scoring) : 0), 0);
        return (
          <div key={player} style={{ background: "#fff", border: "0.5px solid var(--border)", borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }} />
                <span style={{ fontSize: 14, fontWeight: 500 }}>{player}</span>
              </div>
              <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{total} pts</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
              {ROUNDS.map((round, ri) => {
                const film = picks[ri] || "";
                const score = film ? calcFilmScore(film, league.scoring) : null;
                const status = film ? getFilmOscarStatus(film, league.scoring) : null;
                return (
                  <FilmCard key={round} film={film} score={score} status={status} compact>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, letterSpacing: "0.06em" }}>RD {round}</div>
                    {isCommissioner ? (
                      <select
                        value={film}
                        onChange={e => updateDraftPick(player, ri, e.target.value)}
                        style={{ width: "100%", fontSize: 12, padding: "4px 6px", borderRadius: 6, border: "0.5px solid var(--border)", background: "transparent", color: "var(--text-primary)", cursor: "pointer" }}
                      >
                        <option value="">— select —</option>
                        {movies.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    ) : (
                      <div style={{ fontSize: 12, color: film ? "var(--text-primary)" : "var(--text-muted)", minHeight: 20 }}>{film || "TBD"}</div>
                    )}
                    {film && score !== null && (
                      <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: score > 0 ? "var(--text-secondary)" : "var(--text-muted)" }}>{score} pts</span>
                        <button onClick={() => { setScoringFilm(film); setTab("scoring"); }} style={{ fontSize: 11, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>edit →</button>
                      </div>
                    )}
                  </FilmCard>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Scoring({ league, movies, isCommissioner, updateScoring, updateOscarField, scoringFilm, setScoringFilm, getFilmOscarStatus, showToast }) {
  const [film, setFilm] = useState(scoringFilm || movies[0]);
  useEffect(() => { if (scoringFilm) setFilm(scoringFilm); }, [scoringFilm]);

  const fs = league.scoring?.[film] || {};
  const total = calcFilmScore(film, league.scoring);
  const status = getFilmOscarStatus(film, league.scoring);

  function set(field, val) {
    updateScoring(film, field, val);
    showToast("Saved");
  }

  const cardStyle = { background: "#fff", border: "0.5px solid var(--border)", borderRadius: 10, padding: "16px", marginBottom: 10 };
  const labelStyle = { fontSize: 11, fontWeight: 500, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10, display: "block" };
  const selectStyle = { width: "100%", fontSize: 13, padding: "7px 8px", borderRadius: 6, border: "0.5px solid var(--border)", background: "#FAFAF8", color: "var(--text-primary)", cursor: "pointer" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, background: "#fff", border: status.winner ? `2px solid ${GOLD}` : status.nominated ? `1.5px solid ${GOLD}` : "0.5px solid var(--border)", borderRadius: 10, padding: "12px 16px" }}>
        <select value={film} onChange={e => { setFilm(e.target.value); setScoringFilm(e.target.value); }} style={{ ...selectStyle, flex: 1, maxWidth: 320, fontWeight: 500, fontSize: 14 }}>
          {movies.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <span style={{ fontSize: 18, fontWeight: 500, fontFamily: "var(--font-mono)" }}>{total} pts</span>
        {status.winner && <span style={{ fontSize: 11, background: GOLD, color: "#fff", padding: "3px 8px", borderRadius: 4, fontWeight: 500 }}>Best Picture</span>}
        {status.nominated && !status.winner && <span style={{ fontSize: 11, background: GOLD_BG, color: GOLD, padding: "3px 8px", borderRadius: 4, border: `0.5px solid ${GOLD}`, fontWeight: 500 }}>BP Nom</span>}
      </div>

      {!isCommissioner && (
        <div style={{ ...cardStyle, background: "#FAFAF8", fontSize: 13, color: "var(--text-secondary)" }}>Only the commissioner can update scores.</div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div style={cardStyle}>
          <span style={labelStyle}>Box office</span>
          <select disabled={!isCommissioner} value={fs.bo || ""} onChange={e => set("bo", e.target.value)} style={selectStyle}>
            <option value="">— select tier —</option>
            {BO_TIERS.map(t => <option key={t.label} value={t.label}>{t.label} = {t.pts} pts</option>)}
          </select>
          {fs.bo && <p style={{ marginTop: 8, fontSize: 13, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{getBOPoints(fs.bo)} pts</p>}
        </div>

        <div style={cardStyle}>
          <span style={labelStyle}>Rotten tomatoes</span>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Critics</label>
            <select disabled={!isCommissioner} value={fs.criticsRT || ""} onChange={e => set("criticsRT", e.target.value)} style={selectStyle}>
              {RT_OPTIONS.map(o => <option key={o} value={o}>{o || "— select —"}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Audience</label>
            <select disabled={!isCommissioner} value={fs.audienceRT || ""} onChange={e => set("audienceRT", e.target.value)} style={selectStyle}>
              {RT_AUD_OPTIONS.map(o => <option key={o} value={o}>{o || "— select —"}</option>)}
            </select>
          </div>
          <p style={{ marginTop: 8, fontSize: 13, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{getRTPoints(fs.criticsRT || "", fs.audienceRT || "")} pts</p>
        </div>
      </div>

      <div style={cardStyle}>
        <span style={labelStyle}>Oscar nominations & wins</span>
        <div style={{ display: "grid", gap: 6 }}>
          {OSCAR_CATEGORIES.map((cat, i) => {
            const isNominated = (fs.oscarNoms?.[i] || []).includes(film);
            const isWinner = (fs.oscarWinner?.[i] || "") === film;
            const isBP = i === 0;
            return (
              <div key={cat.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: (isNominated || isWinner) ? (isBP && isWinner ? GOLD_BG : "#FAFAF8") : "#FAFAF8", borderRadius: 6, border: (isNominated || isWinner) ? (isBP ? `1px solid ${GOLD}` : "0.5px solid var(--border-strong)") : "0.5px solid var(--border)" }}>
                <div>
                  <span style={{ fontSize: 13 }}>{cat.name}</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>nom {cat.nomPts} / win {cat.winPts}</span>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-secondary)", cursor: isCommissioner ? "pointer" : "default" }}>
                    <input type="checkbox" disabled={!isCommissioner} checked={isNominated} onChange={e => {
                      const cur = fs.oscarNoms?.[i] || [];
                      const next = e.target.checked ? [...cur, film] : cur.filter(f => f !== film);
                      updateOscarField(film, "oscarNoms", i, next);
                      showToast("Saved");
                    }} />
                    Nom
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-secondary)", cursor: isCommissioner ? "pointer" : "default" }}>
                    <input type="checkbox" disabled={!isCommissioner} checked={isWinner} onChange={e => {
                      updateOscarField(film, "oscarWinner", i, e.target.checked ? film : "");
                      showToast("Saved");
                    }} />
                    Win
                  </label>
                  {(isNominated || isWinner) && (
                    <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: GOLD, fontWeight: 500 }}>
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

function AllTime({ league, getPlayerTotal, getAllTimeTotal }) {
  const sorted = [...PLAYERS].sort((a, b) => getAllTimeTotal(b) - getAllTimeTotal(a));
  const medals = ["🥇","🥈","🥉"];

  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>all-time standings</p>
      <div style={{ background: "#fff", border: "0.5px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "0.5px solid var(--border)", background: "#FAFAF8" }}>
              <th style={{ padding: "10px 16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 400, width: 32 }}></th>
              <th style={{ padding: "10px 16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 400 }}>Player</th>
              {YEARS.map(y => <th key={y} style={{ padding: "10px 16px", textAlign: "center", color: "var(--text-muted)", fontWeight: 400 }}>{y}</th>)}
              <th style={{ padding: "10px 16px", textAlign: "center", color: "var(--text-primary)", fontWeight: 500 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((player, i) => {
              const color = PLAYER_COLORS[PLAYERS.indexOf(player)];
              return (
                <tr key={player} style={{ borderBottom: "0.5px solid var(--border)" }}>
                  <td style={{ padding: "10px 16px", fontSize: 16 }}>{medals[i] || `#${i+1}`}</td>
                  <td style={{ padding: "10px 16px", fontWeight: 500 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
                      {player}
                    </span>
                  </td>
                  {YEARS.map(y => {
                    const pts = y === "2026" ? getPlayerTotal(player) : (league.historicalPoints?.[player]?.[y] || 0);
                    return (
                      <td key={y} style={{ padding: "10px 16px", textAlign: "center", fontFamily: "var(--font-mono)", color: pts > 0 ? "var(--text-primary)" : "var(--text-muted)" }}>
                        {pts > 0 ? pts : "—"}
                      </td>
                    );
                  })}
                  <td style={{ padding: "10px 16px", textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 500 }}>
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

function Settings({ league, movies, isCommissioner, updateMovieName, showToast }) {
  const [editing, setEditing] = useState(null);
  const [editVal, setEditVal] = useState("");

  if (!isCommissioner) return (
    <div style={{ background: "#fff", border: "0.5px solid var(--border)", borderRadius: 10, padding: 16, fontSize: 13, color: "var(--text-secondary)" }}>
      Only the commissioner can edit settings.
    </div>
  );

  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>edit film names</p>
      <div style={{ background: "#fff", border: "0.5px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
        {movies.map((film, i) => (
          <div key={film} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", borderBottom: i < movies.length - 1 ? "0.5px solid var(--border)" : "none", background: i % 2 === 0 ? "#fff" : "#FAFAF8" }}>
            {editing === film ? (
              <>
                <input
                  value={editVal}
                  onChange={e => setEditVal(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") { updateMovieName(film, editVal); setEditing(null); }
                    if (e.key === "Escape") setEditing(null);
                  }}
                  autoFocus
                  style={{ flex: 1, fontSize: 13, padding: "4px 8px", borderRadius: 6, border: "0.5px solid var(--border-strong)", background: "#fff" }}
                />
                <button onClick={() => { updateMovieName(film, editVal); setEditing(null); }} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, border: "0.5px solid var(--border)", background: "#fff", cursor: "pointer" }}>Save</button>
                <button onClick={() => setEditing(null)} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, border: "0.5px solid var(--border)", background: "#fff", cursor: "pointer", color: "var(--text-muted)" }}>Cancel</button>
              </>
            ) : (
              <>
                <span style={{ flex: 1, fontSize: 13 }}>{film}</span>
                <button onClick={() => { setEditing(film); setEditVal(film); }} style={{ fontSize: 12, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: "2px 6px" }}>rename</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
