import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://rudchnnifyfkkrkikmfw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1ZGNobm5pZnlma2tya2lrbWZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4ODU2NjIsImV4cCI6MjEwMTQ2MTY2Mn0.Y_lrwiFLPVuv51pGd2Pge3RMZMSwkhpZ5AaYa7Xexoo";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LEAGUE_ID = "demo2026";

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
  { label: "$3bn+",  pts: 74 }, { label: "$2.9bn", pts: 68 },
  { label: "$2.8bn", pts: 64 }, { label: "$2.7bn", pts: 60 },
  { label: "$2.6bn", pts: 56 }, { label: "$2.5bn", pts: 54 },
  { label: "$2.4bn", pts: 50 }, { label: "$2.3bn", pts: 48 },
  { label: "$2.2bn", pts: 46 }, { label: "$2.1bn", pts: 44 },
  { label: "$2bn",   pts: 44 }, { label: "$1.9bn", pts: 40 },
  { label: "$1.8bn", pts: 38 }, { label: "$1.7bn", pts: 37 },
  { label: "$1.6bn", pts: 36 }, { label: "$1.5bn", pts: 36 },
  { label: "$1.4bn", pts: 32 }, { label: "$1.3bn", pts: 30 },
  { label: "$1.2bn", pts: 28 }, { label: "$1.1bn", pts: 26 },
  { label: "$1bn",   pts: 24 }, { label: "$900m",  pts: 20 },
  { label: "$800m",  pts: 18 }, { label: "$700m",  pts: 16 },
  { label: "$600m",  pts: 14 }, { label: "$500m",  pts: 12 },
  { label: "$400m",  pts:  8 }, { label: "$300m",  pts:  6 },
  { label: "$200m",  pts:  4 }, { label: "$100m",  pts:  2 },
];

const RT_OPTIONS     = ["", "90%+ (7pts)", "Fresh 60-89% (2pts)", "Rotten (0pts)"];
const RT_AUD_OPTIONS = ["", "90%+ (5pts)", "Below 90% (0pts)"];
const PLAYERS = ["Ryan Williams","Illike","Walker","Nook","Ben Hillman","Chrinny","Ben E","IRobis"];
const ROUNDS  = ["1","2","3","4","5","6","7","S1","S2"];
const YEARS   = ["2023","2024","2025","2026"];
const PLAYER_COLORS = ["#4A90D9","#A855F7","#22C55E","#F97316","#94A3B8","#EC4899","#EF4444","#14B8A6"];
const GOLD = "#C9A84C";

const HISTORICAL = {
  "Ryan Williams": { "2023": 37,  "2024": 97,  "2025": 104 },
  "Illike":        { "2023": 48,  "2024": 77,  "2025": 106 },
  "Walker":        { "2023": 0,   "2024": 0,   "2025": 61  },
  "Nook":          { "2023": 74,  "2024": 134, "2025": 79  },
  "Ben Hillman":   { "2023": 35,  "2024": 111, "2025": 103 },
  "Chrinny":       { "2023": 0,   "2024": 0,   "2025": 144 },
  "Ben E":         { "2023": 23,  "2024": 58,  "2025": 136 },
  "IRobis":        { "2023": 0,   "2024": 0,   "2025": 113 },
};

const THEMES = {
  light: {
    bg: "#F7F5F0", surface: "#FFFFFF", surface2: "#F0EDE6",
    border: "#D4CFC4", borderStrong: "#B8B0A0",
    text: "#1A1714", textSub: "#4A4540", textMuted: "#8C8078",
    header: "#FFFFFF", navActive: "#1A1714", navInactive: "#8C8078",
    gold: GOLD, goldBg: "#FBF5E6", selectBg: "#F0EDE6", rowAlt: "#FAF8F5",
  },
  dark: {
    bg: "#0A0A0A", surface: "#141414", surface2: "#1E1E1E",
    border: "#2A2A2A", borderStrong: "#3A3A3A",
    text: "#F0EDE8", textSub: "#A8A29E", textMuted: "#6B6560",
    header: "#0F0F0F", navActive: GOLD, navInactive: "#6B6560",
    gold: GOLD, goldBg: "#1E1A0E", selectBg: "#1E1E1E", rowAlt: "#161616",
  },
};

