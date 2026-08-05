import { OSCAR_CATEGORIES, BO_TIERS } from "./constants";

export function getRTPoints(c, a) {
  let p = 0;
  if (c === "90%+ (7pts)") p += 7;
  else if (c === "Fresh 60-89% (2pts)") p += 2;
  if (a === "90%+ (5pts)") p += 5;
  return p;
}
export function getBOPoints(label) { return BO_TIERS.find(t => t.label === label)?.pts || 0; }

export function calcFilmScore(film, scoring) {
  if (!film || !scoring) return 0;
  const fs = scoring[film]; if (!fs) return 0;
  let total = getBOPoints(fs.bo || "") + getRTPoints(fs.criticsRT || "", fs.audienceRT || "");
  OSCAR_CATEGORIES.forEach((cat, i) => {
    if ((fs.oscarNoms?.[i] || []).includes(film)) total += cat.nomPts;
    if ((fs.oscarWinner?.[i] || "") === film) total += cat.winPts;
  });
  if (scoring._biggestOpeningFilm === film) total += 1;
  if (scoring._mostNumber1Film === film) total += 1;
  if (fs.seenFilm) total += 1;
  return total;
}

export function getFilmOscarStatus(film, scoring) {
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

export function getPlayerOscarTotals(player, draft, scoring) {
  let noms = 0, wins = 0;
  (draft[player] || []).forEach(film => {
    if (!film) return;
    const s = getFilmOscarStatus(film, scoring);
    noms += s.totalNoms; wins += s.totalWins;
  });
  return { noms, wins };
}

export function getPlayerReleaseStats(player, draft, scoring) {
  const films = (draft[player] || []).filter(Boolean);
  let released = 0, unreleased = 0, releasedTotal = 0;
  films.forEach(film => {
    if (isFilmReleased(film, scoring)) {
      released++;
      releasedTotal += calcFilmScore(film, scoring);
    } else {
      unreleased++;
    }
  });
  const avgScore = released > 0 ? releasedTotal / released : null;
  return { released, unreleased, avgScore };
}

export function isFilmReleased(film, scoring) {
  const fs = scoring?.[film];
  if (!fs) return false;
  // Dynamic: released if ANY scoring field currently has a value. Clearing all fields reverts to "Unreleased".
  if (fs.bo) return true;
  if (fs.criticsRT) return true;
  if (fs.audienceRT) return true;
  if (fs.seenFilm) return true;
  if ((fs.oscarNoms || []).some(arr => (arr || []).length > 0)) return true;
  if ((fs.oscarWinner || []).some(w => w)) return true;
  return false;
}
