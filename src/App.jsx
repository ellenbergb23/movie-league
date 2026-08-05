import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://rudchnnifyfkkrkikmfw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1ZGNobm5pZnlma2tya2lrbWZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4ODU2NjIsImV4cCI6MjEwMTQ2MTY2Mn0.Y_lrwiFLPVuv51pGd2Pge3RMZMSwkhpZ5AaYa7Xexoo";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const LEAGUE_ID = "demo2026";
const COMMISSIONER_EMAIL = "ellenbergb23@gmail.com";
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || "";

const DEFAULT_PLAYERS = ["Ryan Williams","Illike","Walker","Nook","Ben Hillman","Chrinny","Ben E","IRobis"];
const ROUNDS = ["1","2","3","4","5","6","7","S1","S2"];
const YEARS  = ["2023","2024","2025","2026"];
const PLAYER_COLORS = ["#4A90D9","#A855F7","#22C55E","#F97316","#94A3B8","#EC4899","#EF4444","#14B8A6"];
const GOLD = "#C9A84C";

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
    red: "#B71C1C", redBg: "#FFEBEE",
  },
  dark: {
    bg: "#0A0A0A", surface: "#141414", surface2: "#1E1E1E",
    border: "#2A2A2A", borderStrong: "#3A3A3A",
    text: "#F0EDE8", textSub: "#A8A29E", textMuted: "#6B6560",
    header: "#0F0F0F", navActive: GOLD, navInactive: "#6B6560",
    gold: GOLD, goldBg: "#1E1A0E", selectBg: "#1E1E1E", rowAlt: "#161616",
    red: "#EF5350", redBg: "#1A0A0A",
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

function isFilmReleased(film, scoring) {
  const fs = scoring?.[film];
  if (!fs) return false;
  // Dynamic: released if ANY scoring field currently has a value. Clearing all fields reverts to "Unreleased".
  if (fs.bo) return true;
  if (fs.criticsRT) return true;
  if (fs.audienceRT) return true;
  if ((fs.oscarNoms || []).some(arr => (arr || []).length > 0)) return true;
  if ((fs.oscarWinner || []).some(w => w)) return true;
  return false;
}

// ── TMDB helpers ──────────────────────────────────────────────────────────
async function searchTMDB(query) {
  if (!TMDB_API_KEY) return [];
  try {
    // Search across all years to find posters, then filter for recent films
    const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&sort_by=popularity.desc`);
    const data = await res.json();
    const ALLOWED_YEARS = ["2025", "2026", "2027"];
    return (data.results || [])
      .filter(r => r.poster_path) // Only include movies WITH posters
      .filter(r => r.release_date && ALLOWED_YEARS.includes(r.release_date.slice(0, 4))) // Only 2025/2026/2027 releases
      .slice(0, 5)
      .map(r => ({
        title: r.title,
        poster_path: r.poster_path,
        poster: `https://image.tmdb.org/t/p/w200${r.poster_path}`,
        release_date: r.release_date || "",
        tmdbId: r.id,
      }));
  } catch (e) {
    console.error("TMDB search failed:", e);
    return [];
  }
}

// ── Supabase helpers ──────────────────────────────────────────────────────────
async function dbGet(key) {
  const { data } = await supabase.from("settings").select("value").eq("league_id", LEAGUE_ID).eq("key", key).single();
  return data?.value;
}
async function dbSet(key, value) {
  await supabase.from("settings").upsert({ league_id: LEAGUE_ID, key, value }, { onConflict: "league_id,key" });
}
async function dbGetPlayers() {
  const v = await dbGet("players");
  return v ? JSON.parse(v) : [...DEFAULT_PLAYERS];
}
async function dbGetLeagueName() { return (await dbGet("league_name")) || "The 2026 Film League"; }
async function dbGetMarxistMode() { return (await dbGet("marxist_mode")) === "true"; }
async function dbSetMarxistMode(val) { await dbSet("marxist_mode", String(val)); }
async function dbGetDraft(players) {
  const { data } = await supabase.from("draft_picks").select("*").eq("league_id", LEAGUE_ID);
  const draft = {};
  players.forEach(p => { draft[p] = Array(9).fill(""); });
  (data || []).forEach(row => { if (draft[row.player_name] !== undefined) draft[row.player_name][row.round_index] = row.film || ""; });
  return draft;
}
async function dbSetDraftPick(player, roundIdx, film) {
  await supabase.from("draft_picks").upsert({ league_id: LEAGUE_ID, player_name: player, round_index: roundIdx, film }, { onConflict: "league_id,player_name,round_index" });
}
async function dbGetScores() {
  const { data } = await supabase.from("scores").select("*").eq("league_id", LEAGUE_ID);
  const scoring = {};
  (data || []).forEach(row => { scoring[row.film] = row.data; });
  return scoring;
}
async function dbSetScore(film, data) {
  await supabase.from("scores").upsert({ league_id: LEAGUE_ID, film, data, updated_at: new Date().toISOString() }, { onConflict: "league_id,film" });
}
async function dbGetMovies() {
  const { data } = await supabase.from("movies").select("title").eq("league_id", LEAGUE_ID).order("created_at");
  return data?.map(r => r.title) || [];
}
async function dbAddMovie(title) { await supabase.from("movies").insert({ league_id: LEAGUE_ID, title }); }
async function dbDeleteMovie(title) {
  await supabase.from("movies").delete().eq("league_id", LEAGUE_ID).eq("title", title);
  await supabase.from("scores").delete().eq("league_id", LEAGUE_ID).eq("film", title);
}
async function dbRenameMovie(oldTitle, newTitle) {
  await supabase.from("movies").update({ title: newTitle }).eq("league_id", LEAGUE_ID).eq("title", oldTitle);
  await supabase.from("draft_picks").update({ film: newTitle }).eq("league_id", LEAGUE_ID).eq("film", oldTitle);
  const { data } = await supabase.from("scores").select("data").eq("league_id", LEAGUE_ID).eq("film", oldTitle).single();
  if (data) {
    await supabase.from("scores").upsert({ league_id: LEAGUE_ID, film: newTitle, data: data.data, updated_at: new Date().toISOString() }, { onConflict: "league_id,film" });
    await supabase.from("scores").delete().eq("league_id", LEAGUE_ID).eq("film", oldTitle);
  }
}
async function dbRenamePlayer(oldName, newName, players) {
  await supabase.from("draft_picks").update({ player_name: newName }).eq("league_id", LEAGUE_ID).eq("player_name", oldName);
  const newPlayers = players.map(p => p === oldName ? newName : p);
  await dbSet("players", JSON.stringify(newPlayers));
  await supabase.from("users").update({ player_name: newName }).eq("league_id", LEAGUE_ID).eq("player_name", oldName);
  return newPlayers;
}
async function dbGetLeagueUsers() {
  const { data } = await supabase.from("users").select("*").eq("league_id", LEAGUE_ID);
  return data || [];
}
async function dbAssignPlayer(userId, playerName) {
  await supabase.from("users").update({ player_name: playerName }).eq("id", userId);
}
async function dbGetCurrentUser(userId) {
  const { data } = await supabase.from("users").select("*").eq("id", userId).single();
  return data;
}