function getRTPoints(c, a) {
  let p = 0;
  if (c === "90%+ (7pts)") p += 7;
  else if (c === "Fresh 60-89% (2pts)") p += 2;
  if (a === "90%+ (5pts)") p += 5;
  return p;
}
function getBOPoints(label) { return BO_TIERS.find(t => t.label === label)?.pts || 0; }

function calcFilmScore(film, scoring) {
  if (!film || !scoring) return 0;
  const fs = scoring[film]; if (!fs) return 0;
  let total = getBOPoints(fs.bo || "") + getRTPoints(fs.criticsRT || "", fs.audienceRT || "");
  OSCAR_CATEGORIES.forEach((cat, i) => {
    if ((fs.oscarNoms?.[i] || []).includes(film)) total += cat.nomPts;
    if ((fs.oscarWinner?.[i] || "") === film) total += cat.winPts;
  });
  if (scoring._biggestOpeningFilm === film) total += 1;
  if (scoring._mostNumber1Film === film) total += 1;
  return total;
}

function getFilmOscarStatus(film, scoring) {
  const fs = scoring?.[film];
  if (!fs) return { nominated: false, winner: false, totalNoms: 0, totalWins: 0 };
  let totalNoms = 0, totalWins = 0;
  OSCAR_CATEGORIES.forEach((_, i) => {
    if ((fs.oscarNoms?.[i] || []).includes(film)) totalNoms++;
    if ((fs.oscarWinner?.[i] || "") === film) totalWins++;
  });
  return {
    nominated: (fs.oscarNoms?.[0] || []).includes(film),
    winner: (fs.oscarWinner?.[0] || "") === film,
    totalNoms, totalWins,
  };
}

function getPlayerOscarTotals(player, draft, scoring) {
  let noms = 0, wins = 0;
  (draft[player] || []).forEach(film => {
    if (!film) return;
    const s = getFilmOscarStatus(film, scoring);
    noms += s.totalNoms; wins += s.totalWins;
  });
  return { noms, wins };
}

// ── Supabase helpers ──────────────────────────────────────────────────────────
async function dbGetDraft() {
  const { data } = await supabase.from("draft_picks").select("*").eq("league_id", LEAGUE_ID);
  const draft = {};
  PLAYERS.forEach(p => { draft[p] = Array(9).fill(""); });
  (data || []).forEach(row => {
    if (draft[row.player_name]) draft[row.player_name][row.round_index] = row.film || "";
  });
  return draft;
}

async function dbSetDraftPick(player, roundIdx, film) {
  await supabase.from("draft_picks").upsert(
    { league_id: LEAGUE_ID, player_name: player, round_index: roundIdx, film },
    { onConflict: "league_id,player_name,round_index" }
  );
}

async function dbGetScores() {
  const { data } = await supabase.from("scores").select("*").eq("league_id", LEAGUE_ID);
  const scoring = {};
  (data || []).forEach(row => { scoring[row.film] = row.data; });
  return scoring;
}

async function dbSetScore(film, data) {
  await supabase.from("scores").upsert(
    { league_id: LEAGUE_ID, film, data, updated_at: new Date().toISOString() },
    { onConflict: "league_id,film" }
  );
}

async function dbGetMovies() {
  const { data } = await supabase.from("movies").select("title").eq("league_id", LEAGUE_ID).order("created_at");
  if (!data || data.length === 0) {
    // Seed default movies on first load
    await supabase.from("movies").insert(DEFAULT_MOVIES.map(title => ({ league_id: LEAGUE_ID, title })));
    return [...DEFAULT_MOVIES];
  }
  return data.map(r => r.title);
}

async function dbAddMovie(title) {
  await supabase.from("movies").insert({ league_id: LEAGUE_ID, title });
}

