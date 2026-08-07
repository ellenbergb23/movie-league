import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { DEFAULT_PLAYERS, THEMES, DEFAULT_IR_CONFIG, FONT_SANS, FONT_SERIF } from "../lib/constants";
import { calcFilmScore } from "../lib/scoring";
import { searchTMDB, getTMDBBoxOffice, getTMDBWideReleaseDate } from "../lib/tmdb";
import { getOMDbData, extractRTScores } from "../lib/omdb";
import { revenueToBoxOfficeTier, isValidRevenue } from "../lib/scoring-utils";
import {
  dbSet, dbGetPlayers, dbGetLeagueName, dbRenameLeague, dbGetOpenScoringMode, dbSetOpenScoringMode,
  dbGetDraft, dbSetDraftPick, dbGetScores, dbSetScore, dbGetMovies, dbAddMovie,
  dbDeleteMovie, dbRenameMovie, dbRenamePlayer, dbGetLeagueUsers, dbAssignPlayer, dbGetCurrentUser,
  dbGetIR, dbSetIR, dbGetReplacements, dbSetReplacements,
  dbGetIRConfig, dbSetIRConfig,
  dbGetScoringRules, dbSetScoringRules,
  dbGetJoinCode, dbDeleteLeague,
} from "../lib/db";
import { defaultScoringRules } from "../lib/scoringRules";
import { WaitingPage } from "./WaitingPage";
import { WelcomeModal } from "./WelcomeModal";
import { LeagueSwitcher } from "./LeagueSwitcher";
import { Leaderboard } from "./Leaderboard";
import { DraftBoard } from "./DraftBoard";
import { Scoring } from "./Scoring";
import { Settings } from "./Settings";
import { CommissionerSettings } from "./CommissionerSettings";
import { LeagueManagement } from "./LeagueManagement";
import { AllFilms } from "./AllFilms";

// Pre-multi-slot data stored one film string per player (e.g. { "Ryan Williams": "Some Film" }).
// Coerce any legacy string values into single-item arrays so old league data keeps working.
function normalizeIRMap(map) {
  const out = {};
  Object.entries(map || {}).forEach(([player, val]) => {
    out[player] = Array.isArray(val) ? val : (val ? [val] : []);
  });
  return out;
}

