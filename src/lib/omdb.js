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

export function extractRTScores(omdbData) {
  if (!omdbData || !omdbData.Ratings || !Array.isArray(omdbData.Ratings)) {
    return { criticsRT: "", audienceRT: "", criticsRTRaw: null, audienceRTRaw: null };
  }

  // RT critics score comes in the Ratings array on all tiers
  const rtRating = omdbData.Ratings.find(r => r.Source === "Rotten Tomatoes");
  if (!rtRating) {
    return { criticsRT: "", audienceRT: "", criticsRTRaw: null, audienceRTRaw: null };
  }

  const criticsScore = parseInt(rtRating.Value);
  if (isNaN(criticsScore)) {
    return { criticsRT: "", audienceRT: "", criticsRTRaw: null, audienceRTRaw: null };
  }

  let criticsRT = "";
  if (criticsScore >= 90) criticsRT = "90%+ (7pts)";
  else if (criticsScore >= 60) criticsRT = "Fresh 60-89% (2pts)";
  else criticsRT = "Rotten (0pts)";

  return {
    criticsRT,
    audienceRT: "",
    criticsRTRaw: criticsScore,
    audienceRTRaw: null,
  };
}