async function dbRenameMovie(oldTitle, newTitle) {
  await supabase.from("movies").update({ title: newTitle }).eq("league_id", LEAGUE_ID).eq("title", oldTitle);
  await supabase.from("draft_picks").update({ film: newTitle }).eq("league_id", LEAGUE_ID).eq("film", oldTitle);
  // Update score key
  const { data } = await supabase.from("scores").select("data").eq("league_id", LEAGUE_ID).eq("film", oldTitle).single();
  if (data) {
    await supabase.from("scores").upsert({ league_id: LEAGUE_ID, film: newTitle, data: data.data, updated_at: new Date().toISOString() }, { onConflict: "league_id,film" });
    await supabase.from("scores").delete().eq("league_id", LEAGUE_ID).eq("film", oldTitle);
  }
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [draft, setDraft] = useState(() => { const d = {}; PLAYERS.forEach(p => { d[p] = Array(9).fill(""); }); return d; });
  const [scoring, setScoring] = useState({});
  const [movies, setMovies] = useState([...DEFAULT_MOVIES]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [tab, setTab] = useState("leaderboard");
  const [scoringFilm, setScoringFilm] = useState(null);
  const [draftFocusPlayer, setDraftFocusPlayer] = useState(null);
  const [toast, setToast] = useState(null);

  const t = darkMode ? THEMES.dark : THEMES.light;
  const isCommissioner = true; // Will be replaced with auth in Phase 3

  // Load all data from Supabase on mount
  useEffect(() => {
    async function load() {
      setLoading(true);
      const [draftData, scoreData, movieData] = await Promise.all([
        dbGetDraft(), dbGetScores(), dbGetMovies()
      ]);
      setDraft(draftData);
      setScoring(scoreData);
      setMovies(movieData);
      setLoading(false);
    }
    load();

    // Subscribe to real-time changes
    const scoreSub = supabase.channel("scores").on("postgres_changes",
      { event: "*", schema: "public", table: "scores", filter: `league_id=eq.${LEAGUE_ID}` },
      () => dbGetScores().then(setScoring)
    ).subscribe();

    const draftSub = supabase.channel("draft").on("postgres_changes",
      { event: "*", schema: "public", table: "draft_picks", filter: `league_id=eq.${LEAGUE_ID}` },
      () => dbGetDraft().then(setDraft)
    ).subscribe();

    const movieSub = supabase.channel("movies").on("postgres_changes",
      { event: "*", schema: "public", table: "movies", filter: `league_id=eq.${LEAGUE_ID}` },
      () => dbGetMovies().then(setMovies)
    ).subscribe();

    return () => { scoreSub.unsubscribe(); draftSub.unsubscribe(); movieSub.unsubscribe(); };
  }, []);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2000); }
  function toggleDark() { setDarkMode(d => { localStorage.setItem("darkMode", !d); return !d; }); }

  async function updateDraftPick(player, roundIdx, film) {
    setDraft(prev => ({ ...prev, [player]: prev[player].map((v, i) => i === roundIdx ? film : v) }));
    await dbSetDraftPick(player, roundIdx, film);
  }

  async function updateScoring(film, field, value) {
    const updated = { ...(scoring[film] || {}), [field]: value };
    setScoring(prev => ({ ...prev, [film]: updated }));
    await dbSetScore(film, updated);
    showToast("Saved");
  }

  async function updateScoringRoot(field, value) {
    const updated = { ...(scoring[field] !== undefined ? scoring : scoring), [field]: value };
    // Store global bonuses as a special "_meta" score row
    const meta = { ...(scoring["_meta"] || {}), [field]: value };
    setScoring(prev => ({ ...prev, _meta: meta, [field]: value }));
    await dbSetScore("_meta", meta);
    showToast("Saved");
  }

  async function updateOscarField(film, field, catIndex, value) {
    const arr = [...((scoring[film]?.[field]) || [])];
    arr[catIndex] = value;
    await updateScoring(film, field, arr);
  }

  async function addMovie(title) {
    if (!title.trim() || movies.includes(title.trim())) return;
    setMovies(prev => [...prev, title.trim()]);
    await dbAddMovie(title.trim());
    showToast("Film added");
  }

  async function updateMovieName(oldName, newName) {
    if (!newName.trim() || newName === oldName) return;
    const n = newName.trim();
    setMovies(prev => prev.map(m => m === oldName ? n : m));
    setDraft(prev => {
      const next = {};
      Object.entries(prev).forEach(([p, picks]) => { next[p] = picks.map(pk => pk === oldName ? n : pk); });
      return next;
    });
    setScoring(prev => {
      const next = { ...prev };
      if (next[oldName]) { next[n] = next[oldName]; delete next[oldName]; }
      return next;
    });
    await dbRenameMovie(oldName, n);
    showToast("Film renamed");
  }

  // Merge _meta bonuses into scoring for score calculation
  const scoringWithMeta = { ...scoring, ...scoring["_meta"] };

  function getPlayerTotal(player) {
    return (draft[player] || []).reduce((sum, film) => sum + (film ? calcFilmScore(film, scoringWithMeta) : 0), 0);
  }
  function getAllTimeTotal(player) {
    const hist = Object.values(HISTORICAL[player] || {}).reduce((s, v) => s + (Number(v) || 0), 0);
    return hist + getPlayerTotal(player);
  }

  function goToPlayerDraft(player) { setDraftFocusPlayer(player); setTab("draft board"); }
  function goToFilmScoring(film) { setScoringFilm(film); setTab("scoring"); }

  const rankedPlayers = [...PLAYERS].sort((a, b) => getPlayerTotal(b) - getPlayerTotal(a));

  const css = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: ${t.bg}; }
    select { appearance: none; -webkit-appearance: none; }
    input[type=checkbox] { accent-color: ${t.gold}; width: 15px; height: 15px; cursor: pointer; }
    .clickable:hover { opacity: 0.75; }
  `;

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: t.bg, color: t.textMuted, fontFamily: "system-ui", fontSize: 14 }}>
      Loading league data…
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", background: t.bg, color: t.text }}>
      <style>{css}</style>
      <h2 className="sr-only">Movie Fantasy League — 2026 season</h2>

      {toast && (
        <div style={{ position: "fixed", top: 16, right: 16, background: t.gold, color: darkMode ? "#0A0A0A" : "#fff", padding: "9px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500, zIndex: 999 }}>
          {toast}
        </div>
      )}

      <header style={{ background: t.header, borderBottom: `0.5px solid ${t.border}`, padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 54 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: t.gold }}>🎬</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>Film League</span>
          <span style={{ fontSize: 12, color: t.textMuted, borderLeft: `0.5px solid ${t.border}`, paddingLeft: 10 }}>The 2026 Film League</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: t.gold, border: `0.5px solid ${t.gold}`, padding: "2px 7px", borderRadius: 4 }}>commissioner</span>
          <button onClick={toggleDark} style={{ background: t.surface2, border: `0.5px solid ${t.border}`, borderRadius: 6, padding: "5px 10px", fontSize: 12, color: t.textSub, cursor: "pointer" }}>
            {darkMode ? "☀ Light" : "☾ Dark"}
          </button>
        </div>
      </header>

      <nav style={{ background: t.header, borderBottom: `0.5px solid ${t.border}`, padding: "0 1.5rem", display: "flex" }}>
        {["leaderboard","draft board","scoring","all time","settings"].map(tb => (
          <button key={tb} onClick={() => setTab(tb)} style={{ padding: "12px 16px", fontSize: 13, fontWeight: tab === tb ? 600 : 400, color: tab === tb ? t.navActive : t.navInactive, borderBottom: tab === tb ? `2px solid ${t.navActive}` : "2px solid transparent", background: "none", border: "none", borderBottom: tab === tb ? `2px solid ${t.navActive}` : "2px solid transparent", cursor: "pointer" }}>{tb}</button>
        ))}
      </nav>

      <main style={{ maxWidth: 880, margin: "0 auto", padding: "1.5rem" }}>
        {tab === "leaderboard" && <Leaderboard rankedPlayers={rankedPlayers} getPlayerTotal={getPlayerTotal} draft={draft} scoring={scoringWithMeta} t={t} goToPlayerDraft={goToPlayerDraft} />}
        {tab === "draft board" && <DraftBoard draft={draft} movies={movies} isCommissioner={isCommissioner} updateDraftPick={updateDraftPick} scoring={scoringWithMeta} goToFilmScoring={goToFilmScoring} t={t} focusPlayer={draftFocusPlayer} />}
        {tab === "scoring"     && <Scoring scoring={scoringWithMeta} rawScoring={scoring} movies={movies} isCommissioner={isCommissioner} updateScoring={updateScoring} updateScoringRoot={updateScoringRoot} updateOscarField={updateOscarField} scoringFilm={scoringFilm} setScoringFilm={setScoringFilm} showToast={showToast} t={t} />}
        {tab === "all time"    && <AllTime getPlayerTotal={getPlayerTotal} getAllTimeTotal={getAllTimeTotal} t={t} />}
        {tab === "settings"    && <Settings movies={movies} isCommissioner={isCommissioner} updateMovieName={updateMovieName} addMovie={addMovie} t={t} />}
      </main>
    </div>
  );
}

function SectionLabel({ children, t }) {
  return <p style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>{children}</p>;
}
function Card({ children, t, style = {} }) {
  return <div style={{ background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 10, padding: "14px 16px", ...style }}>{children}</div>;
}
function OscarBadge({ noms, wins, t }) {
  if (!noms && !wins) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: t.goldBg, border: `0.5px solid ${t.gold}`, borderRadius: 4, padding: "2px 8px", fontSize: 11, color: t.gold, fontWeight: 600 }}>
      ✦ {noms} nom{noms !== 1 ? "s" : ""}{wins > 0 ? ` · ${wins} win${wins !== 1 ? "s" : ""}` : ""}
    </span>
  );
}

function Leaderboard({ rankedPlayers, getPlayerTotal, draft, scoring, t, goToPlayerDraft }) {
  const maxPts = Math.max(...rankedPlayers.map(p => getPlayerTotal(p)), 1);
  const medals = ["🥇","🥈","🥉"];
  return (
    <div>
      <SectionLabel t={t}>2026 standings · click a name to view their draft</SectionLabel>
      <div style={{ display: "grid", gap: 8 }}>
        {rankedPlayers.map((player, i) => {
          const pts = getPlayerTotal(player);
          const pct = Math.round((pts / maxPts) * 100);
          const color = PLAYER_COLORS[PLAYERS.indexOf(player)];
          const { noms, wins } = getPlayerOscarTotals(player, draft, scoring);
          return (
            <Card key={player} t={t}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>{medals[i] || `#${i+1}`}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                    <button className="clickable" onClick={() => goToPlayerDraft(player)} style={{ fontSize: 14, fontWeight: 600, color: t.text, background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline", textDecorationColor: t.border, textUnderlineOffset: 3 }}>
                      {player}
                    </button>
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

