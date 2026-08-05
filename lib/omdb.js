const OMDB_API_KEY = import.meta.env.VITE_OMDB_API_KEY || "";

export async function getOMDbData(title, year = null) {
  if (!OMDB_API_KEY) {
    console.warn("OMDb API key not set. Add VITE_OMDB_API_KEY to .env.local");
    return null;
  }
  try {
    const yearParam = year ? `&y=${year}` : "";
    const res = await fetch(
      `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(title)}&type=movie${yearParam}`
    );
    const data = await res.json();
    if (data.Response === "False") return null;
    return data;
  } catch (e) {
    console.error("OMDb fetch failed:", e);
    return null;
  }
}

/**
 * Extract Rotten Tomatoes scores from OMDb data
 * Returns { criticsRT, audienceRT } in the format expected by scoring.js
 */
export function extractRTScores(omdbData) {
  if (!omdbData || !omdbData.Ratings) return { criticsRT: "", audienceRT: "" };

  const rtRating = omdbData.Ratings.find(r => r.Source === "Rotten Tomatoes");
  if (!rtRating) return { criticsRT: "", audienceRT: "" };

  const score = rtRating.Value; // e.g., "82%" or "82/100"
  const numScore = parseInt(score);

  if (isNaN(numScore)) return { criticsRT: "", audienceRT: "" };

  // Map critics RT score to our tiers
  let criticsRT = "";
  if (numScore >= 90) criticsRT = "90%+ (7pts)";
  else if (numScore >= 60) criticsRT = "Fresh 60-89% (2pts)";
  else criticsRT = "Rotten (0pts)";

  // For audience, use a looser threshold
  let audienceRT = "";
  if (numScore >= 90) audienceRT = "90%+ (5pts)";
  else audienceRT = "Below 90% (0pts)";

  return { criticsRT, audienceRT };
}