// ── Auth components ───────────────────────────────────────────────────────────
function AuthModal({ t, onAuth, onClose }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(""); setLoading(true);
    if (mode === "login") {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) { setError(err.message); setLoading(false); return; }
      onAuth(data.user);
    } else {
      const { data, error: err } = await supabase.auth.signUp({ email, password });
      if (err) { setError(err.message); setLoading(false); return; }
      if (data.user) {
        await supabase.from("users").upsert({ id: data.user.id, email, league_id: LEAGUE_ID, player_name: null }, { onConflict: "id" });
        onAuth(data.user);
      }
    }
    setLoading(false);
  }

  const inp = { width: "100%", fontSize: 14, padding: "10px 12px", borderRadius: 8, border: `0.5px solid ${t.border}`, background: t.surface2, color: t.text, marginBottom: 12 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div style={{ width: 360, background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 16, padding: 32 }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 4 }}>Sign in to edit</h2>
          <p style={{ fontSize: 13, color: t.textMuted }}>Fantasy Film League · 2026</p>
        </div>
        <div style={{ display: "flex", marginBottom: 20, background: t.surface2, borderRadius: 8, padding: 3 }}>
          {["login","signup"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); }} style={{ flex: 1, padding: "7px 0", fontSize: 13, fontWeight: mode === m ? 600 : 400, color: mode === m ? t.text : t.textMuted, background: mode === m ? t.surface : "transparent", border: "none", borderRadius: 6, cursor: "pointer" }}>
              {m === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inp} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} style={{ ...inp, marginBottom: error ? 8 : 16 }} />
        {error && <p style={{ fontSize: 12, color: t.red, marginBottom: 12 }}>{error}</p>}
        <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", padding: "11px 0", fontSize: 14, fontWeight: 600, color: "#fff", background: t.gold, border: "none", borderRadius: 8, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "…" : mode === "login" ? "Log in" : "Create account"}
        </button>
        {mode === "signup" && <p style={{ fontSize: 12, color: t.textMuted, textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>After signing up, the commissioner will assign you to your team.</p>}
      </div>
    </div>
  );
}

