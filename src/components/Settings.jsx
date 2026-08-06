import { useState } from "react";
import { PLAYER_COLORS } from "../lib/constants";
import { SL, Card, Poster } from "./ui";

export function Settings({ movies, players, canEdit, myPlayerName, openScoringMode, updateMovieName, addMovie, renamePlayer, t, showToast, requireAuth, isCommissioner, searchTMDB, scoring }) {
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [playerVal, setPlayerVal] = useState("");
  const [editingFilm, setEditingFilm] = useState(null);
  const [filmVal, setFilmVal] = useState("");
  // One combined search box drives both "add a new film" (via TMDB) and "find an existing
  // film to rename" — previously these were two separate inputs doing overlapping jobs.
  const [filmQuery, setFilmQuery] = useState("");
  const [tmdbSearchResults, setTmdbSearchResults] = useState([]);
  const [showTmdbResults, setShowTmdbResults] = useState(false);
  const [tmdbLoading, setTmdbLoading] = useState(false);

  const filtered = filmQuery ? movies.filter(m => m.toLowerCase().includes(filmQuery.toLowerCase())) : [];
  const inp = { fontSize: 13, padding: "7px 10px", borderRadius: 4, border: `0.5px solid ${t.borderStrong}`, background: t.surface2, color: t.text };

  function withAuth(fn) { if (canEdit) fn(); else requireAuth(fn); }

  async function handleTmdbSearch(query) {
    if (!query.trim()) { setTmdbSearchResults([]); setShowTmdbResults(false); return; }
    setTmdbLoading(true);
    const results = await searchTMDB(query);
    setTmdbSearchResults(results);
    setShowTmdbResults(true);
    setTmdbLoading(false);
  }

  function selectTmdbFilm(title, poster_path) {
    setFilmQuery(title);
    setShowTmdbResults(false);
    // Store poster data for this film
    if (poster_path) {
      sessionStorage.setItem(`poster_${title}`, poster_path);
    }
  }

  function handleAddFilm() {
    if (!filmQuery.trim()) return;
    withAuth(() => {
      const poster_path = sessionStorage.getItem(`poster_${filmQuery}`);
      addMovie(filmQuery, poster_path);
      sessionStorage.removeItem(`poster_${filmQuery}`);
      setFilmQuery("");
      setShowTmdbResults(false);
    });
  }

  return (
    <div>
      <SL t={t}>your team name</SL>
      <div style={{ background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
        {players.map((player, i) => {
          const isMe = player === myPlayerName;
          const canRename = isMe || isCommissioner || openScoringMode;
          return (
            <div key={player} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", borderBottom: i < players.length - 1 ? `0.5px solid ${t.border}` : "none", background: isMe ? t.goldBg : i % 2 === 0 ? t.surface : t.rowAlt }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: PLAYER_COLORS[i % PLAYER_COLORS.length], display: "inline-block", flexShrink: 0 }} />
              {editingPlayer === player ? (
                <>
                  <input value={playerVal} onChange={e => setPlayerVal(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { renamePlayer(player, playerVal); setEditingPlayer(null); } if (e.key === "Escape") setEditingPlayer(null); }} autoFocus style={{ flex: 1, fontSize: 13, padding: "5px 9px", borderRadius: 6, border: `0.5px solid ${t.borderStrong}`, background: t.surface2, color: t.text }} />
                  <button onClick={() => { renamePlayer(player, playerVal); setEditingPlayer(null); }} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "none", background: t.gold, color: "#fff", cursor: "pointer", fontWeight: 600 }}>Save</button>
                  <button onClick={() => setEditingPlayer(null)} style={{ fontSize: 12, padding: "5px 10px", borderRadius: 6, border: `0.5px solid ${t.border}`, background: "transparent", color: t.textMuted, cursor: "pointer" }}>Cancel</button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1, fontSize: 13, color: t.text, fontWeight: isMe ? 600 : 400 }}>{player}{isMe && <span style={{ fontSize: 11, color: t.gold, marginLeft: 8 }}>· you</span>}</span>
                  {canRename && <button onClick={() => withAuth(() => { setEditingPlayer(player); setPlayerVal(player); })} style={{ fontSize: 12, color: t.gold, background: "none", border: "none", cursor: "pointer", padding: "2px 6px" }}>rename</button>}
                </>
              )}
            </div>
          );
        })}
      </div>

      <SL t={t}>film management</SL>
      <Card t={t} style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", gap: 8, position: "relative" }}>
          <input
            value={filmQuery}
            onChange={e => {
              setFilmQuery(e.target.value);
              setEditingFilm(null);
              if (e.target.value.trim()) handleTmdbSearch(e.target.value);
              else setShowTmdbResults(false);
            }}
            onKeyDown={e => { if (e.key === "Enter" && !filtered.includes(filmQuery)) handleAddFilm(); }}
            placeholder="Search films to rename, or add a new one…"
            style={{ ...inp, flex: 1 }}
          />
          <button onClick={handleAddFilm} disabled={!filmQuery.trim()} style={{ fontSize: 13, padding: "7px 16px", borderRadius: 4, border: "none", background: filmQuery.trim() ? t.gold : t.border, color: "#fff", cursor: filmQuery.trim() ? "pointer" : "default", fontWeight: 600, whiteSpace: "nowrap" }}>Add new</button>
          {showTmdbResults && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 90, background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 4, marginTop: 4, zIndex: 10, maxHeight: 200, overflowY: "auto" }}>
              {tmdbLoading && <div style={{ padding: "12px 14px", fontSize: 12, color: t.textMuted }}>Searching…</div>}
              {!tmdbLoading && tmdbSearchResults.length > 0 && tmdbSearchResults.map(r => {
                const year = r.release_date ? r.release_date.slice(0, 4) : null;
                return (
                  <div key={r.tmdbId} onClick={() => selectTmdbFilm(r.title, r.poster_path)} style={{ padding: "10px 14px", borderBottom: `0.5px solid ${t.border}`, cursor: "pointer", display: "flex", gap: 10, alignItems: "center", fontSize: 13, color: t.text }} onMouseEnter={e => e.currentTarget.style.background = t.surface2} onMouseLeave={e => e.currentTarget.style.background = t.surface}>
                    {r.poster && <img src={r.poster} alt="" style={{ width: 30, height: 45, borderRadius: 4, objectFit: "cover" }} />}
                    <span style={{ flex: 1 }}>{r.title}</span>
                    {year && <span style={{ fontSize: 12, color: t.textMuted, fontFamily: "monospace" }}>{year}</span>}
                  </div>
                );
              })}
              {!tmdbLoading && tmdbSearchResults.length === 0 && <div style={{ padding: "12px 14px", fontSize: 12, color: t.textMuted }}>No TMDB matches — "Add new" will add it manually</div>}
            </div>
          )}
        </div>
        {filmQuery && <p style={{ fontSize: 11, color: t.textMuted, marginTop: 8 }}>{filtered.length} existing film{filtered.length !== 1 ? "s" : ""} match{filtered.length === 1 ? "es" : ""} — pick one below to rename, or "Add new" to add it as a new film.</p>}
      </Card>
      {filtered.length > 0 && (
        <div style={{ background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 4, overflow: "hidden" }}>
          {filtered.map((film, i) => (
            <div key={film} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", borderBottom: i < filtered.length - 1 ? `0.5px solid ${t.border}` : "none", background: i % 2 === 0 ? t.surface : t.rowAlt }}>
              <Poster film={film} scoring={scoring} size="small" t={t} />
              {editingFilm === film ? (
                <>
                  <input value={filmVal} onChange={e => setFilmVal(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { updateMovieName(film, filmVal); setEditingFilm(null); setFilmQuery(""); } if (e.key === "Escape") setEditingFilm(null); }} autoFocus style={{ flex: 1, fontSize: 13, padding: "5px 9px", borderRadius: 4, border: `0.5px solid ${t.borderStrong}`, background: t.surface2, color: t.text }} />
                  <button onClick={() => { updateMovieName(film, filmVal); setEditingFilm(null); setFilmQuery(""); }} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 4, border: "none", background: t.gold, color: "#fff", cursor: "pointer", fontWeight: 600 }}>Save</button>
                  <button onClick={() => setEditingFilm(null)} style={{ fontSize: 12, padding: "5px 10px", borderRadius: 4, border: `0.5px solid ${t.border}`, background: "transparent", color: t.textMuted, cursor: "pointer" }}>Cancel</button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1, fontSize: 13, color: t.text }}>{film}</span>
                  <button onClick={() => withAuth(() => { setEditingFilm(film); setFilmVal(film); })} style={{ fontSize: 12, color: t.gold, background: "none", border: "none", cursor: "pointer", padding: "2px 6px" }}>rename</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      {filmQuery && filtered.length === 0 && !showTmdbResults && <p style={{ fontSize: 13, color: t.textMuted, textAlign: "center", padding: "20px 0" }}>No existing films match "{filmQuery}"</p>}
    </div>
  );
}