// leagueId: which league this view shows, from the URL (/l/:leagueId).
// authUser: the signed-in Supabase user (or null), owned by the parent App.
// darkMode/toggleDark, showToast: shared UI state, owned by the parent App so it's consistent across pages.
// onShowAuthModal/onShowCreateLeagueModal: open the shared modals that live in the parent App.
// signOut, navigate: shared actions from the parent App.
export default function LeagueView({ leagueId, authUser, darkMode, toggleDark, showToast, onShowAuthModal, onShowCreateLeagueModal, onShowJoinLeagueModal, signOut, navigate }) {
  const [dbUser, setDbUser] = useState(null);

  const [players, setPlayers] = useState([...DEFAULT_PLAYERS]);
  const [draft, setDraft] = useState(() => { const d = {}; DEFAULT_PLAYERS.forEach(p => { d[p] = Array(9).fill(""); }); return d; });
  const [scoring, setScoring] = useState({});
  const [movies, setMovies] = useState([]);
  const [leagueName, setLeagueName] = useState("The 2026 Film League");
  const [joinCode, setJoinCode] = useState(null);
  const [openScoringMode, setOpenScoringMode] = useState(false);
  const [leagueUsers, setLeagueUsers] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [tab, setTab] = useState("leaderboard");
  const [scoringFilm, setScoringFilm] = useState(null);
  const [draftFocusPlayer, setDraftFocusPlayer] = useState(null);
  const [irSlots, setIrSlots] = useState({}); // { playerName: [filmTitle, ...] } — up to irConfig.maxSlots per player
  const [replacements, setReplacements] = useState({}); // { playerName: [filmTitle, ...] } — permanent, appended each time a slot freed by IR is filled
  const [irConfig, setIrConfig] = useState(() => ({ ...DEFAULT_IR_CONFIG })); // { enabled, maxSlots }
  const [scoringRules, setScoringRules] = useState(() => defaultScoringRules());
  const [lmDirty, setLmDirty] = useState(false); // true while League Management has unapplied edits
  const [dismissedWelcome, setDismissedWelcome] = useState(false); // session-only skip for the welcome prompt

  const t = darkMode ? THEMES.dark : THEMES.light;
  const isCommissioner = dbUser?.role === "commissioner";
  const myPlayerName = dbUser?.player_name || null;
  const isAssigned = !!myPlayerName;

  // canEdit: true if Open Scoring Mode is on, OR if user is commissioner, OR if user is assigned
  const canEdit = openScoringMode || isCommissioner || isAssigned;

  // True the first time a seated member (commissioner or assigned player) has
  // no team_color yet — covers commissioners seated by create_league (never
  // prompted) and anyone assigned the old way via CommissionerSettings
  // (name only, no color). Clears itself once set_my_team saves a color, and
  // reappears on a future visit if skipped rather than saved.
  const needsWelcome = !!dbUser && !dbUser.team_color && (isCommissioner || isAssigned) && !dismissedWelcome;
  const takenColors = leagueUsers.map(u => u.team_color).filter(Boolean);

  useEffect(() => {
    if (!authUser) { setDbUser(null); return; }
    dbGetCurrentUser(leagueId, authUser.id).then(setDbUser);
  }, [authUser, leagueId]);

  useEffect(() => {
    async function load() {
      setDataLoading(true);
      const [name, loadedPlayers, movieData, scoreData, usersData, openScoring, irData, replacementsData, irConfigData, rulesData, code] = await Promise.all([
        dbGetLeagueName(leagueId), dbGetPlayers(leagueId), dbGetMovies(leagueId), dbGetScores(leagueId), dbGetLeagueUsers(leagueId), dbGetOpenScoringMode(leagueId), dbGetIR(leagueId), dbGetReplacements(leagueId), dbGetIRConfig(leagueId), dbGetScoringRules(leagueId), dbGetJoinCode(leagueId)
      ]);
      setLeagueName(name);
      setJoinCode(code);
      setPlayers(loadedPlayers);
      setMovies(movieData);
      setScoring(scoreData);
      setLeagueUsers(usersData);
      setOpenScoringMode(openScoring);
      setIrSlots(normalizeIRMap(irData));
      setReplacements(normalizeIRMap(replacementsData));
      setIrConfig(irConfigData);
      setScoringRules(rulesData);
      const draftData = await dbGetDraft(leagueId, loadedPlayers);
      setDraft(draftData);
      setDataLoading(false);
    }
    load();

    const scoreSub = supabase.channel("sc").on("postgres_changes", { event: "*", schema: "public", table: "scores", filter: `league_id=eq.${leagueId}` }, () => dbGetScores(leagueId).then(setScoring)).subscribe();
    const draftSub = supabase.channel("dr").on("postgres_changes", { event: "*", schema: "public", table: "draft_picks", filter: `league_id=eq.${leagueId}` }, async () => { const p = await dbGetPlayers(leagueId); setPlayers(p); setDraft(await dbGetDraft(leagueId, p)); }).subscribe();
    const movieSub = supabase.channel("mv").on("postgres_changes", { event: "*", schema: "public", table: "movies", filter: `league_id=eq.${leagueId}` }, () => dbGetMovies(leagueId).then(setMovies)).subscribe();
    const settingsSub = supabase.channel("st").on("postgres_changes", { event: "*", schema: "public", table: "settings", filter: `league_id=eq.${leagueId}` }, async () => {
      setLeagueName(await dbGetLeagueName(leagueId));
      const p = await dbGetPlayers(leagueId); setPlayers(p);
      setOpenScoringMode(await dbGetOpenScoringMode(leagueId));
      setIrSlots(normalizeIRMap(await dbGetIR(leagueId)));
      setReplacements(normalizeIRMap(await dbGetReplacements(leagueId)));
      setIrConfig(await dbGetIRConfig(leagueId));
      setScoringRules(await dbGetScoringRules(leagueId));
    }).subscribe();
    // Table name fixed from "users" to "league_members" — the old filter referenced a table
    // that predates Step 1's migration, so this subscription silently never fired.
    const usersSub = supabase.channel("us").on("postgres_changes", { event: "*", schema: "public", table: "league_members", filter: `league_id=eq.${leagueId}` }, async () => {
      setLeagueUsers(await dbGetLeagueUsers(leagueId));
      if (authUser) setDbUser(await dbGetCurrentUser(leagueId, authUser.id));
    }).subscribe();

    return () => { scoreSub.unsubscribe(); draftSub.unsubscribe(); movieSub.unsubscribe(); settingsSub.unsubscribe(); usersSub.unsubscribe(); };
  }, [leagueId, authUser]);

  function requestTabChange(nextTab) {
    if (tab === "league management" && lmDirty && nextTab !== tab) {
      if (!window.confirm("You have unsaved scoring rule changes. Leave without applying them?")) return;
      setLmDirty(false);
    }
    setTab(nextTab);
  }

  useEffect(() => {
    function handleBeforeUnload(e) {
      if (tab === "league management" && lmDirty) { e.preventDefault(); e.returnValue = ""; }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [tab, lmDirty]);

  function requireAuth(action) {
    if (openScoringMode || isCommissioner || isAssigned) { action(); }
    else { onShowAuthModal(); }
  }

  async function toggleOpenScoringMode() {
    const next = !openScoringMode;
    setOpenScoringMode(next);
    await dbSetOpenScoringMode(leagueId, next);
    showToast(next ? "Open Scoring Mode enabled" : "Commissioner Scoring Mode enabled");
  }

  async function updateLeagueName(name) { setLeagueName(name); await dbRenameLeague(leagueId, name); showToast("Saved"); }
  async function handleDeleteLeague() {
    await dbDeleteLeague(leagueId);
    navigate("/");
  }

  async function updateScoringRules(rules) {
    setScoringRules(rules);
    await dbSetScoringRules(leagueId, rules);
    showToast("Scoring rules applied");
  }

  async function renamePlayer(oldName, newName) {
    if (!newName.trim() || newName === oldName) return;
    const n = newName.trim();
    try {
      const newPlayers = await dbRenamePlayer(leagueId, oldName, n, players);
      setPlayers(newPlayers);
      setDraft(prev => { const next = { ...prev }; next[n] = next[oldName]; delete next[oldName]; return next; });
      showToast("Player renamed");
    } catch (e) {
      showToast(e.message || "Couldn't rename player");
    }
  }

  async function assignPlayer(userId, playerName) {
    try {
      await dbAssignPlayer(leagueId, userId, playerName);
      setLeagueUsers(prev => prev.map(u => u.id === userId ? { ...u, player_name: playerName } : u));
      showToast("Player assigned");
    } catch (e) {
      showToast(e.message || "Couldn't assign player");
    }
  }

  async function updateScoring(film, field, value) {
    const updated = { ...(scoring[film] || {}), [field]: value };
    setScoring(prev => ({ ...prev, [film]: updated }));
    await dbSetScore(leagueId, film, updated);
    showToast("Saved");
  }
  async function updateScoringMulti(film, fields) {
    // Save multiple fields atomically — avoids stale state from sequential updateScoring calls
    const updated = { ...(scoring[film] || {}), ...fields };
    setScoring(prev => ({ ...prev, [film]: updated }));
    await dbSetScore(leagueId, film, updated);
    showToast("Saved");
  }
  async function updateScoringRoot(field, value) {
    const meta = { ...(scoring["_meta"] || {}), [field]: value };
    setScoring(prev => ({ ...prev, _meta: meta, [field]: value }));
    await dbSetScore(leagueId, "_meta", meta);
    showToast("Saved");
  }
  async function updateOscarField(film, field, catIndex, value) {
    const arr = [...((scoring[film]?.[field]) || [])];
    arr[catIndex] = value;
    await updateScoring(film, field, arr);
  }
  async function updateDraftPick(player, roundIdx, film) {
    // If this round slot currently holds the player's IR'd film, filling it with a new film
    // permanently tags that new film as a replacement pick (one IR per team, so this only ever fires once).
    const priorFilm = (draft[player] || [])[roundIdx];
    const irFilms = irSlots[player] || [];
    const existingReplacements = replacements[player] || [];
    if (film && irFilms.includes(priorFilm) && !existingReplacements.includes(film)) {
      const updatedReplacements = { ...replacements, [player]: [...existingReplacements, film] };
      setReplacements(updatedReplacements);
      await dbSetReplacements(leagueId, updatedReplacements);
    }
    setDraft(prev => ({ ...prev, [player]: prev[player].map((v, i) => i === roundIdx ? film : v) }));
    await dbSetDraftPick(leagueId, player, roundIdx, film);
  }
  async function addMovie(title, poster_path) {
    if (!title.trim() || movies.includes(title.trim())) return;
    const trimmedTitle = title.trim();
    setMovies(prev => [...prev, trimmedTitle]);
    await dbAddMovie(leagueId, trimmedTitle);
    // Merge poster data with any existing scoring (never overwrite existing scores)
    if (poster_path) {
      const mergedData = { ...(scoring[trimmedTitle] || {}), poster_path };
      setScoring(prev => ({ ...prev, [trimmedTitle]: mergedData }));
      await dbSetScore(leagueId, trimmedTitle, mergedData);
    }
    showToast("Film added");
  }
  async function updateMovieName(oldName, newName) {
    if (!newName.trim() || newName === oldName) return;
    const n = newName.trim();
    setMovies(prev => prev.map(m => m === oldName ? n : m));
    setDraft(prev => { const next = {}; Object.entries(prev).forEach(([p, picks]) => { next[p] = picks.map(pk => pk === oldName ? n : pk); }); return next; });
    setScoring(prev => { const next = { ...prev }; if (next[oldName]) { next[n] = next[oldName]; delete next[oldName]; } return next; });
    await dbRenameMovie(leagueId, oldName, n);
    showToast("Film renamed");

    // Auto-populate the poster from TMDB under the new title — same exact-match logic as
    // backfillPosters, so a rename (e.g. fixing a typo) doesn't leave a stale/missing poster.
    try {
      const results = await searchTMDB(n);
      const exactMatches = results.filter(r => r.title.trim().toLowerCase() === n.trim().toLowerCase());
      const best = exactMatches.find(r => ["2025", "2026", "2027"].includes(r.release_date?.slice(0, 4))) || exactMatches[0];
      if (best) {
        setScoring(prev => {
          const updatedData = { ...(prev[n] || {}), poster_path: best.poster_path };
          dbSetScore(leagueId, n, updatedData);
          return { ...prev, [n]: updatedData };
        });
      }
    } catch (e) {
      console.error("TMDB poster lookup on rename failed:", e);
    }
  }

  async function deleteMovie(title) {
    setMovies(prev => prev.filter(m => m !== title));
    setScoring(prev => { const next = { ...prev }; delete next[title]; return next; });
    await dbDeleteMovie(leagueId, title);
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
        await dbSetScore(leagueId, film, updatedData);
        updated++;
      } else {
        notFound.push(film);
      }
      await new Promise(r => setTimeout(r, 300)); // avoid hammering TMDB
    }
    showToast(`Posters: ${updated} added · ${skipped} already had one · ${notFound.length} not found`);
    return { updated, skipped, notFound };
  }

  // BO_MIN_REVENUE: below this, a film's box office is treated as "too early" rather than final.
  const BO_MIN_REVENUE = 5_000_000;

  // Fetches box office for a single film. overrideManual=false ("Fill Auto Scores Only") skips any film
  // that already has a bo value; overrideManual=true ("Override Manual Scores") always fetches and wins.
  async function fetchBoxOfficeForFilm(film, currentScoring, overrideManual) {
    const hasBO = !!currentScoring.bo;
    const tmdbResult = await getTMDBBoxOffice(film);
    const revenue = tmdbResult?.revenue;
    const resolvedTmdbId = tmdbResult?.tmdbId || currentScoring.tmdbId || null;
    const resolvedReleaseYear = tmdbResult?.releaseYear || currentScoring.releaseYear || null;

    if (!overrideManual && hasBO) {
      return { status: "skipped", resolvedTmdbId, resolvedReleaseYear };
    }
    if (revenue && isValidRevenue(revenue)) {
      if (revenue < BO_MIN_REVENUE) {
        return { status: "too-early", resolvedTmdbId, resolvedReleaseYear };
      }
      const boTier = revenueToBoxOfficeTier(revenue);
      const fields = { boRaw: revenue, tmdbId: resolvedTmdbId, releaseYear: resolvedReleaseYear };
      if (boTier) fields.bo = boTier;
      return { status: "updated", fields, resolvedTmdbId, resolvedReleaseYear };
    }
    const fields = (resolvedTmdbId || resolvedReleaseYear) ? { tmdbId: resolvedTmdbId, releaseYear: resolvedReleaseYear } : null;
    return { status: "not-found", fields, resolvedTmdbId, resolvedReleaseYear };
  }

  // Fetches RT scores for a single film. Same Fill/Override semantics as box office above.
  async function fetchRTForFilm(film, currentScoring, overrideManual, resolvedTmdbId, resolvedReleaseYear, resolvedHasBoxOffice) {
    const hasRT = !!currentScoring.criticsRT || !!currentScoring.audienceRT;
    if (!overrideManual && hasRT) {
      return { status: "skipped" };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let wideReleaseDate = null;
    if (resolvedTmdbId) {
      const wideDateStr = await getTMDBWideReleaseDate(resolvedTmdbId);
      if (wideDateStr) {
        wideReleaseDate = new Date(wideDateStr);
        wideReleaseDate.setHours(0, 0, 0, 0);
      }
    }
    if (wideReleaseDate && wideReleaseDate > today) return { status: "too-early" };
    if (!wideReleaseDate && !resolvedHasBoxOffice) return { status: "too-early" };

    let omdbData = null;
    if (resolvedReleaseYear) {
      const year = parseInt(resolvedReleaseYear);
      omdbData = await getOMDbData(film, String(year));
      if (!omdbData) omdbData = await getOMDbData(film, String(year - 1));
      if (!omdbData) omdbData = await getOMDbData(film, String(year + 1));
    } else {
      omdbData = await getOMDbData(film);
    }
    if (omdbData) {
      const rtScores = extractRTScores(omdbData);
      if (rtScores.criticsRT || rtScores.audienceRT) {
        return { status: "updated", fields: rtScores };
      }
    }
    return { status: "not-found" };
  }

  // overrideManual: false = "Fill Auto Scores Only" (only fills missing values, never touches existing ones);
  // true = "Override Manual Scores" (fetch always wins).
  async function backfillScoring(onProgress, overrideManual = false, mode = "all") {
    let boUpdated = 0, boSkipped = 0;
    let rtUpdated = 0, rtSkipped = 0;
    const boNotFound = [], rtNotFound = [];
    const boTooEarly = [], rtTooEarly = [];
    const unreleasedWithData = []; // films toggled Unreleased that now have data suggesting otherwise
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < movies.length; i++) {
      const film = movies[i];
      if (onProgress) onProgress(i + 1, movies.length, film);
      const currentScoring = scoring[film] || {};
      const manuallyUnreleased = currentScoring.released === false;
      const hasBO = !!currentScoring.bo;

      // Capture in local vars — setScoring is batched and won't update state mid-loop
      let resolvedTmdbId = currentScoring.tmdbId || null;
      let resolvedReleaseYear = currentScoring.releaseYear || null;
      let resolvedHasBoxOffice = hasBO;
      const candidate = {}; // fields found for a manually-unreleased film — review only, never auto-saved

      // --- Box office (always fetched — even for manually-unreleased films, to check for a review prompt) ---
      {
        const tmdbResult = await getTMDBBoxOffice(film);
        const revenue = tmdbResult?.revenue;

        if (tmdbResult?.tmdbId) resolvedTmdbId = tmdbResult.tmdbId;
        if (tmdbResult?.releaseYear) resolvedReleaseYear = tmdbResult.releaseYear;

        if (manuallyUnreleased) {
          console.log(`[Unreleased-check] "${film}" → TMDB match: ${tmdbResult?.tmdbId ? `id ${tmdbResult.tmdbId}` : "none found"} | revenue: ${revenue ?? "none"} | year: ${resolvedReleaseYear ?? "none"}`);
          if ((overrideManual || !hasBO) && revenue && isValidRevenue(revenue) && revenue >= BO_MIN_REVENUE) {
            candidate.boRaw = revenue;
            candidate.bo = revenueToBoxOfficeTier(revenue);
            candidate.tmdbId = resolvedTmdbId;
            candidate.releaseYear = resolvedReleaseYear;
            resolvedHasBoxOffice = true;
          }
        } else if (mode === "rt") {
          // Box office fetch skipped by mode — still resolved tmdbId/releaseYear above for RT's wide-release-date check.
        } else if (!overrideManual && hasBO) {
          boSkipped++;
        } else if (revenue && isValidRevenue(revenue)) {
          if (revenue < BO_MIN_REVENUE) {
            boTooEarly.push(film);
          } else {
            const boTier = revenueToBoxOfficeTier(revenue);
            const updatedFields = { ...currentScoring, boRaw: revenue, tmdbId: resolvedTmdbId, releaseYear: resolvedReleaseYear };
            if (boTier) updatedFields.bo = boTier;
            setScoring(prev => ({ ...prev, [film]: updatedFields }));
            await dbSetScore(leagueId, film, updatedFields);
            boUpdated++;
            resolvedHasBoxOffice = true;
          }
        } else if (!manuallyUnreleased) {
          if (resolvedTmdbId || resolvedReleaseYear) {
            const updatedData = { ...currentScoring, tmdbId: resolvedTmdbId, releaseYear: resolvedReleaseYear };
            setScoring(prev => ({ ...prev, [film]: updatedData }));
            await dbSetScore(leagueId, film, updatedData);
          }
          boNotFound.push(film);
        }
      }

      // --- RT scores ---
      if (manuallyUnreleased) {
        let wideReleaseDate = null;
        if (resolvedTmdbId) {
          const wideDateStr = await getTMDBWideReleaseDate(resolvedTmdbId);
          if (wideDateStr) {
            wideReleaseDate = new Date(wideDateStr);
            wideReleaseDate.setHours(0, 0, 0, 0);
          }
        }
        const looksReleased = (wideReleaseDate && wideReleaseDate <= today) || resolvedHasBoxOffice;
        if (looksReleased) {
          let omdbData = null;
          if (resolvedReleaseYear) {
            const year = parseInt(resolvedReleaseYear);
            omdbData = await getOMDbData(film, String(year));
            if (!omdbData) omdbData = await getOMDbData(film, String(year - 1));
            if (!omdbData) omdbData = await getOMDbData(film, String(year + 1));
          } else {
            omdbData = await getOMDbData(film);
          }
          if (omdbData) {
            const rtScores = extractRTScores(omdbData);
            if (rtScores.criticsRT || rtScores.audienceRT) Object.assign(candidate, rtScores);
          }
        }
        if (Object.keys(candidate).length > 0) {
          console.log(`[Unreleased-check] "${film}" → flagged for review:`, candidate);
          unreleasedWithData.push({ film, candidate });
        } else {
          console.log(`[Unreleased-check] "${film}" → no qualifying data found (still treated as unreleased)`);
        }
        boSkipped++;
        rtSkipped++;
        await new Promise(r => setTimeout(r, 350));
        continue;
      }

      const hasRT = !!currentScoring.criticsRT || !!currentScoring.audienceRT;
      if (mode === "bo") {
        // RT fetch skipped by mode entirely for normal (non-manually-unreleased) films.
      } else if (!overrideManual && hasRT) {
        rtSkipped++;
      } else {
        let wideReleaseDate = null;
        if (resolvedTmdbId) {
          const wideDateStr = await getTMDBWideReleaseDate(resolvedTmdbId);
          if (wideDateStr) {
            wideReleaseDate = new Date(wideDateStr);
            wideReleaseDate.setHours(0, 0, 0, 0);
          }
        }

        if (wideReleaseDate && wideReleaseDate > today) {
          // Confirmed future release date — too early
          rtTooEarly.push(film);
        } else if (!wideReleaseDate && !resolvedHasBoxOffice) {
          // No US release date AND no box office — not released yet
          // (catches streaming films like Saturn Return with TBA dates)
          rtTooEarly.push(film);
        } else {
          // Released — try OMDb with year then adjacent years, no open-ended fallback
          let omdbData = null;
          if (resolvedReleaseYear) {
            const year = parseInt(resolvedReleaseYear);
            omdbData = await getOMDbData(film, String(year));
            if (!omdbData) omdbData = await getOMDbData(film, String(year - 1));
            if (!omdbData) omdbData = await getOMDbData(film, String(year + 1));
          } else {
            omdbData = await getOMDbData(film);
          }

          if (omdbData) {
            const rtScores = extractRTScores(omdbData);
            if (rtScores.criticsRT || rtScores.audienceRT) {
              const freshScoring = scoring[film] || {};
              const updatedData = { ...freshScoring, ...rtScores };
              setScoring(prev => ({ ...prev, [film]: updatedData }));
              await dbSetScore(leagueId, film, updatedData);
              rtUpdated++;
            } else {
              rtNotFound.push(film);
            }
          } else {
            rtNotFound.push(film);
          }
        }
      }

      await new Promise(r => setTimeout(r, 350));
    }

    const summaryLines = [];
    if (mode !== "rt" && (boUpdated > 0 || boSkipped > 0)) summaryLines.push(`Box Office: ${boUpdated} added · ${boSkipped} skipped`);
    if (mode !== "bo" && (rtUpdated > 0 || rtSkipped > 0)) summaryLines.push(`RT Scores: ${rtUpdated} added · ${rtSkipped} skipped`);
    const summary = summaryLines.join(" | ");
    showToast(summary || "No updates");
    return { boUpdated, boSkipped, boNotFound, rtUpdated, rtSkipped, rtNotFound, boTooEarly, rtTooEarly, unreleasedWithData };
  }

  // Per-film fetch for the Scoring page (commissioner-only). mode: "bo" | "rt" | "all".
  // overrideManual: false = "Fill Auto Scores Only", true = "Override Manual Scores" — same choice as bulk fetch.
  async function fetchFilmScoring(film, mode = "all", overrideManual = false) {
    const currentScoring = scoring[film] || {};
    if (currentScoring.released === false) {
      showToast(`"${film}" is marked Unreleased — use the Commissioner tab bulk fetch to review it`);
      return;
    }

    let updatedFields = {};
    let resolvedTmdbId = currentScoring.tmdbId || null;
    let resolvedReleaseYear = currentScoring.releaseYear || null;
    let resolvedHasBoxOffice = !!currentScoring.bo;
    const messages = [];

    if (mode === "bo" || mode === "all") {
      const boResult = await fetchBoxOfficeForFilm(film, currentScoring, overrideManual);
      resolvedTmdbId = boResult.resolvedTmdbId ?? resolvedTmdbId;
      resolvedReleaseYear = boResult.resolvedReleaseYear ?? resolvedReleaseYear;
      if (boResult.status === "updated") {
        Object.assign(updatedFields, boResult.fields);
        resolvedHasBoxOffice = true;
        messages.push("box office updated");
      } else if (boResult.status === "skipped") {
        messages.push("box office already set — skipped");
      } else if (boResult.status === "too-early") {
        messages.push("box office too early (under $5M)");
      } else {
        if (boResult.fields) Object.assign(updatedFields, boResult.fields);
        messages.push("no box office data found");
      }
    }

    if (mode === "rt" || mode === "all") {
      const rtResult = await fetchRTForFilm(film, currentScoring, overrideManual, resolvedTmdbId, resolvedReleaseYear, resolvedHasBoxOffice);
      if (rtResult.status === "updated") {
        Object.assign(updatedFields, rtResult.fields);
        messages.push("RT scores updated");
      } else if (rtResult.status === "skipped") {
        messages.push("RT already set — skipped");
      } else if (rtResult.status === "too-early") {
        messages.push("RT too early — not yet released");
      } else {
        messages.push("no RT data found");
      }
    }

    if (Object.keys(updatedFields).length > 0) {
      const merged = { ...(scoring[film] || {}), ...updatedFields };
      setScoring(prev => ({ ...prev, [film]: merged }));
      await dbSetScore(leagueId, film, merged);
    }
    showToast(`"${film}": ${messages.join(", ")}`);
  }

  async function applyUnreleasedData(film, candidate) {
    const updated = { ...(scoring[film] || {}), ...candidate, released: true };
    setScoring(prev => ({ ...prev, [film]: updated }));
    await dbSetScore(leagueId, film, updated);
    showToast(`${film} marked Released and data applied`);
  }

  const scoringWithMeta = { ...scoring, ...(scoring["_meta"] || {}) };

  async function placeOnIR(player, film) {
    const current = irSlots[player] || [];
    if (current.length >= irConfig.maxSlots) {
      showToast(`IR is limited to ${irConfig.maxSlots} slot${irConfig.maxSlots !== 1 ? "s" : ""} per team`);
      return;
    }
    const updated = { ...irSlots, [player]: [...current, film] };
    setIrSlots(updated);
    await dbSetIR(leagueId, updated);
    showToast(`${film} placed on IR`);
  }

  async function removeFromIR(player, film) {
    const updated = { ...irSlots, [player]: (irSlots[player] || []).filter(f => f !== film) };
    setIrSlots(updated);
    await dbSetIR(leagueId, updated);
    showToast("Removed from IR");
  }

  async function updateIRConfig(newConfig) {
    // Trim any teams' IR lists that now exceed a lowered maxSlots (rare — commissioner-only action).
    let trimmedIrSlots = irSlots;
    if (newConfig.maxSlots < irConfig.maxSlots) {
      trimmedIrSlots = {};
      Object.entries(irSlots).forEach(([player, films]) => { trimmedIrSlots[player] = films.slice(0, newConfig.maxSlots); });
      setIrSlots(trimmedIrSlots);
      await dbSetIR(leagueId, trimmedIrSlots);
    }
    setIrConfig(newConfig);
    await dbSetIRConfig(leagueId, newConfig);
    showToast("IR settings updated");
  }

  function getPlayerTotal(player) {
    const irFilms = irSlots[player] || [];
    return (draft[player] || []).reduce((sum, film) => {
      if (!film) return sum;
      if (irFilms.includes(film)) return sum; // IR films score 0
      return sum + calcFilmScore(film, scoringWithMeta, scoringRules);
    }, 0);
  }

  function goToPlayerDraft(player) { setDraftFocusPlayer(player); setTab("draft board"); }
  function goToFilmScoring(film) { setScoringFilm(film); setTab("scoring"); }

  const rankedPlayers = [...players].sort((a, b) => getPlayerTotal(b) - getPlayerTotal(a));

  const css = `* { box-sizing: border-box; margin: 0; padding: 0; } body { background: ${t.bg}; } select { appearance: none; -webkit-appearance: none; } input[type=checkbox] { accent-color: ${t.gold}; width: 15px; height: 15px; cursor: pointer; } .clickable:hover { opacity: 0.75; } .ffl-nav { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; } .ffl-nav::-webkit-scrollbar { display: none; } .ffl-nav button { flex-shrink: 0; } .ffl-draft-grid { grid-template-columns: repeat(7, minmax(110px, 1fr)); } @media (max-width: 700px) { .ffl-draft-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 6px !important; } .ffl-draft-card { height: 214px !important; padding: 6px !important; } }`;

  if (dataLoading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: t.bg, color: t.textMuted, fontFamily: FONT_SANS, fontSize: 14 }}>Loading…</div>;

  // Only show waiting page if logged in but not yet assigned (and not commissioner)
  if (authUser && !isCommissioner && !isAssigned) return <WaitingPage t={t} user={authUser} onSignOut={signOut} onBackToLeagues={() => navigate("/")} />;

  const tabs = ["leaderboard","draft board","all films","scoring","settings"];
  if (isCommissioner) tabs.push("commissioner", "league management");
  const tabLabels = { "leaderboard": "Leaderboard", "draft board": "Draft Board", "all films": "All Films", "scoring": "Scoring", "settings": "Settings", "commissioner": "Commissioner", "league management": "League Management" };

  return (
    <div style={{ fontFamily: FONT_SANS, minHeight: "100vh", background: t.bg, color: t.text }}>
      <style>{css}</style>

      {needsWelcome && (
        <WelcomeModal
          t={t}
          leagueId={leagueId}
          defaultName={myPlayerName}
          takenColors={takenColors}
          onSaved={({ playerName, teamColor }) => {
            setDbUser(prev => prev && { ...prev, player_name: playerName, team_color: teamColor });
            showToast("Team saved");
          }}
          onSkip={() => setDismissedWelcome(true)}
        />
      )}

      <header style={{ background: t.header, borderBottom: `0.5px solid ${t.border}`, padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate("/")} aria-label="Your leagues" style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", border: `0.5px solid ${t.gold}`, borderRadius: 4, fontFamily: FONT_SERIF, fontSize: 13, fontWeight: 600, color: t.gold, flexShrink: 0, background: "none", cursor: "pointer" }}>FFL</button>
          <div>
            <div style={{ fontFamily: FONT_SERIF, fontSize: 19, fontWeight: 500, color: t.text, lineHeight: 1.2 }}>{leagueName}</div>
            <button onClick={() => navigate("/")} style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", background: "none", border: "none", padding: 0, cursor: "pointer" }}>← Your Leagues</button>
          </div>
          {openScoringMode && isCommissioner && <span style={{ fontSize: 11, color: t.gold, border: `0.5px solid ${t.gold}`, padding: "2px 7px", borderRadius: 4, fontWeight: 600, marginLeft: 4 }}>Open Scoring Mode</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {authUser ? (
            <>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: FONT_SERIF, fontSize: 13, color: t.text }}>{myPlayerName || (isCommissioner ? "Commissioner" : authUser.email)}</div>
                {isCommissioner && <div style={{ fontSize: 10, color: t.gold, border: `0.5px solid ${t.gold}`, borderRadius: 10, padding: "1px 7px", display: "inline-block", marginTop: 2 }}>Commissioner</div>}
              </div>
              <LeagueSwitcher authUser={authUser} darkMode={darkMode} navigate={navigate} currentLeagueId={leagueId} currentLeagueName={leagueName} onShowJoinLeagueModal={onShowJoinLeagueModal} />
              <button onClick={onShowCreateLeagueModal} style={{ background: "none", border: `0.5px solid ${t.border}`, borderRadius: 6, padding: "5px 10px", fontSize: 12, color: t.textMuted, cursor: "pointer" }}>+ New League</button>
              <button onClick={signOut} style={{ background: "none", border: `0.5px solid ${t.border}`, borderRadius: 6, padding: "5px 10px", fontSize: 12, color: t.textMuted, cursor: "pointer" }}>Sign out</button>
            </>
          ) : (
            <>
              <button onClick={onShowCreateLeagueModal} style={{ background: "none", border: `0.5px solid ${t.border}`, borderRadius: 6, padding: "5px 10px", fontSize: 12, color: t.textMuted, cursor: "pointer" }}>+ New League</button>
              <button onClick={onShowAuthModal} style={{ background: "none", border: `0.5px solid ${t.border}`, borderRadius: 6, padding: "5px 12px", fontSize: 12, color: t.textSub, cursor: "pointer" }}>Log in</button>
            </>
          )}
          <button
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            style={{ position: "relative", width: 40, height: 22, borderRadius: 11, border: `0.5px solid ${t.border}`, background: t.surface2, cursor: "pointer", flexShrink: 0, padding: 0 }}
          >
            <span style={{ position: "absolute", left: 4, top: "50%", transform: "translateY(-50%)", fontSize: 9, lineHeight: 1 }}>☀</span>
            <span style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", fontSize: 9, lineHeight: 1 }}>☾</span>
            <span style={{ position: "absolute", top: 2, left: darkMode ? 20 : 2, width: 16, height: 16, borderRadius: "50%", background: t.gold, transition: "left 0.15s" }} />
          </button>
        </div>
      </header>

      <nav className="ffl-nav" style={{ background: t.header, borderBottom: `0.5px solid ${t.border}`, padding: "0 1.5rem", display: "flex" }}>
        {tabs.map(tb => (
          <button
            key={tb}
            onClick={() => requestTabChange(tb)}
            onMouseEnter={e => { if (tab !== tb) e.currentTarget.style.color = t.gold; }}
            onMouseLeave={e => { if (tab !== tb) e.currentTarget.style.color = (tb === "commissioner" || tb === "league management") ? t.gold : t.navInactive; }}
            style={{ fontFamily: FONT_SERIF, padding: "16px 14px 13px", fontSize: 14, fontWeight: tab === tb ? 700 : 400, color: tab === tb ? t.navActive : (tb === "commissioner" || tb === "league management") ? t.gold : t.navInactive, background: "none", border: "none", borderBottom: tab === tb ? `2px solid ${(tab === "commissioner" || tab === "league management") ? t.gold : t.navActive}` : "2px solid transparent", cursor: "pointer", transition: "color 0.15s" }}
          >{tabLabels[tb]}</button>
        ))}
      </nav>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "1.5rem" }}>
        {tab === "leaderboard"  && <Leaderboard rankedPlayers={rankedPlayers} getPlayerTotal={getPlayerTotal} draft={draft} scoring={scoringWithMeta} t={t} goToPlayerDraft={goToPlayerDraft} irSlots={irSlots} rules={scoringRules} />}
        {tab === "draft board"  && <DraftBoard draft={draft} players={players} movies={movies} canEdit={canEdit} isCommissioner={isCommissioner} openScoringMode={openScoringMode} updateDraftPick={updateDraftPick} requireAuth={requireAuth} scoring={scoringWithMeta} goToFilmScoring={goToFilmScoring} t={t} focusPlayer={draftFocusPlayer} addMovie={addMovie} irSlots={irSlots} placeOnIR={placeOnIR} removeFromIR={removeFromIR} replacements={replacements} rules={scoringRules} irConfig={irConfig} myPlayerName={myPlayerName} />}
        {tab === "all films"    && <AllFilms movies={movies} scoring={scoringWithMeta} rules={scoringRules} t={t} goToFilmScoring={goToFilmScoring} />}
        {tab === "scoring"      && <Scoring scoring={scoringWithMeta} movies={movies} canEdit={canEdit} isCommissioner={isCommissioner} requireAuth={requireAuth} updateScoring={updateScoring} updateScoringMulti={updateScoringMulti} updateScoringRoot={updateScoringRoot} updateOscarField={updateOscarField} updateMovieName={updateMovieName} scoringFilm={scoringFilm} setScoringFilm={setScoringFilm} showToast={showToast} fetchFilmScoring={fetchFilmScoring} t={t} rules={scoringRules} />}
        {tab === "settings"     && <Settings movies={movies} players={players} canEdit={canEdit} myPlayerName={myPlayerName} openScoringMode={openScoringMode} updateMovieName={updateMovieName} addMovie={addMovie} renamePlayer={renamePlayer} t={t} showToast={showToast} requireAuth={requireAuth} isCommissioner={isCommissioner} searchTMDB={searchTMDB} scoring={scoringWithMeta} />}
        {tab === "commissioner" && isCommissioner && <CommissionerSettings leagueName={leagueName} updateLeagueName={updateLeagueName} openScoringMode={openScoringMode} toggleOpenScoringMode={toggleOpenScoringMode} leagueUsers={leagueUsers} players={players} assignPlayer={assignPlayer} t={t} showToast={showToast} movies={movies} backfillPosters={backfillPosters} backfillScoring={backfillScoring} scoring={scoringWithMeta} applyUnreleasedData={applyUnreleasedData} joinCode={joinCode} />}
        {tab === "league management" && isCommissioner && <LeagueManagement rules={scoringRules} updateScoringRules={updateScoringRules} onDirtyChange={setLmDirty} t={t} showToast={showToast} irConfig={irConfig} updateIRConfig={updateIRConfig} movies={movies} draftBoard={draft} deleteMovie={deleteMovie} leagueName={leagueName} onDeleteLeague={handleDeleteLeague} />}
      </main>
    </div>
  );
}
