const OMDB_API_KEY = import.meta.env.VITE_OMDB_API_KEY || "";

// Builds an ordered list of title variants to try against OMDb.
// OMDb uses exact title matching, so small differences cause misses.
// We try the most specific variant first and fall back progressively.
function getTitleVariants(title) {
  const variants = [title]; // always try exact title first
  const lower = title.toLowerCase();

  // & -> "and" (e.g. "Minions & Monsters" -> "Minions and Monsters",
  //              "Mandalorian & Grogu" -> "Mandalorian and Grogu")
  if (title.includes("&")) {
    variants.push(title.replace(/&/g, "and").replace(/\s+/g, " ").trim());
  }

  // Prepend "The" (e.g. "Backrooms" -> "The Backrooms")
  if (!lower.startsWith("the ")) {
    variants.push("The " + title);
  }

  // Strip leading "The" (e.g. "The Batman" -> "Batman", in case OMDb drops it)
  if (lower.startsWith("the ")) {
    variants.push(title.slice(4));
  }

  // Deduplicate while preserving order
  return [...new Set(variants)];
}

async function fetchOMDb(title, yearParam) {
  const res = await fetch(
    `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(title)}&type=movie${yearParam}`
  );
  const data = await res.json();
  return data.Response !== "False" ? data : null;
}

export async function getOMDbData(title, year = null) {
  if (!OMDB_API_KEY) {
    console.warn("OMDb API key not set. Add VITE_OMDB_API_KEY to .env.local");
    return null;
  }
  try {
    const yearParam = year ? `&y=${year}` : "";
    const variants = getTitleVariants(title);
    for (const variant of variants) {
      const result = await fetchOMDb(variant, yearParam);
      if (result) return result;
    }
    return null;
  } catch (e) {
    console.error("OMDb fetch failed:", e);
    return null;
  }
}

export function extractRTScores(omdbData) {
  if (!omdbData || !omdbData.Ratings || !Array.isArray(omdbData.Ratings)) {
    return { criticsRT: "", audienceRT: "", criticsRTRaw: null, audienceRTRaw: null };
  }

  // RT critics score comes in the Ratings array
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
