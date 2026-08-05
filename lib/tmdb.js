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

/**
 * Fetch detailed movie info from TMDB including box office revenue
 * Returns revenue in dollars (worldwide total)
 */
export async function getTMDBDetails(tmdbId) {
  if (!TMDB_API_KEY) return null;
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}`);
    const data = await res.json();
    if (!data.revenue) return null;
    return { revenue: data.revenue, releaseDate: data.release_date };
  } catch (e) {
    console.error("TMDB details fetch failed:", e);
    return null;
  }
}

/**
 * Search TMDB for a movie by title/year and get box office details
 * Returns revenue in dollars or null if not found
 */
export async function getTMDBBoxOffice(title, year = null) {
  if (!TMDB_API_KEY) return null;
  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`);
    const data = await res.json();
    
    if (!data.results || data.results.length === 0) return null;
    
    // Find exact or near-exact match, preferring the specified year
    const results = data.results.filter(r => r.title && r.release_date);
    
    let best = results.find(r => 
      r.title.trim().toLowerCase() === title.trim().toLowerCase() &&
      (year ? r.release_date.startsWith(year) : true)
    );
    
    if (!best && year) {
      best = results.find(r => r.release_date.startsWith(year));
    }
    
    if (!best) best = results[0];
    
    if (!best || !best.id) return null;
    
    // Fetch details to get revenue
    const details = await getTMDBDetails(best.id);
    return details?.revenue || null;
  } catch (e) {
    console.error("TMDB box office search failed:", e);
    return null;
  }
}
