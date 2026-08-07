import { DEFAULT_SCORING_RULES, getBOTierPointsByLabel, getBOBonusPoints, getCriticsPoints, getAudiencePoints } from "./scoringRules";

// Legacy string-encoded RT points, kept only as a fallback for old rows saved before
// per-film raw % values (criticsRTRaw / audienceRTRaw) existed.
export function getRTPoints(c, a) {
  let p = 0;
  if (c === "90%+ (7pts)") p += 7;
  else if (c === "Fresh 60-89% (2pts)") p += 2;
  if (a === "90%+ (5pts)") p += 5;
  return p;
}
export function getBOPoints(label, rules = DEFAULT_SCORING_RULES) { return getBOTierPointsByLabel(label, rules.boTiers); }

export function calcFilmScore(film, scoring, rules = DEFAULT_SCORING_RULES) {
  if (!film || !scoring) return 0;
  const fs = scoring[film]; if (!fs) return 0;

  const revenueMillions = fs.boRaw != null ? fs.boRaw / 1_000_000 : null;
  const boTiersOn = rules.boTiersEnabled !== false;
  let total = boTiersOn ? (getBOPoints(fs.bo || "", rules) + getBOBonusPoints(revenueMillions, rules.boBonuses)) : 0;

  // Prefer raw % scores against current breakpoints (keeps scores retroactively accurate
  // when a commissioner edits breakpoints); fall back to legacy stored string tiers.
  if (fs.criticsRTRaw != null || fs.audienceRTRaw != null) {
    total += getCriticsPoints(fs.criticsRTRaw, rules) + getAudiencePoints(fs.audienceRTRaw, rules);
  } else {
    total += getRTPoints(fs.criticsRT || "", fs.audienceRT || "");
  }

  const oscarCats = rules.oscarCategories || DEFAULT_SCORING_RULES.oscarCategories;
  oscarCats.forEach((cat, i) => {
    if (cat.enabled === false) return;
    if ((fs.oscarNoms?.[i] || []).includes(film)) total += cat.nomPts;
    if ((fs.oscarWinner?.[i] || "") === film) total += cat.winPts;
  });

  if (rules.openingWeekendBonus?.enabled !== false && scoring._biggestOpeningFilm === film) total += rules.openingWeekendBonus?.pts ?? 1;
  if (rules.weeksNumber1Bonus?.enabled !== false && scoring._mostNumber1Film === film) total += rules.weeksNumber1Bonus?.pts ?? 1;
  if (rules.seenFilm?.enabled !== false && fs.seenFilm) total += rules.seenFilm?.pts ?? 1;
  return total;
}

// Returns a structured, category-by-category breakdown of a film's score — used by the
// Draft Board's compact scoring-breakdown view. Only categories that actually contributed
// points are included (BO/Critics/Audience are omitted individually if they scored 0; Oscar
// categories are omitted entirely unless nominated/won).
export function getFilmScoreBreakdown(film, scoring, rules = DEFAULT_SCORING_RULES) {
  const fs = scoring?.[film];
  if (!fs) return [];
  const items = [];

  const revenueMillions = fs.boRaw != null ? fs.boRaw / 1_000_000 : null;
  const boTiersOn = rules.boTiersEnabled !== false;
  if (boTiersOn) {
    const boPts = getBOPoints(fs.bo || "", rules) + getBOBonusPoints(revenueMillions, rules.boBonuses);
    if (fs.bo && boPts > 0) items.push({ label: "Box Office", value: fs.bo, pts: boPts });
  }

  if (fs.criticsRTRaw != null || fs.audienceRTRaw != null) {
    const criticsPts = getCriticsPoints(fs.criticsRTRaw, rules);
    const audiencePts = getAudiencePoints(fs.audienceRTRaw, rules);
    if (criticsPts > 0) items.push({ label: "Critics (RT)", value: `${fs.criticsRTRaw}%+`, pts: criticsPts });
    if (audiencePts > 0) items.push({ label: "Audience (RT)", value: `${fs.audienceRTRaw}%+`, pts: audiencePts });
  } else {
    const legacyPts = getRTPoints(fs.criticsRT || "", fs.audienceRT || "");
    if (legacyPts > 0) items.push({ label: "Critics/Audience (RT)", value: "", pts: legacyPts });
  }

  const oscarCats = rules.oscarCategories || DEFAULT_SCORING_RULES.oscarCategories;
  oscarCats.forEach((cat, i) => {
    if (cat.enabled === false) return;
    const nominated = (fs.oscarNoms?.[i] || []).includes(film);
    const won = (fs.oscarWinner?.[i] || "") === film;
    if (won) items.push({ label: cat.name, value: "Won", pts: cat.winPts });
    else if (nominated) items.push({ label: cat.name, value: "Nom", pts: cat.nomPts });
  });

  if (rules.openingWeekendBonus?.enabled !== false && scoring._biggestOpeningFilm === film) {
    items.push({ label: "Biggest Opening", value: "", pts: rules.openingWeekendBonus?.pts ?? 1 });
  }
  if (rules.weeksNumber1Bonus?.enabled !== false && scoring._mostNumber1Film === film) {
    items.push({ label: "Most Weeks #1", value: "", pts: rules.weeksNumber1Bonus?.pts ?? 1 });
  }
  if (rules.seenFilm?.enabled !== false && fs.seenFilm) {
    items.push({ label: "Seen It", value: "", pts: rules.seenFilm?.pts ?? 1 });
  }

  return items;
}