function DraftBoard({ draft, movies, isCommissioner, updateDraftPick, scoring, goToFilmScoring, t, focusPlayer }) {
  const sel = { width: "100%", fontSize: 12, padding: "5px 7px", borderRadius: 6, border: `0.5px solid ${t.border}`, background: t.selectBg, color: t.text, cursor: "pointer" };

  useEffect(() => {
    if (focusPlayer) {
      const el = document.getElementById(`player-${focusPlayer.replace(/\s/g, "-")}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [focusPlayer]);

  return (
    <div>
      <SectionLabel t={t}>2026 draft board</SectionLabel>
      {PLAYERS.map((player, pi) => {
        const color = PLAYER_COLORS[pi];
        const picks = draft[player] || Array(9).fill("");
        const total = picks.reduce((s, f) => s + (f ? calcFilmScore(f, scoring) : 0), 0);
        const isFocused = focusPlayer === player;
        return (
          <Card key={player} t={t} style={{ marginBottom: 10, borderLeft: `3px solid ${color}`, outline: isFocused ? `2px solid ${t.gold}` : "none", outlineOffset: 2 }}>
            <div id={`player-${player.replace(/\s/g, "-")}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{player}</span>
              <span style={{ fontSize: 13, fontFamily: "monospace", color: t.gold, fontWeight: 600 }}>{total} pts</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: 8 }}>
              {ROUNDS.map((round, ri) => {
                const film = picks[ri] || "";
                const score = film ? calcFilmScore(film, scoring) : null;
                const status = film ? getFilmOscarStatus(film, scoring) : {};
                const { nominated, winner } = status;
                return (
                  <div key={round} style={{ position: "relative", background: winner ? t.goldBg : t.surface2, border: winner ? `2px solid ${t.gold}` : nominated ? `1.5px solid ${t.gold}` : `0.5px solid ${t.border}`, borderRadius: 8, padding: "8px 10px" }}>
                    {winner && <span style={{ position: "absolute", top: -1, right: 6, fontSize: 9, background: t.gold, color: "#fff", padding: "1px 5px", borderRadius: "0 0 4px 4px", fontWeight: 700 }}>BEST PIC ✦</span>}
                    {nominated && !winner && <span style={{ position: "absolute", top: -1, right: 6, fontSize: 9, background: t.goldBg, color: t.gold, padding: "1px 5px", borderRadius: "0 0 4px 4px", border: `0.5px solid ${t.gold}`, fontWeight: 600 }}>BP NOM</span>}
                    <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 5, fontWeight: 600, letterSpacing: "0.06em" }}>RD {round}</div>
                    {isCommissioner ? (
                      <select value={film} onChange={e => updateDraftPick(player, ri, e.target.value)} style={sel}>
                        <option value="">— select —</option>
                        {movies.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    ) : (
                      <div style={{ fontSize: 12, color: film ? t.text : t.textMuted, minHeight: 22 }}>{film || "TBD"}</div>
                    )}
                    {film && score !== null && (
                      <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, fontFamily: "monospace", color: t.textSub }}>{score} pts</span>
                        <button onClick={() => goToFilmScoring(film)} style={{ fontSize: 11, color: t.gold, background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600 }}>scoring →</button>
                      </div>
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

function Scoring({ scoring, rawScoring, movies, isCommissioner, updateScoring, updateScoringRoot, updateOscarField, scoringFilm, setScoringFilm, showToast, t }) {
  const [film, setFilm] = useState(scoringFilm || movies[0]);
  useEffect(() => { if (scoringFilm) setFilm(scoringFilm); }, [scoringFilm]);

  const fs = scoring[film] || {};
  const total = calcFilmScore(film, scoring);
  const status = getFilmOscarStatus(film, scoring);
  const biggestOpening = scoring._biggestOpeningFilm || "";
  const mostNumber1 = scoring._mostNumber1Film || "";

  function set(field, val) { updateScoring(film, field, val); }

  const sel = { width: "100%", fontSize: 13, padding: "8px 10px", borderRadius: 7, border: `0.5px solid ${t.border}`, background: t.selectBg, color: t.text, cursor: "pointer" };
  const lbl = { fontSize: 11, fontWeight: 600, color: t.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 6 };

  return (
    <div>
      <div style={{ background: status.winner ? t.goldBg : t.surface, border: status.winner ? `2px solid ${t.gold}` : status.nominated ? `1.5px solid ${t.gold}` : `0.5px solid ${t.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
        <select value={film} onChange={e => { setFilm(e.target.value); setScoringFilm(e.target.value); }} style={{ ...sel, flex: 1, maxWidth: 340, fontWeight: 600, fontSize: 14 }}>
          {movies.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "monospace", color: t.gold }}>{total}</span>
        {status.winner && <span style={{ fontSize: 11, background: t.gold, color: "#fff", padding: "3px 9px", borderRadius: 5, fontWeight: 700 }}>BEST PICTURE ✦</span>}
        {status.nominated && !status.winner && <span style={{ fontSize: 11, background: t.goldBg, color: t.gold, padding: "3px 9px", borderRadius: 5, border: `0.5px solid ${t.gold}`, fontWeight: 600 }}>BP NOM</span>}
      </div>

      {!isCommissioner && <Card t={t} style={{ marginBottom: 10, fontSize: 13, color: t.textSub }}>Only the commissioner can update scores.</Card>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <Card t={t}>
          <span style={lbl}>Box office</span>
          <select disabled={!isCommissioner} value={fs.bo || ""} onChange={e => set("bo", e.target.value)} style={sel}>
            <option value="">— select tier —</option>
            {BO_TIERS.map(tier => <option key={tier.label} value={tier.label}>{tier.label} = {tier.pts} pts</option>)}
          </select>
          {fs.bo && <p style={{ marginTop: 8, fontSize: 13, color: t.gold, fontFamily: "monospace", fontWeight: 600 }}>{getBOPoints(fs.bo)} pts</p>}
        </Card>
        <Card t={t}>
          <span style={lbl}>Rotten tomatoes</span>
          <label style={{ fontSize: 12, color: t.textMuted, display: "block", marginBottom: 4 }}>Critics</label>
          <select disabled={!isCommissioner} value={fs.criticsRT || ""} onChange={e => set("criticsRT", e.target.value)} style={{ ...sel, marginBottom: 8 }}>
            {RT_OPTIONS.map(o => <option key={o} value={o}>{o || "— select —"}</option>)}
          </select>
          <label style={{ fontSize: 12, color: t.textMuted, display: "block", marginBottom: 4 }}>Audience</label>
          <select disabled={!isCommissioner} value={fs.audienceRT || ""} onChange={e => set("audienceRT", e.target.value)} style={sel}>
            {RT_AUD_OPTIONS.map(o => <option key={o} value={o}>{o || "— select —"}</option>)}
          </select>
          <p style={{ marginTop: 8, fontSize: 13, color: t.gold, fontFamily: "monospace", fontWeight: 600 }}>{getRTPoints(fs.criticsRT || "", fs.audienceRT || "")} pts</p>
        </Card>
      </div>

      <Card t={t} style={{ marginBottom: 10 }}>
        <span style={lbl}>Season bonuses · +1 pt each · one film only</span>
        <div style={{ display: "grid", gap: 8 }}>
          {[
            { label: "Biggest Opening Weekend", key: "_biggestOpeningFilm", val: biggestOpening },
            { label: "Most #1 Box Office Weeks", key: "_mostNumber1Film", val: mostNumber1 },
          ].map(({ label, key, val }) => {
            const isChecked = val === film;
            return (
              <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: isChecked ? t.goldBg : t.surface2, borderRadius: 8, border: isChecked ? `1px solid ${t.gold}` : `0.5px solid ${t.border}` }}>
                <div>
                  <span style={{ fontSize: 13, color: t.text, fontWeight: 500 }}>{label}</span>
                  {val && val !== film && <span style={{ fontSize: 11, color: t.textMuted, marginLeft: 8 }}>currently: {val}</span>}
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: isChecked ? t.gold : t.textSub, fontWeight: isChecked ? 600 : 400, cursor: isCommissioner ? "pointer" : "default" }}>
                  <input type="checkbox" disabled={!isCommissioner} checked={isChecked} onChange={e => updateScoringRoot(key, e.target.checked ? film : "")} />
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
                  <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: t.textSub, cursor: isCommissioner ? "pointer" : "default" }}>
                    <input type="checkbox" disabled={!isCommissioner} checked={isNom} onChange={e => {
                      const cur = fs.oscarNoms?.[i] || [];
                      updateOscarField(film, "oscarNoms", i, e.target.checked ? [...cur, film] : cur.filter(f => f !== film));
                    }} /> Nom
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: t.textSub, cursor: isCommissioner ? "pointer" : "default" }}>
                    <input type="checkbox" disabled={!isCommissioner} checked={isWin} onChange={e => {
                      updateOscarField(film, "oscarWinner", i, e.target.checked ? film : "");
                    }} /> Win
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

function AllTime({ getPlayerTotal, getAllTimeTotal, t }) {
  const sorted = [...PLAYERS].sort((a, b) => getAllTimeTotal(b) - getAllTimeTotal(a));
  const medals = ["🥇","🥈","🥉"];
  const th = { padding: "10px 16px", textAlign: "center", color: t.textMuted, fontWeight: 400, fontSize: 13, borderBottom: `0.5px solid ${t.border}` };
  return (
    <div>
      <SectionLabel t={t}>all-time standings</SectionLabel>
      <div style={{ background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: t.surface2 }}>
              <th style={{ ...th, textAlign: "left", width: 40 }}></th>
              <th style={{ ...th, textAlign: "left" }}>Player</th>
              {YEARS.map(y => <th key={y} style={th}>{y}</th>)}
              <th style={{ ...th, color: t.gold, fontWeight: 600 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((player, i) => {
              const color = PLAYER_COLORS[PLAYERS.indexOf(player)];
              return (
                <tr key={player} style={{ borderBottom: `0.5px solid ${t.border}`, background: i % 2 === 0 ? t.surface : t.rowAlt }}>
                  <td style={{ padding: "11px 16px", fontSize: 16 }}>{medals[i] || `#${i+1}`}</td>
                  <td style={{ padding: "11px 16px", fontWeight: 600, color: t.text }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 9, height: 9, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
                      {player}
                    </span>
                  </td>
                  {YEARS.map(y => {
                    const pts = y === "2026" ? getPlayerTotal(player) : (HISTORICAL[player]?.[y] || 0);
                    return <td key={y} style={{ padding: "11px 16px", textAlign: "center", fontFamily: "monospace", color: pts > 0 ? t.text : t.textMuted }}>{pts > 0 ? pts : "—"}</td>;
                  })}
                  <td style={{ padding: "11px 16px", textAlign: "center", fontFamily: "monospace", fontWeight: 700, color: t.gold }}>{getAllTimeTotal(player)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Settings({ movies, isCommissioner, updateMovieName, addMovie, t }) {
  const [editing, setEditing] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [newFilm, setNewFilm] = useState("");
  const [search, setSearch] = useState("");

  if (!isCommissioner) return <Card t={t} style={{ fontSize: 13, color: t.textSub }}>Only the commissioner can edit settings.</Card>;

  const filtered = movies.filter(m => m.toLowerCase().includes(search.toLowerCase()));
  const inputStyle = { fontSize: 13, padding: "7px 10px", borderRadius: 7, border: `0.5px solid ${t.borderStrong}`, background: t.surface2, color: t.text };

  return (
    <div>
      <SectionLabel t={t}>add a new film</SectionLabel>
      <Card t={t} style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={newFilm} onChange={e => setNewFilm(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && newFilm.trim()) { addMovie(newFilm); setNewFilm(""); } }}
            placeholder="Film title..." style={{ ...inputStyle, flex: 1 }} />
          <button onClick={() => { if (newFilm.trim()) { addMovie(newFilm); setNewFilm(""); } }}
            style={{ fontSize: 13, padding: "7px 16px", borderRadius: 7, border: "none", background: t.gold, color: "#fff", cursor: "pointer", fontWeight: 600 }}>
            Add film
          </button>
        </div>
      </Card>

      <SectionLabel t={t}>edit film names</SectionLabel>
      <Card t={t} style={{ marginBottom: 10 }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setEditing(null); }}
          placeholder="Search films..." style={{ ...inputStyle, width: "100%" }} />
        {search && <p style={{ fontSize: 11, color: t.textMuted, marginTop: 6 }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>}
      </Card>

      {filtered.length > 0 && (
        <div style={{ background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 10, overflow: "hidden" }}>
          {filtered.map((film, i) => (
            <div key={film} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", borderBottom: i < filtered.length - 1 ? `0.5px solid ${t.border}` : "none", background: i % 2 === 0 ? t.surface : t.rowAlt }}>
              {editing === film ? (
                <>
                  <input value={editVal} onChange={e => setEditVal(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { updateMovieName(film, editVal); setEditing(null); setSearch(""); } if (e.key === "Escape") setEditing(null); }}
                    autoFocus style={{ flex: 1, fontSize: 13, padding: "5px 9px", borderRadius: 6, border: `0.5px solid ${t.borderStrong}`, background: t.surface2, color: t.text }} />
                  <button onClick={() => { updateMovieName(film, editVal); setEditing(null); setSearch(""); }} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "none", background: t.gold, color: "#fff", cursor: "pointer", fontWeight: 600 }}>Save</button>
                  <button onClick={() => setEditing(null)} style={{ fontSize: 12, padding: "5px 10px", borderRadius: 6, border: `0.5px solid ${t.border}`, background: "transparent", color: t.textMuted, cursor: "pointer" }}>Cancel</button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1, fontSize: 13, color: t.text }}>{film}</span>
                  <button onClick={() => { setEditing(film); setEditVal(film); }} style={{ fontSize: 12, color: t.gold, background: "none", border: "none", cursor: "pointer", padding: "2px 6px" }}>rename</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      {search && filtered.length === 0 && (
        <p style={{ fontSize: 13, color: t.textMuted, textAlign: "center", padding: "20px 0" }}>No films match "{search}"</p>
      )}
    </div>
  );
}