function WaitingPage({ t, user, onSignOut }) {
  return (
    <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ width: 360, background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 16, padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: t.text, marginBottom: 8 }}>Waiting for team assignment</h2>
        <p style={{ fontSize: 13, color: t.textMuted, lineHeight: 1.6, marginBottom: 24 }}>You're signed in as <strong>{user.email}</strong>. The commissioner will assign you to your team shortly.</p>
        <button onClick={onSignOut} style={{ fontSize: 13, color: t.textMuted, background: "none", border: `0.5px solid ${t.border}`, borderRadius: 6, padding: "7px 16px", cursor: "pointer" }}>Sign out</button>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [authUser, setAuthUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [players, setPlayers] = useState([...DEFAULT_PLAYERS]);
  const [draft, setDraft] = useState(() => { const d = {}; DEFAULT_PLAYERS.forEach(p => { d[p] = Array(9).fill(""); }); return d; });
  const [scoring, setScoring] = useState({});
  const [movies, setMovies] = useState([]);
  const [leagueName, setLeagueName] = useState("The 2026 Film League");
  const [marxistMode, setMarxistMode] = useState(false);
  const [leagueUsers, setLeagueUsers] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [tab, setTab] = useState("leaderboard");
  const [scoringFilm, setScoringFilm] = useState(null);
  const [draftFocusPlayer, setDraftFocusPlayer] = useState(null);
  const [toast, setToast] = useState(null);

  const t = darkMode ? THEMES.dark : THEMES.light;
  const isCommissioner = authUser?.email === COMMISSIONER_EMAIL;
  const myPlayerName = dbUser?.player_name || null;
  const isAssigned = !!myPlayerName;

  // canEdit: true if marxist mode is on, OR if user is commissioner, OR if user is assigned
  const canEdit = marxistMode || isCommissioner || isAssigned;
  // canEditOwn: can edit their own team name only
  const canEditOwn = canEdit;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user || null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authUser) { setDbUser(null); return; }
    dbGetCurrentUser(authUser.id).then(setDbUser);
  }, [authUser]);

  useEffect(() => {
    async function load() {
      setDataLoading(true);
      const [name, loadedPlayers, movieData, scoreData, usersData, marxist] = await Promise.all([
        dbGetLeagueName(), dbGetPlayers(), dbGetMovies(), dbGetScores(), dbGetLeagueUsers(), dbGetMarxistMode()
      ]);
      setLeagueName(name);
      setPlayers(loadedPlayers);
      setMovies(movieData);
      setScoring(scoreData);
      setLeagueUsers(usersData);
      setMarxistMode(marxist);
      const draftData = await dbGetDraft(loadedPlayers);
      setDraft(draftData);
      setDataLoading(false);
    }
    load();

    const scoreSub = supabase.channel("sc").on("postgres_changes", { event: "*", schema: "public", table: "scores", filter: `league_id=eq.${LEAGUE_ID}` }, () => dbGetScores().then(setScoring)).subscribe();
    const draftSub = supabase.channel("dr").on("postgres_changes", { event: "*", schema: "public", table: "draft_picks", filter: `league_id=eq.${LEAGUE_ID}` }, async () => { const p = await dbGetPlayers(); setPlayers(p); setDraft(await dbGetDraft(p)); }).subscribe();
    const movieSub = supabase.channel("mv").on("postgres_changes", { event: "*", schema: "public", table: "movies", filter: `league_id=eq.${LEAGUE_ID}` }, () => dbGetMovies().then(setMovies)).subscribe();
    const settingsSub = supabase.channel("st").on("postgres_changes", { event: "*", schema: "public", table: "settings", filter: `league_id=eq.${LEAGUE_ID}` }, async () => {
      setLeagueName(await dbGetLeagueName());
      const p = await dbGetPlayers(); setPlayers(p);
      setMarxistMode(await dbGetMarxistMode());
    }).subscribe();
    const usersSub = supabase.channel("us").on("postgres_changes", { event: "*", schema: "public", table: "users", filter: `league_id=eq.${LEAGUE_ID}` }, async () => {
      setLeagueUsers(await dbGetLeagueUsers());
      if (authUser) setDbUser(await dbGetCurrentUser(authUser.id));
    }).subscribe();

    return () => { scoreSub.unsubscribe(); draftSub.unsubscribe(); movieSub.unsubscribe(); settingsSub.unsubscribe(); usersSub.unsubscribe(); };
  }, [authUser]);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2000); }
  function toggleDark() { setDarkMode(d => { localStorage.setItem("darkMode", !d); return !d; }); }
  async function signOut() { await supabase.auth.signOut(); setAuthUser(null); setDbUser(null); }

  function requireAuth(action) {
    if (marxistMode || isCommissioner || isAssigned) { action(); }
    else { setShowAuthModal(true); }
  }

  async function toggleMarxistMode() {
    const next = !marxistMode;
    setMarxistMode(next);
    await dbSetMarxistMode(next);
    showToast(next ? "☭ Marxist Mode enabled" : "Marxist Mode disabled");
  }

  async function updateLeagueName(name) { setLeagueName(name); await dbSet("league_name", name); showToast("Saved"); }

  async function renamePlayer(oldName, newName) {
    if (!newName.trim() || newName === oldName) return;
    const n = newName.trim();
    const newPlayers = await dbRenamePlayer(oldName, n, players);
    setPlayers(newPlayers);
    setDraft(prev => { const next = { ...prev }; next[n] = next[oldName]; delete next[oldName]; return next; });
    showToast("Player renamed");
  }

  async function assignPlayer(userId, playerName) {
    await dbAssignPlayer(userId, playerName);
    setLeagueUsers(prev => prev.map(u => u.id === userId ? { ...u, player_name: playerName } : u));
    showToast("Player assigned");
  }

  async function updateScoring(film, field, value) {
    const updated = { ...(scoring[film] || {}), [field]: value };
    setScoring(prev => ({ ...prev, [film]: updated }));
    await dbSetScore(film, updated);
    showToast("Saved");
  }
  async function updateScoringRoot(field, value) {
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
  async function updateDraftPick(player, roundIdx, film) {
    setDraft(prev => ({ ...prev, [player]: prev[player].map((v, i) => i === roundIdx ? film : v) }));
    await dbSetDraftPick(player, roundIdx, film);
  }
  async function addMovie(title, poster_path) {
    if (!title.trim() || movies.includes(title.trim())) return;
    const trimmedTitle = title.trim();
    setMovies(prev => [...prev, trimmedTitle]);
    await dbAddMovie(trimmedTitle);
    // Merge poster data with any existing scoring (never overwrite existing scores)
    if (poster_path) {
      const mergedData = { ...(scoring[trimmedTitle] || {}), poster_path };
      setScoring(prev => ({ ...prev, [trimmedTitle]: mergedData }));
      await dbSetScore(trimmedTitle, mergedData);
    }
    showToast("Film added");
  }
  async function updateMovieName(oldName, newName) {
    if (!newName.trim() || newName === oldName) return;
    const n = newName.trim();
    setMovies(prev => prev.map(m => m === oldName ? n : m));
    setDraft(prev => { const next = {}; Object.entries(prev).forEach(([p, picks]) => { next[p] = picks.map(pk => pk === oldName ? n : pk); }); return next; });
    setScoring(prev => { const next = { ...prev }; if (next[oldName]) { next[n] = next[oldName]; delete next[oldName]; } return next; });
    await dbRenameMovie(oldName, n);
    showToast("Film renamed");
  }

  async function deleteMovie(title) {
    setMovies(prev => prev.filter(m => m !== title));
    setScoring(prev => { const next = { ...prev }; delete next[title]; return next; });
    await dbDeleteMovie(title);
    showToast("Film removed");
  }

  async function backfillPosters(onProgress, force = false) {
    let updated = 0, skipped = 0;
    const notFound = [];
    for (let i = 0; i < movies.length; i++) {
      const film = movies[i];
      if (onProgress) onProgress(i + 1, movies.length, film);
      if (!force && scoring[film]?.poster_path) { skipped++; continue; }
      const results = await searchTMDB(film);
      // Only accept EXACT title matches (case-insensitive) — never guess with a similar/popular title
      const exactMatches = results.filter(r => r.title.trim().toLowerCase() === film.trim().toLowerCase());
      // Among exact matches, prefer a 2025/2026 release if there's more than one (e.g. remakes, old miniseries with the same name)
      const best = exactMatches.find(r => ["2025", "2026", "2027"].includes(r.release_date?.slice(0, 4))) || exactMatches[0];
      if (best) {
        const updatedData = { ...(scoring[film] || {}), poster_path: best.poster_path };
        setScoring(prev => ({ ...prev, [film]: updatedData }));
        await dbSetScore(film, updatedData);
        updated++;
      } else {
        notFound.push(film);
      }
      await new Promise(r => setTimeout(r, 300)); // avoid hammering TMDB
    }
    showToast(`Posters: ${updated} added · ${skipped} already had one · ${notFound.length} not found`);
    return { updated, skipped, notFound };
  }

  const scoringWithMeta = { ...scoring, ...(scoring["_meta"] || {}) };

  function getPlayerTotal(player) {
    return (draft[player] || []).reduce((sum, film) => sum + (film ? calcFilmScore(film, scoringWithMeta) : 0), 0);
  }

  function goToPlayerDraft(player) { setDraftFocusPlayer(player); setTab("draft board"); }
  function goToFilmScoring(film) { setScoringFilm(film); setTab("scoring"); }

  const rankedPlayers = [...players].sort((a, b) => getPlayerTotal(b) - getPlayerTotal(a));

  const css = `* { box-sizing: border-box; margin: 0; padding: 0; } body { background: ${t.bg}; } select { appearance: none; -webkit-appearance: none; } input[type=checkbox] { accent-color: ${t.gold}; width: 15px; height: 15px; cursor: pointer; } .clickable:hover { opacity: 0.75; }`;

  if (authLoading || dataLoading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: t.bg, color: t.textMuted, fontFamily: "system-ui", fontSize: 14 }}>Loading…</div>;

  // Only show waiting page if logged in but not yet assigned (and not commissioner)
  if (authUser && !isCommissioner && !isAssigned) return <WaitingPage t={t} user={authUser} onSignOut={signOut} />;

  const tabs = ["leaderboard","draft board","scoring","settings"];
  if (isCommissioner) tabs.push("commissioner");

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", background: t.bg, color: t.text }}>
      <style>{css}</style>

      {showAuthModal && <AuthModal t={t} onAuth={user => { setAuthUser(user); setShowAuthModal(false); }} onClose={() => setShowAuthModal(false)} />}
      {toast && <div style={{ position: "fixed", top: 16, right: 16, background: t.gold, color: darkMode ? "#0A0A0A" : "#fff", padding: "9px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500, zIndex: 999 }}>{toast}</div>}

      <header style={{ background: t.header, borderBottom: `0.5px solid ${t.border}`, padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 54 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: t.gold }}>🎬</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>Fantasy Film League</span>
          <span style={{ fontSize: 12, color: t.textMuted, borderLeft: `0.5px solid ${t.border}`, paddingLeft: 10 }}>{leagueName}</span>
          {marxistMode && isCommissioner && <span style={{ fontSize: 11, color: t.red, border: `0.5px solid ${t.red}`, padding: "2px 7px", borderRadius: 4, fontWeight: 600 }}>☭ Marxist Mode</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {authUser ? (
            <>
              <span style={{ fontSize: 12, color: t.textSub }}>{myPlayerName || (isCommissioner ? "Commissioner" : authUser.email)}</span>
              {isCommissioner && <span style={{ fontSize: 11, color: t.gold, border: `0.5px solid ${t.gold}`, padding: "2px 7px", borderRadius: 4 }}>commissioner</span>}
              <button onClick={signOut} style={{ background: "none", border: `0.5px solid ${t.border}`, borderRadius: 6, padding: "5px 10px", fontSize: 12, color: t.textMuted, cursor: "pointer" }}>Sign out</button>
            </>
          ) : (
            <button onClick={() => setShowAuthModal(true)} style={{ background: "none", border: `0.5px solid ${t.border}`, borderRadius: 6, padding: "5px 12px", fontSize: 12, color: t.textSub, cursor: "pointer" }}>Log in</button>
          )}
          <button onClick={toggleDark} style={{ background: t.surface2, border: `0.5px solid ${t.border}`, borderRadius: 6, padding: "5px 10px", fontSize: 12, color: t.textSub, cursor: "pointer" }}>{darkMode ? "☀" : "☾"}</button>
        </div>
      </header>

      <nav style={{ background: t.header, borderBottom: `0.5px solid ${t.border}`, padding: "0 1.5rem", display: "flex" }}>
        {tabs.map(tb => (
          <button key={tb} onClick={() => setTab(tb)} style={{ padding: "12px 16px", fontSize: 13, fontWeight: tab === tb ? 600 : 400, color: tab === tb ? t.navActive : tb === "commissioner" ? t.gold : t.navInactive, borderBottom: tab === tb ? `2px solid ${tab === "commissioner" ? t.gold : t.navActive}` : "2px solid transparent", background: "none", border: "none", borderBottom: tab === tb ? `2px solid ${tab === "commissioner" ? t.gold : t.navActive}` : "2px solid transparent", cursor: "pointer" }}>{tb}</button>
        ))}
      </nav>

      <main style={{ maxWidth: 880, margin: "0 auto", padding: "1.5rem" }}>
        {tab === "leaderboard"  && <Leaderboard rankedPlayers={rankedPlayers} getPlayerTotal={getPlayerTotal} draft={draft} scoring={scoringWithMeta} t={t} goToPlayerDraft={goToPlayerDraft} />}
        {tab === "draft board"  && <DraftBoard draft={draft} players={players} movies={movies} canEdit={canEdit} isCommissioner={isCommissioner} marxistMode={marxistMode} updateDraftPick={updateDraftPick} requireAuth={requireAuth} scoring={scoringWithMeta} goToFilmScoring={goToFilmScoring} t={t} focusPlayer={draftFocusPlayer} addMovie={addMovie} />}
        {tab === "scoring"      && <Scoring scoring={scoringWithMeta} movies={movies} canEdit={canEdit} isCommissioner={isCommissioner} requireAuth={requireAuth} updateScoring={updateScoring} updateScoringRoot={updateScoringRoot} updateOscarField={updateOscarField} updateMovieName={updateMovieName} scoringFilm={scoringFilm} setScoringFilm={setScoringFilm} showToast={showToast} t={t} />}
        {tab === "settings"     && <Settings movies={movies} players={players} canEdit={canEdit} myPlayerName={myPlayerName} marxistMode={marxistMode} updateMovieName={updateMovieName} addMovie={addMovie} renamePlayer={renamePlayer} t={t} showToast={showToast} requireAuth={requireAuth} isCommissioner={isCommissioner} searchTMDB={searchTMDB} scoring={scoringWithMeta} />}
        {tab === "commissioner" && isCommissioner && <CommissionerSettings leagueName={leagueName} updateLeagueName={updateLeagueName} marxistMode={marxistMode} toggleMarxistMode={toggleMarxistMode} leagueUsers={leagueUsers} players={players} assignPlayer={assignPlayer} t={t} showToast={showToast} movies={movies} backfillPosters={backfillPosters} scoring={scoringWithMeta} deleteMovie={deleteMovie} />}
      </main>
    </div>
  );
}

function SL({ children, t }) {
  return <p style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>{children}</p>;
}
function Card({ children, t, style = {} }) {
  return <div style={{ background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 10, padding: "14px 16px", ...style }}>{children}</div>;
}
function OscarBadge({ noms, wins, t }) {
  if (!noms && !wins) return null;
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: t.goldBg, border: `0.5px solid ${t.gold}`, borderRadius: 4, padding: "2px 8px", fontSize: 11, color: t.gold, fontWeight: 600 }}>✦ {noms} nom{noms !== 1 ? "s" : ""}{wins > 0 ? ` · ${wins} win${wins !== 1 ? "s" : ""}` : ""}</span>;
}