export function getFilmOscarStatus(film, scoring, rules = DEFAULT_SCORING_RULES) {
  const fs = scoring?.[film];
  if (!fs) return { nominated: false, winner: false, totalNoms: 0, totalWins: 0 };
  const oscarCats = rules.oscarCategories || DEFAULT_SCORING_RULES.oscarCategories;
  let totalNoms = 0, totalWins = 0;
  oscarCats.forEach((_, i) => {
    if ((fs.oscarNoms?.[i] || []).includes(film)) totalNoms++;
    if ((fs.oscarWinner?.[i] || "") === film) totalWins++;
  });
  return {
    nominated: (fs.oscarNoms?.[0] || []).includes(film),
    winner: (fs.oscarWinner?.[0] || "") === film,
    totalNoms, totalWins,
  };
}

export function getPlayerOscarTotals(player, draft, scoring, rules = DEFAULT_SCORING_RULES) {
  let noms = 0, wins = 0;
  (draft[player] || []).forEach(film => {
    if (!film) return;
    const s = getFilmOscarStatus(film, scoring, rules);
    noms += s.totalNoms; wins += s.totalWins;
  });
  return { noms, wins };
}

export function getPlayerReleaseStats(player, draft, scoring, irFilms = [], rules = DEFAULT_SCORING_RULES) {
  const films = (draft[player] || []).filter(Boolean);
  let released = 0, unreleased = 0, releasedTotal = 0;
  // onIR is derived directly from the IR list, not by scanning picks — once a replacement
  // fills the freed slot, the original IR'd film no longer appears in `draft[player]` at all,
  // so counting it via a picks-array match would silently drop it. This mirrors the fix.
  const onIR = irFilms.length;
  films.forEach(film => {
    if (irFilms.includes(film)) return; // still occupying its slot (no replacement drafted yet) — don't double count
    if (isFilmReleased(film, scoring)) {
      released++;
      releasedTotal += calcFilmScore(film, scoring, rules);
    } else {
      unreleased++;
    }
  });
  const avgScore = released > 0 ? releasedTotal / released : null;
  return { released, unreleased, onIR, avgScore };
}

export function isFilmReleased(film, scoring) {
  const fs = scoring?.[film];
  if (!fs) return false;
  // Dynamic: released if ANY scoring field currently has a value. Clearing all fields reverts to "Unreleased".
  if (fs.bo) return true;
  if (fs.criticsRT || fs.criticsRTRaw != null) return true;
  if (fs.audienceRT || fs.audienceRTRaw != null) return true;
  if (fs.seenFilm) return true;
  if ((fs.oscarNoms || []).some(arr => (arr || []).length > 0)) return true;
  if ((fs.oscarWinner || []).some(w => w)) return true;
  return false;
}
