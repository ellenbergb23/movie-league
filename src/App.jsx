import { useState, useEffect } from "react";
import { supabase, LEAGUE_ID, COMMISSIONER_EMAIL } from "./lib/supabase";
import { DEFAULT_PLAYERS, THEMES } from "./lib/constants";
import { calcFilmScore } from "./lib/scoring";
import { searchTMDB, getTMDBBoxOffice, getTMDBWideReleaseDate } from "./lib/tmdb";
import { getOMDbData, extractRTScores } from "./lib/omdb";
import { revenueToBoxOfficeTier, isValidRevenue } from "./lib/scoring-utils";
import {
  dbSet, dbGetPlayers, dbGetLeagueName, dbGetOpenScoringMode, dbSetOpenScoringMode,
  dbGetDraft, dbSetDraftPick, dbGetScores, dbSetScore, dbGetMovies, dbAddMovie,
  dbDeleteMovie, dbRenameMovie, dbRenamePlayer, dbGetLeagueUsers, dbAssignPlayer, dbGetCurrentUser,
  dbGetIR, dbSetIR, dbGetReplacements, dbSetReplacements,
  dbGetScoringRules, dbSetScoringRules,
} from "./lib/db";
import { defaultScoringRules } from "./lib/scoringRules";
import { AuthModal } from "./components/AuthModal";
import { WaitingPage } from "./components/WaitingPage";
import { Leaderboard } from "./components/Leaderboard";
import { DraftBoard } from "./components/DraftBoard";
import { Scoring } from "./components/Scoring";
import { Settings } from "./components/Settings";
import { CommissionerSettings } from "./components/CommissionerSettings";
import { LeagueManagement } from "./components/LeagueManagement";

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
  const [openScoringMode, setOpenScoringMode] = useState(false);
  const [leagueUsers, setLeagueUsers] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [tab, setTab] = useState("leaderboard");
  const [scoringFilm, setScoringFilm] = useState(null);
  const [draftFocusPlayer, setDraftFocusPlayer] = useState(null);
  const [toast, setToast] = useState(null);
  const [irSlots, setIrSlots] = useState({}); // { playerName: filmTitle }
  const [replacements, setReplacements] = useState({}); // { playerName: filmTitle } — permanent, set once when a slot freed by IR is filled
  const [scoringRules, setScoringRules] = useState(() => defaultScoringRules());
  const [lmDirty, setLmDirty] = useState(false); // true while League Management has unapplied edits

  const t = darkMode ? THEMES.dark : THEMES.light;
  const isCommissioner = authUser?.email === COMMISSIONER_EMAIL;
  const myPlayerName = dbUser?.player_name || null;
  const isAssigned = !!myPlayerName;

  // canEdit: true if Open Scoring Mode is on, OR if user is commissioner, OR if user is assigned
  const canEdit = openScoringMode || isCommissioner || isAssigned;
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
      const [name, loadedPlayers, movieData, scoreData, usersData, openScoring, irData, replacementsData, rulesData] = await Promise.all([
        dbGetLeagueName(), dbGetPlayers(), dbGetMovies(), dbGetScores(), dbGetLeagueUsers(), dbGetOpenScoringMode(), dbGetIR(), dbGetReplacements(), dbGetScoringRules()
      ]);
      setLeagueName(name);
      setPlayers(loadedPlayers);
      setMovies(movieData);
      setScoring(scoreData);
      setLeagueUsers(usersData);
      setOpenScoringMode(openScoring);
      setIrSlots(irData);
      setReplacements(replacementsData);
      setScoringRules(rulesData);
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
      setOpenScoringMode(await dbGetOpenScoringMode());
      setIrSlots(await dbGetIR());
      setReplacements(await dbGetReplacements());
      setScoringRules(await dbGetScoringRules());
    }).subscribe();
    const usersSub = supabase.channel("us").on("postgres_changes", { event: "*", schema: "public", table: "users", filter: `league_id=eq.${LEAGUE_ID}` }, async () => {
      setLeagueUsers(await dbGetLeagueUsers());
      if (authUser) setDbUser(await dbGetCurrentUser(authUser.id));
    }).subscribe();

    return () => { scoreSub.unsubscribe(); draftSub.unsubscribe(); movieSub.unsubscribe(); settingsSub.unsubscribe(); usersSub.unsubscribe(); };
  }, [authUser]);

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

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2000); }
  function toggleDark() { setDarkMode(d => { localStorage.setItem("darkMode", !d); return !d; }); }
  async function signOut() { await supabase.auth.signOut(); setAuthUser(null); setDbUser(null); }

  function requireAuth(action) {
    if (openScoringMode || isCommissioner || isAssigned) { action(); }
    else { setShowAuthModal(true); }
  }

  async function toggleOpenScoringMode() {
    const next = !openScoringMode;
    setOpenScoringMode(next);
    await dbSetOpenScoringMode(next);
    showToast(next ? "Open Scoring Mode enabled" : "Commissioner Scoring Mode enabled");
  }

  async function updateLeagueName(name) { setLeagueName(name); await dbSet("league_name", name); showToast("Saved"); }

  async function updateScoringRules(rules) {
    setScoringRules(rules);
    await dbSetScoringRules(rules);
    showToast("Scoring rules applied");
  }

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
  async function updateScoringMulti(film, fields) {
    // Save multiple fields atomically — avoids stale state from sequential updateScoring calls
    const updated = { ...(scoring[film] || {}), ...fields };
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
    // If this round slot currently holds the player's IR'd film, filling it with a new film
    // permanently tags that new film as a replacement pick (one IR per team, so this only ever fires once).
    const priorFilm = (draft[player] || [])[roundIdx];
    const irFilm = irSlots[player] || null;
    if (film && irFilm && priorFilm === irFilm && !replacements[player]) {
      const updatedReplacements = { ...replacements, [player]: film };
      setReplacements(updatedReplacements);
      await dbSetReplacements(updatedReplacements);
    }
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
            await dbSetScore(film, updatedFields);
            boUpdated++;
            resolvedHasBoxOffice = true;
          }
        } else if (!manuallyUnreleased) {
          if (resolvedTmdbId || resolvedReleaseYear) {
            const updatedData = { ...currentScoring, tmdbId: resolvedTmdbId, releaseYear: resolvedReleaseYear };
            setScoring(prev => ({ ...prev, [film]: updatedData }));
            await dbSetScore(film, updatedData);
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
              await dbSetScore(film, updatedData);
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
      await dbSetScore(film, merged);
    }
    showToast(`"${film}": ${messages.join(", ")}`);
  }

  async function applyUnreleasedData(film, candidate) {
    const updated = { ...(scoring[film] || {}), ...candidate, released: true };
    setScoring(prev => ({ ...prev, [film]: updated }));
    await dbSetScore(film, updated);
    showToast(`${film} marked Released and data applied`);
  }

  const scoringWithMeta = { ...scoring, ...(scoring["_meta"] || {}) };

  async function placeOnIR(player, film) {
    const updated = { ...irSlots, [player]: film };
    setIrSlots(updated);
    await dbSetIR(updated);
    showToast(`${film} placed on IR`);
  }

  async function removeFromIR(player) {
    const updated = { ...irSlots };
    delete updated[player];
    setIrSlots(updated);
    await dbSetIR(updated);
    showToast("Removed from IR");
  }

  function getPlayerTotal(player) {
    const irFilm = irSlots[player];
    return (draft[player] || []).reduce((sum, film) => {
      if (!film) return sum;
      if (film === irFilm) return sum; // IR film scores 0
      return sum + calcFilmScore(film, scoringWithMeta, scoringRules);
    }, 0);
  }

  function goToPlayerDraft(player) { setDraftFocusPlayer(player); setTab("draft board"); }
  function goToFilmScoring(film) { setScoringFilm(film); setTab("scoring"); }

  const rankedPlayers = [...players].sort((a, b) => getPlayerTotal(b) - getPlayerTotal(a));

  const css = `* { box-sizing: border-box; margin: 0; padding: 0; } body { background: ${t.bg}; } select { appearance: none; -webkit-appearance: none; } input[type=checkbox] { accent-color: ${t.gold}; width: 15px; height: 15px; cursor: pointer; } .clickable:hover { opacity: 0.75; }`;

  if (authLoading || dataLoading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: t.bg, color: t.textMuted, fontFamily: "system-ui", fontSize: 14 }}>Loading…</div>;

  // Only show waiting page if logged in but not yet assigned (and not commissioner)
  if (authUser && !isCommissioner && !isAssigned) return <WaitingPage t={t} user={authUser} onSignOut={signOut} />;

  const tabs = ["leaderboard","draft board","scoring","settings"];
  if (isCommissioner) tabs.push("commissioner", "league management");

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
          {openScoringMode && isCommissioner && <span style={{ fontSize: 11, color: t.gold, border: `0.5px solid ${t.gold}`, padding: "2px 7px", borderRadius: 4, fontWeight: 600 }}>Open Scoring Mode</span>}
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
          <button key={tb} onClick={() => requestTabChange(tb)} style={{ padding: "12px 16px", fontSize: 13, fontWeight: tab === tb ? 600 : 400, color: tab === tb ? t.navActive : (tb === "commissioner" || tb === "league management") ? t.gold : t.navInactive, borderBottom: tab === tb ? `2px solid ${(tab === "commissioner" || tab === "league management") ? t.gold : t.navActive}` : "2px solid transparent", background: "none", border: "none", borderBottom: tab === tb ? `2px solid ${(tab === "commissioner" || tab === "league management") ? t.gold : t.navActive}` : "2px solid transparent", cursor: "pointer" }}>{tb}</button>
        ))}
      </nav>

      <main style={{ maxWidth: 880, margin: "0 auto", padding: "1.5rem" }}>
        {tab === "leaderboard"  && <Leaderboard rankedPlayers={rankedPlayers} getPlayerTotal={getPlayerTotal} draft={draft} scoring={scoringWithMeta} t={t} goToPlayerDraft={goToPlayerDraft} irSlots={irSlots} rules={scoringRules} />}
        {tab === "draft board"  && <DraftBoard draft={draft} players={players} movies={movies} canEdit={canEdit} isCommissioner={isCommissioner} openScoringMode={openScoringMode} updateDraftPick={updateDraftPick} requireAuth={requireAuth} scoring={scoringWithMeta} goToFilmScoring={goToFilmScoring} t={t} focusPlayer={draftFocusPlayer} addMovie={addMovie} irSlots={irSlots} placeOnIR={placeOnIR} removeFromIR={removeFromIR} replacements={replacements} rules={scoringRules} />}
        {tab === "scoring"      && <Scoring scoring={scoringWithMeta} movies={movies} canEdit={canEdit} isCommissioner={isCommissioner} requireAuth={requireAuth} updateScoring={updateScoring} updateScoringMulti={updateScoringMulti} updateScoringRoot={updateScoringRoot} updateOscarField={updateOscarField} updateMovieName={updateMovieName} scoringFilm={scoringFilm} setScoringFilm={setScoringFilm} showToast={showToast} fetchFilmScoring={fetchFilmScoring} t={t} rules={scoringRules} />}
        {tab === "settings"     && <Settings movies={movies} players={players} canEdit={canEdit} myPlayerName={myPlayerName} openScoringMode={openScoringMode} updateMovieName={updateMovieName} addMovie={addMovie} renamePlayer={renamePlayer} t={t} showToast={showToast} requireAuth={requireAuth} isCommissioner={isCommissioner} searchTMDB={searchTMDB} scoring={scoringWithMeta} />}
        {tab === "commissioner" && isCommissioner && <CommissionerSettings leagueName={leagueName} updateLeagueName={updateLeagueName} openScoringMode={openScoringMode} toggleOpenScoringMode={toggleOpenScoringMode} leagueUsers={leagueUsers} players={players} assignPlayer={assignPlayer} t={t} showToast={showToast} movies={movies} backfillPosters={backfillPosters} backfillScoring={backfillScoring} scoring={scoringWithMeta} deleteMovie={deleteMovie} draft={draft} applyUnreleasedData={applyUnreleasedData} />}
        {tab === "league management" && isCommissioner && <LeagueManagement rules={scoringRules} updateScoringRules={updateScoringRules} onDirtyChange={setLmDirty} t={t} showToast={showToast} />}
      </main>
    </div>
  );
}