function Poster({ film, scoring, size = "small", t }) {
  const fs = scoring?.[film];
  const poster_path = fs?.poster_path;
  const poster_url = poster_path ? `https://image.tmdb.org/t/p/w200${poster_path}` : null;
  
  const sizes = { mini: { width: 26, height: 39 }, small: { width: 60, height: 90 }, large: { width: 100, height: 150 } };
  const dimensions = sizes[size] || sizes.small;
  
  if (poster_url) {
    return <img src={poster_url} alt={film} style={{ ...dimensions, borderRadius: 4, objectFit: "cover", flexShrink: 0 }} />;
  }
  return <div style={{ ...dimensions, background: "#000", borderRadius: 4, flexShrink: 0 }} />;
}

function Leaderboard({ rankedPlayers, getPlayerTotal, draft, scoring, t, goToPlayerDraft }) {
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

function DraftBoard({ draft, players, movies, canEdit, isCommissioner, marxistMode, updateDraftPick, requireAuth, scoring, goToFilmScoring, t, focusPlayer, addMovie }) {
  const sel = { width: "100%", fontSize: 11, padding: "4px 6px", borderRadius: 6, border: `0.5px solid ${t.border}`, background: t.selectBg, color: t.text, cursor: "pointer" };
  const [editingSlot, setEditingSlot] = useState(null); // `${player}-${roundIndex}` or null
  const [swapQuery, setSwapQuery] = useState("");
  const [tmdbSwapResults, setTmdbSwapResults] = useState([]);
  const [tmdbSwapLoading, setTmdbSwapLoading] = useState(false);

  async function handleSwapQueryChange(value) {
    setSwapQuery(value);
    if (!value.trim()) { setTmdbSwapResults([]); return; }
    setTmdbSwapLoading(true);
    const results = await searchTMDB(value);
    setTmdbSwapResults(results);
    setTmdbSwapLoading(false);
  }

  function selectNewFilm(title, poster_path, player, ri) {
    addMovie(title, poster_path); // safe no-op if it already exists
    updateDraftPick(player, ri, title);
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
  return (
    <div>
      <SL t={t}>2026 draft board</SL>
      {players.map((player, pi) => {
        const color = PLAYER_COLORS[pi % PLAYER_COLORS.length];
        const picks = draft[player] || Array(9).fill("");
        const total = picks.reduce((s, f) => s + (f ? calcFilmScore(f, scoring) : 0), 0);
        const isFocused = focusPlayer === player;
        return (
          <Card key={player} t={t} style={{ marginBottom: 10, borderLeft: `3px solid ${color}`, outline: isFocused ? `2px solid ${t.gold}` : "none", outlineOffset: 2 }}>
            <div id={`player-${player.replace(/\s/g, "-")}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{player}</span>
              <span style={{ fontSize: 13, fontFamily: "monospace", color: t.gold, fontWeight: 600 }}>{total} pts</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8 }}>
              {picks.map((film, ri) => {
                const round = ["1","2","3","4","5","6","7","S1","S2"][ri];
                const score = film ? calcFilmScore(film, scoring) : null;
                const status = film ? getFilmOscarStatus(film, scoring) : {};
                const { nominated, winner } = status;
                const slotKey = `${player}-${ri}`;
                const isEditing = editingSlot === slotKey;
                return (
                  <div key={ri} style={{ position: "relative", display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ position: "relative", background: winner ? t.goldBg : t.surface2, border: winner ? `2px solid ${t.gold}` : nominated ? `1.5px solid ${t.gold}` : `0.5px solid ${t.border}`, borderRadius: 8, padding: "8px", minHeight: 145 }}>
                      {winner && <span style={{ position: "absolute", top: -1, right: 3, fontSize: 8, background: t.gold, color: "#fff", padding: "1px 4px", borderRadius: "0 0 3px 3px", fontWeight: 700 }}>BP ✦</span>}
                      {nominated && !winner && <span style={{ position: "absolute", top: -1, right: 3, fontSize: 8, background: t.goldBg, color: t.gold, padding: "1px 4px", borderRadius: "0 0 3px 3px", border: `0.5px solid ${t.gold}`, fontWeight: 600 }}>NOM</span>}
                      <div style={{ fontSize: 9, color: t.textMuted, marginBottom: 4, fontWeight: 600, letterSpacing: "0.06em" }}>RD {round}</div>
                      <div style={{ fontSize: 10, color: t.text, fontWeight: 600, marginBottom: 4, textAlign: "center", lineHeight: 1.2, height: 36, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {film || <span style={{ color: t.textMuted, fontWeight: 400 }}>TBD</span>}
                      </div>
                      {film ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
                          <Poster film={film} scoring={scoring} size="small" t={t} />
                          {score !== null && (
                            <div style={{ width: "100%", textAlign: "center" }}>
                              {isFilmReleased(film, scoring) ? (
                                <span style={{ fontSize: 10, fontFamily: "monospace", color: t.textSub, fontWeight: 600 }}>{score} {score === 1 ? "Point" : "Points"}</span>
                              ) : (
                                <span style={{ fontSize: 10, color: t.textMuted, fontStyle: "italic" }}>Unreleased</span>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ width: 60, height: 90, margin: "0 auto", background: t.surface, border: `1px dashed ${t.border}`, borderRadius: 4 }} />
                      )}
                    </div>
                    {canEdit && (isCommissioner || marxistMode) && (
                      isEditing ? (
                        <div style={{ position: "relative" }}>
                          <input
                            autoFocus
                            value={swapQuery}
                            onChange={e => handleSwapQueryChange(e.target.value)}
                            onBlur={() => setTimeout(() => { setEditingSlot(null); setSwapQuery(""); setTmdbSwapResults([]); }, 150)}
                            onKeyDown={e => { if (e.key === "Escape") { setEditingSlot(null); setSwapQuery(""); setTmdbSwapResults([]); } }}
                            placeholder="Search films…"
                            style={sel}
                          />
                          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 6, marginTop: 2, zIndex: 20, maxHeight: 260, overflowY: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                            {movies.filter(m => m.toLowerCase().includes(swapQuery.toLowerCase())).length > 0 && (
                              <div style={{ fontSize: 9, color: t.textMuted, fontWeight: 700, letterSpacing: "0.06em", padding: "5px 7px 2px", textTransform: "uppercase" }}>In your league</div>
                            )}
                            {movies.filter(m => m.toLowerCase().includes(swapQuery.toLowerCase())).slice(0, 5).map(m => (
                              <div key={m} onMouseDown={() => { updateDraftPick(player, ri, m); setEditingSlot(null); setSwapQuery(""); setTmdbSwapResults([]); }} style={{ display: "flex", gap: 6, alignItems: "center", padding: "5px 7px", cursor: "pointer", fontSize: 10, color: t.text, borderBottom: `0.5px solid ${t.border}` }} onMouseEnter={e => e.currentTarget.style.background = t.surface2} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
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
                            {film && (
                              <div onMouseDown={() => { updateDraftPick(player, ri, ""); setEditingSlot(null); setSwapQuery(""); setTmdbSwapResults([]); }} style={{ padding: "6px 7px", cursor: "pointer", fontSize: 10, color: t.textMuted, fontStyle: "italic" }}>— clear pick —</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingSlot(slotKey); setSwapQuery(""); }} style={{ fontSize: 9, color: t.textMuted, background: "none", border: `0.5px solid ${t.border}`, borderRadius: 4, cursor: "pointer", padding: "2px 6px", fontWeight: 600 }}>
                          {film ? "swap" : "set film"}
                        </button>
                      )
                    )}
                    {film && (
                      <button onClick={() => goToFilmScoring(film)} style={{ fontSize: 9, color: t.gold, background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600 }}>scoring →</button>
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

function Scoring({ scoring, movies, canEdit, isCommissioner, requireAuth, updateScoring, updateScoringRoot, updateOscarField, updateMovieName, scoringFilm, setScoringFilm, showToast, t }) {
  const [film, setFilm] = useState(scoringFilm || movies[0]);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState("");
  useEffect(() => { if (scoringFilm) setFilm(scoringFilm); }, [scoringFilm]);

  const fs = scoring[film] || {};
  const total = calcFilmScore(film, scoring);
  const status = getFilmOscarStatus(film, scoring);
  const biggestOpening = scoring._biggestOpeningFilm || "";
  const mostNumber1 = scoring._mostNumber1Film || "";

  function withAuth(fn) { if (canEdit) fn(); else requireAuth(fn); }
  function set(field, val) { withAuth(() => updateScoring(film, field, val)); }

  const sel = { width: "100%", fontSize: 13, padding: "8px 10px", borderRadius: 7, border: `0.5px solid ${t.border}`, background: t.selectBg, color: t.text, cursor: canEdit ? "pointer" : "default" };
  const lbl = { fontSize: 11, fontWeight: 600, color: t.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 6 };

  return (
    <div>
      <div style={{ background: status.winner ? t.goldBg : t.surface, border: status.winner ? `2px solid ${t.gold}` : status.nominated ? `1.5px solid ${t.gold}` : `0.5px solid ${t.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: renaming ? 10 : 0 }}>
          <Poster film={film} scoring={scoring} size="large" t={t} />
          <div style={{ flex: 1 }}>
            <select value={film} onChange={e => { setFilm(e.target.value); setScoringFilm(e.target.value); setRenaming(false); }} style={{ ...sel, width: "100%", fontWeight: 600, fontSize: 14, cursor: "pointer", marginBottom: 8 }}>
              {movies.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
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
            <input value={renameVal} onChange={e => setRenameVal(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { updateMovieName(film, renameVal); setFilm(renameVal); setScoringFilm(renameVal); setRenaming(false); } if (e.key === "Escape") setRenaming(false); }} autoFocus style={{ flex: 1, fontSize: 13, padding: "6px 10px", borderRadius: 6, border: `0.5px solid ${t.borderStrong}`, background: t.surface2, color: t.text }} />
            <button onClick={() => { updateMovieName(film, renameVal); setFilm(renameVal); setScoringFilm(renameVal); setRenaming(false); }} style={{ fontSize: 12, padding: "6px 14px", borderRadius: 6, border: "none", background: t.gold, color: "#fff", cursor: "pointer", fontWeight: 600 }}>Save</button>
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

function Settings({ movies, players, canEdit, myPlayerName, marxistMode, updateMovieName, addMovie, renamePlayer, t, showToast, requireAuth, isCommissioner, searchTMDB, scoring }) {
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [playerVal, setPlayerVal] = useState("");
  const [editingFilm, setEditingFilm] = useState(null);
  const [filmVal, setFilmVal] = useState("");
  const [newFilm, setNewFilm] = useState("");
  const [search, setSearch] = useState("");
  const [tmdbSearchResults, setTmdbSearchResults] = useState([]);
  const [tmdbSearchQuery, setTmdbSearchQuery] = useState("");
  const [showTmdbResults, setShowTmdbResults] = useState(false);
  const [tmdbLoading, setTmdbLoading] = useState(false);

  const filtered = movies.filter(m => m.toLowerCase().includes(search.toLowerCase()));
  const inp = { fontSize: 13, padding: "7px 10px", borderRadius: 7, border: `0.5px solid ${t.borderStrong}`, background: t.surface2, color: t.text };

  function withAuth(fn) { if (canEdit) fn(); else requireAuth(fn); }

  async function handleTmdbSearch(query) {
    if (!query.trim()) { setTmdbSearchResults([]); setShowTmdbResults(false); return; }
    setTmdbLoading(true);
    const results = await searchTMDB(query);
    setTmdbSearchResults(results);
    setShowTmdbResults(true);
    setTmdbLoading(false);
  }

  function selectTmdbFilm(title, poster_path) {
    setNewFilm(title);
    setShowTmdbResults(false);
    setTmdbSearchQuery("");
    // Store poster data for this film
    if (poster_path) {
      sessionStorage.setItem(`poster_${title}`, poster_path);
    }
  }

  return (
    <div>
      <SL t={t}>your team name</SL>
      <div style={{ background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
        {players.map((player, i) => {
          const isMe = player === myPlayerName;
          const canRename = isMe || isCommissioner || marxistMode;
          return (
            <div key={player} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", borderBottom: i < players.length - 1 ? `0.5px solid ${t.border}` : "none", background: isMe ? t.goldBg : i % 2 === 0 ? t.surface : t.rowAlt }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: PLAYER_COLORS[i % PLAYER_COLORS.length], display: "inline-block", flexShrink: 0 }} />
              {editingPlayer === player ? (
                <>
                  <input value={playerVal} onChange={e => setPlayerVal(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { renamePlayer(player, playerVal); setEditingPlayer(null); } if (e.key === "Escape") setEditingPlayer(null); }} autoFocus style={{ flex: 1, fontSize: 13, padding: "5px 9px", borderRadius: 6, border: `0.5px solid ${t.borderStrong}`, background: t.surface2, color: t.text }} />
                  <button onClick={() => { renamePlayer(player, playerVal); setEditingPlayer(null); }} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "none", background: t.gold, color: "#fff", cursor: "pointer", fontWeight: 600 }}>Save</button>
                  <button onClick={() => setEditingPlayer(null)} style={{ fontSize: 12, padding: "5px 10px", borderRadius: 6, border: `0.5px solid ${t.border}`, background: "transparent", color: t.textMuted, cursor: "pointer" }}>Cancel</button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1, fontSize: 13, color: t.text, fontWeight: isMe ? 600 : 400 }}>{player}{isMe && <span style={{ fontSize: 11, color: t.gold, marginLeft: 8 }}>· you</span>}</span>
                  {canRename && <button onClick={() => withAuth(() => { setEditingPlayer(player); setPlayerVal(player); })} style={{ fontSize: 12, color: t.gold, background: "none", border: "none", cursor: "pointer", padding: "2px 6px" }}>rename</button>}
                </>
              )}
            </div>
          );
        })}
      </div>

      <SL t={t}>film management</SL>
      <Card t={t} style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, position: "relative" }}>
          <input 
            value={newFilm} 
            onChange={e => { 
              setNewFilm(e.target.value); 
              if (e.target.value.trim()) {
                setTmdbSearchQuery(e.target.value);
                handleTmdbSearch(e.target.value);
              }
            }} 
            onKeyDown={e => { if (e.key === "Enter" && newFilm.trim()) { withAuth(() => { addMovie(newFilm); setNewFilm(""); setShowTmdbResults(false); }); } }} 
            placeholder="Search films or add manually..." 
            style={{ ...inp, flex: 1 }} 
          />
          <button onClick={() => { if (newFilm.trim()) withAuth(() => { const poster_path = sessionStorage.getItem(`poster_${newFilm}`); addMovie(newFilm, poster_path); setNewFilm(""); setShowTmdbResults(false); sessionStorage.removeItem(`poster_${newFilm}`); }); }} style={{ fontSize: 13, padding: "7px 16px", borderRadius: 7, border: "none", background: t.gold, color: "#fff", cursor: "pointer", fontWeight: 600 }}>Add</button>
          {showTmdbResults && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 60, background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 8, marginTop: 4, zIndex: 10, maxHeight: 200, overflowY: "auto" }}>
              {tmdbLoading && <div style={{ padding: "12px 14px", fontSize: 12, color: t.textMuted }}>Searching…</div>}
              {!tmdbLoading && tmdbSearchResults.length > 0 && tmdbSearchResults.map(r => {
                const year = r.release_date ? r.release_date.slice(0, 4) : null;
                return (
                  <div key={r.tmdbId} onClick={() => selectTmdbFilm(r.title, r.poster_path)} style={{ padding: "10px 14px", borderBottom: `0.5px solid ${t.border}`, cursor: "pointer", display: "flex", gap: 10, alignItems: "center", fontSize: 13, color: t.text }} onMouseEnter={e => e.currentTarget.style.background = t.surface2} onMouseLeave={e => e.currentTarget.style.background = t.surface}>
                    {r.poster && <img src={r.poster} alt="" style={{ width: 30, height: 45, borderRadius: 4, objectFit: "cover" }} />}
                    <span style={{ flex: 1 }}>{r.title}</span>
                    {year && <span style={{ fontSize: 12, color: t.textMuted, fontFamily: "monospace" }}>{year}</span>}
                  </div>
                );
              })}
              {!tmdbLoading && tmdbSearchResults.length === 0 && <div style={{ padding: "12px 14px", fontSize: 12, color: t.textMuted }}>No results found</div>}
            </div>
          )}
        </div>
      </Card>
      <Card t={t} style={{ marginBottom: 10 }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setEditingFilm(null); }} placeholder="Search films to rename..." style={{ ...inp, width: "100%" }} />
        {search && <p style={{ fontSize: 11, color: t.textMuted, marginTop: 6 }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>}
      </Card>
      {filtered.length > 0 && search && (
        <div style={{ background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 10, overflow: "hidden" }}>
          {filtered.map((film, i) => (
            <div key={film} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", borderBottom: i < filtered.length - 1 ? `0.5px solid ${t.border}` : "none", background: i % 2 === 0 ? t.surface : t.rowAlt }}>
              <Poster film={film} scoring={scoring} size="small" t={t} />
              {editingFilm === film ? (
                <>
                  <input value={filmVal} onChange={e => setFilmVal(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { updateMovieName(film, filmVal); setEditingFilm(null); setSearch(""); } if (e.key === "Escape") setEditingFilm(null); }} autoFocus style={{ flex: 1, fontSize: 13, padding: "5px 9px", borderRadius: 6, border: `0.5px solid ${t.borderStrong}`, background: t.surface2, color: t.text }} />
                  <button onClick={() => { updateMovieName(film, filmVal); setEditingFilm(null); setSearch(""); }} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "none", background: t.gold, color: "#fff", cursor: "pointer", fontWeight: 600 }}>Save</button>
                  <button onClick={() => setEditingFilm(null)} style={{ fontSize: 12, padding: "5px 10px", borderRadius: 6, border: `0.5px solid ${t.border}`, background: "transparent", color: t.textMuted, cursor: "pointer" }}>Cancel</button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1, fontSize: 13, color: t.text }}>{film}</span>
                  <button onClick={() => withAuth(() => { setEditingFilm(film); setFilmVal(film); })} style={{ fontSize: 12, color: t.gold, background: "none", border: "none", cursor: "pointer", padding: "2px 6px" }}>rename</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      {search && filtered.length === 0 && <p style={{ fontSize: 13, color: t.textMuted, textAlign: "center", padding: "20px 0" }}>No films match "{search}"</p>}
    </div>
  );
}

function CommissionerSettings({ leagueName, updateLeagueName, marxistMode, toggleMarxistMode, leagueUsers, players, assignPlayer, t, showToast, movies, backfillPosters, scoring, deleteMovie }) {
  const [editingLeague, setEditingLeague] = useState(false);
  const [leagueVal, setLeagueVal] = useState(leagueName);
  const [copied, setCopied] = useState(false);
  const [posterProgress, setPosterProgress] = useState(null); // { current, total, film } or null
  const [posterRunning, setPosterRunning] = useState(false);
  const [posterResults, setPosterResults] = useState(null); // { updated, skipped, notFound: [] } or null
  const [forceRecheck, setForceRecheck] = useState(false);

  async function runBackfill() {
    setPosterRunning(true);
    setPosterResults(null);
    const results = await backfillPosters((current, total, film) => setPosterProgress({ current, total, film }), forceRecheck);
    setPosterRunning(false);
    setPosterProgress(null);
    setPosterResults(results);
  }

  useEffect(() => { setLeagueVal(leagueName); }, [leagueName]);

  const inviteUrl = window.location.origin;
  const unassigned = leagueUsers.filter(u => !u.player_name);
  const assigned = leagueUsers.filter(u => u.player_name);
  const inp = { fontSize: 13, padding: "7px 10px", borderRadius: 7, border: `0.5px solid ${t.borderStrong}`, background: t.surface2, color: t.text };

  function copyInvite() { navigator.clipboard.writeText(inviteUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }

  return (
    <div>
      <SL t={t}>film posters</SL>
      <Card t={t} style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 4 }}>Fetch missing posters</p>
            <p style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.5 }}>
              {posterRunning && posterProgress
                ? `Checking ${posterProgress.current}/${posterProgress.total}: ${posterProgress.film}…`
                : `Looks up posters for all ${movies.length} films already in your league — skips any that already have one.`}
            </p>
          </div>
          <button onClick={runBackfill} disabled={posterRunning} style={{ fontSize: 13, padding: "8px 16px", borderRadius: 8, border: `1.5px solid ${t.gold}`, background: posterRunning ? "transparent" : t.gold, color: posterRunning ? t.gold : "#fff", cursor: posterRunning ? "default" : "pointer", fontWeight: 600, whiteSpace: "nowrap", marginLeft: 16, opacity: posterRunning ? 0.7 : 1 }}>
            {posterRunning ? "Running…" : "Fetch posters"}
          </button>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 12, color: t.textSub, cursor: "pointer" }}>
          <input type="checkbox" checked={forceRecheck} onChange={e => setForceRecheck(e.target.checked)} />
          Re-check films that already have a poster (use this to fix any wrong posters saved previously)
        </label>
        {posterResults && posterResults.notFound.length > 0 && (() => {
          // Live filter: drop any film from this list the moment it has a poster_path saved,
          // even if fixed manually after the fetch ran — no need to re-run the whole thing.
          const stillMissing = posterResults.notFound.filter(f => !scoring[f]?.poster_path);
          if (stillMissing.length === 0) return null;
          return (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `0.5px solid ${t.border}` }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 8 }}>
                No exact TMDB match found for {stillMissing.length} film{stillMissing.length !== 1 ? "s" : ""} — add these manually via the search box in Settings:
              </p>
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {stillMissing.map(f => (
                  <li key={f} style={{ fontSize: 12, color: t.textSub, marginBottom: 3, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, maxWidth: 420 }}>
                    <span>{f}</span>
                    <button
                      onClick={() => { if (window.confirm(`Remove "${f}" from the league? This can't be undone.`)) deleteMovie(f); }}
                      style={{ fontSize: 10, color: t.red, background: "none", border: "none", cursor: "pointer", padding: "1px 4px", flexShrink: 0 }}
                    >
                      remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })()}
      </Card>

      <SL t={t}>marxist mode</SL>
      <Card t={t} style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: marxistMode ? t.red : t.text, marginBottom: 4 }}>
              {marxistMode ? "☭ Marxist Mode is ON" : "Marxist Mode is OFF"}
            </p>
            <p style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.5 }}>
              {marxistMode ? "Anyone can edit scores, picks, and film names — no login required." : "Only logged-in members can edit. Commissioner controls scoring."}
            </p>
          </div>
          <button onClick={toggleMarxistMode} style={{ fontSize: 13, padding: "8px 16px", borderRadius: 8, border: `1.5px solid ${marxistMode ? t.red : t.border}`, background: marxistMode ? t.redBg : "transparent", color: marxistMode ? t.red : t.textSub, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap", marginLeft: 16 }}>
            {marxistMode ? "Disable" : "Enable ☭"}
          </button>
        </div>
      </Card>

      <SL t={t}>invite link</SL>
      <Card t={t} style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: t.textSub, fontFamily: "monospace" }}>{inviteUrl}</span>
          <button onClick={copyInvite} style={{ fontSize: 12, padding: "5px 14px", borderRadius: 6, border: `0.5px solid ${t.border}`, background: copied ? t.gold : "transparent", color: copied ? "#fff" : t.gold, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap", marginLeft: 12 }}>
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
        <p style={{ fontSize: 11, color: t.textMuted, marginTop: 8 }}>Share with your league. After they sign up, assign them to their team below.</p>
      </Card>

      {unassigned.length > 0 && (
        <>
          <SL t={t}>waiting for assignment · {unassigned.length}</SL>
          <div style={{ background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
            {unassigned.map((user, i) => (
              <div key={user.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: i < unassigned.length - 1 ? `0.5px solid ${t.border}` : "none" }}>
                <span style={{ flex: 1, fontSize: 13, color: t.text }}>{user.email}</span>
                <select onChange={e => { if (e.target.value) assignPlayer(user.id, e.target.value); }} defaultValue="" style={{ ...inp, fontSize: 12, padding: "5px 8px" }}>
                  <option value="">Assign to team…</option>
                  {players.filter(p => !assigned.find(a => a.player_name === p)).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            ))}
          </div>
        </>
      )}

      {assigned.length > 0 && (
        <>
          <SL t={t}>assigned members</SL>
          <div style={{ background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
            {assigned.map((user, i) => (
              <div key={user.id} style={{ display: "flex", alignItems: "center", padding: "10px 16px", borderBottom: i < assigned.length - 1 ? `0.5px solid ${t.border}` : "none", background: i % 2 === 0 ? t.surface : t.rowAlt }}>
                <span style={{ flex: 1, fontSize: 13, color: t.text }}>{user.email}</span>
                <span style={{ fontSize: 12, color: t.gold, fontWeight: 600 }}>{user.player_name}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <SL t={t}>league name</SL>
      <Card t={t}>
        {editingLeague ? (
          <div style={{ display: "flex", gap: 8 }}>
            <input value={leagueVal} onChange={e => setLeagueVal(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { updateLeagueName(leagueVal); setEditingLeague(false); } if (e.key === "Escape") setEditingLeague(false); }} autoFocus style={{ ...inp, flex: 1 }} />
            <button onClick={() => { updateLeagueName(leagueVal); setEditingLeague(false); }} style={{ fontSize: 13, padding: "7px 16px", borderRadius: 7, border: "none", background: t.gold, color: "#fff", cursor: "pointer", fontWeight: 600 }}>Save</button>
            <button onClick={() => setEditingLeague(false)} style={{ fontSize: 13, padding: "7px 12px", borderRadius: 7, border: `0.5px solid ${t.border}`, background: "transparent", color: t.textMuted, cursor: "pointer" }}>Cancel</button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: t.text }}>{leagueName}</span>
            <button onClick={() => { setEditingLeague(true); setLeagueVal(leagueName); }} style={{ fontSize: 12, color: t.gold, background: "none", border: "none", cursor: "pointer" }}>rename</button>
          </div>
        )}
      </Card>
    </div>
  );
}
