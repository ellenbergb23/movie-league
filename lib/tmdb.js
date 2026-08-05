const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || "";

export async function searchTMDB(query) {
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
