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
  let total = getBOPoints(fs.bo || "", rules) + getBOBonusPoints(revenueMillions, rules.boBonuses);

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

export function getPlayerReleaseStats(player, draft, scoring, irFilm = null, rules = DEFAULT_SCORING_RULES) {
  const films = (draft[player] || []).filter(Boolean);
  let released = 0, unreleased = 0, releasedTotal = 0, onIR = 0;
  films.forEach(film => {
    if (film === irFilm) { onIR++; return; }
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
