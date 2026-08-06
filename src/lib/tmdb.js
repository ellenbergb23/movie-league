const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || "";

export async function searchTMDB(query) {
  if (!TMDB_API_KEY) return [];
  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&sort_by=popularity.desc`);
    const data = await res.json();
    const ALLOWED_YEARS = ["2025", "2026", "2027"];
    return (data.results || [])
      .filter(r => r.poster_path)
      .filter(r => r.release_date && ALLOWED_YEARS.includes(r.release_date.slice(0, 4)))
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

export async function getTMDBDetails(tmdbId) {
  if (!TMDB_API_KEY) return null;
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}`);
    const data = await res.json();
    return {
      revenue: data.revenue || null,
      releaseDate: data.release_date || null,
    };
  } catch (e) {
    console.error("TMDB details fetch failed:", e);
    return null;
  }
}

export async function getTMDBWideReleaseDate(tmdbId) {
  if (!TMDB_API_KEY || !tmdbId) return null;
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/release_dates?api_key=${TMDB_API_KEY}`);
    const data = await res.json();
    const usEntry = (data.results || []).find(r => r.iso_3166_1 === "US");
    if (!usEntry) return null;
    const dates = usEntry.release_dates || [];
    const wide = dates.find(d => d.type === 3);
    if (wide?.release_date) return wide.release_date.slice(0, 10);
    const limited = dates.find(d => d.type === 2);
    if (limited?.release_date) return limited.release_date.slice(0, 10);
    if (dates[0]?.release_date) return dates[0].release_date.slice(0, 10);
    return null;
  } catch (e) {
    console.error("TMDB release dates fetch failed:", e);
    return null;
  }
}

export async function getTMDBBoxOffice(title, year = null) {
  if (!TMDB_API_KEY) return null;
  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`);
    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;
    const results = data.results.filter(r => r.title && r.release_date);
    const ALLOWED_YEARS = ["2025", "2026", "2027"];

    let best;
    if (year) {
      // Explicit year requested — exact title + that year
      best = results.find(r =>
        r.title.trim().toLowerCase() === title.trim().toLowerCase() &&
        r.release_date.startsWith(year)
      );
    } else {
      // No year given — prefer an exact-title match within the league's active years first,
      // to avoid grabbing an unrelated same-titled film from another year (e.g. a 2024 foreign
      // film sharing a title with a 2026 US release).
      best = results.find(r =>
        r.title.trim().toLowerCase() === title.trim().toLowerCase() &&
        ALLOWED_YEARS.includes(r.release_date.slice(0, 4))
      );
    }
    if (!best) {
      // Fall back to exact title match regardless of year
      best = results.find(r => r.title.trim().toLowerCase() === title.trim().toLowerCase());
    }
    if (!best) {
      // No genuine title match at all (e.g. the league's saved title doesn't exactly match
      // the real film's title) — report not-found rather than guessing with an unrelated film.
      return null;
    }
    if (!best || !best.id) return null;
    const details = await getTMDBDetails(best.id);
    const releaseYear = details?.releaseDate ? details.releaseDate.slice(0, 4) : null;
    return { revenue: details?.revenue || null, tmdbId: best.id, releaseYear };
  } catch (e) {
    console.error("TMDB box office search failed:", e);
    return null;
  }
}
