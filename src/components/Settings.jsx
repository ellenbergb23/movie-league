import { useState } from "react";
import { PLAYER_COLORS } from "../lib/constants";
import { SL, Card, Poster } from "./ui";

export function Settings({ movies, players, canEdit, myPlayerName, marxistMode, updateMovieName, addMovie, renamePlayer, t, showToast, requireAuth, isCommissioner, searchTMDB, scoring }) {
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [playerVal, setPlayerVal] = useState("");
  const [editingFilm, setEditingFilm] = useState(null);
  const [filmVal, setFilmVal] = useState("");
  const [newFilm, setNewFilm] = useState("");
  const [search, setSearch] = useState("");
  const [tmdbSearchResults, setTmdbSearchResults] = useState([]);
  const [tmdbSearchQuery, setTmdbSearchQuery] = useState("");
  const [showTmdbResults, setShowTmdbResults] = useState(false);
  const [tmdbLoading, setTmdbLoading] = useState(false);

  const filtered = movies.filter(m => m.toLowerCase().includes(search.toLowerCase()));
  const inp = { fontSize: 13, padding: "7px 10px", borderRadius: 7, border: `0.5px solid ${t.borderStrong}`, background: t.surface2, color: t.text };

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
    setNewFilm(title);
    setShowTmdbResults(false);
    setTmdbSearchQuery("");
    // Store poster data for this film
    if (poster_path) {
      sessionStorage.setItem(`poster_${title}`, poster_path);
    }
  }

  return (
    <div>
      <SL t={t}>your team name</SL>
      <div style={{ background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
        {players.map((player, i) => {
          const isMe = player === myPlayerName;
          const canRename = isMe || isCommissioner || marxistMode;
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
      <Card t={t} style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, position: "relative" }}>
          <input 
            value={newFilm} 
            onChange={e => { 
              setNewFilm(e.target.value); 
              if (e.target.value.trim()) {
                setTmdbSearchQuery(e.target.value);
                handleTmdbSearch(e.target.value);
              }
            }} 
            onKeyDown={e => { if (e.key === "Enter" && newFilm.trim()) { withAuth(() => { addMovie(newFilm); setNewFilm(""); setShowTmdbResults(false); }); } }} 
            placeholder="Search films or add manually..." 
            style={{ ...inp, flex: 1 }} 
          />
          <button onClick={() => { if (newFilm.trim()) withAuth(() => { const poster_path = sessionStorage.getItem(`poster_${newFilm}`); addMovie(newFilm, poster_path); setNewFilm(""); setShowTmdbResults(false); sessionStorage.removeItem(`poster_${newFilm}`); }); }} style={{ fontSize: 13, padding: "7px 16px", borderRadius: 7, border: "none", background: t.gold, color: "#fff", cursor: "pointer", fontWeight: 600 }}>Add</button>
          {showTmdbResults && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 60, background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 8, marginTop: 4, zIndex: 10, maxHeight: 200, overflowY: "auto" }}>
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
              {!tmdbLoading && tmdbSearchResults.length === 0 && <div style={{ padding: "12px 14px", fontSize: 12, color: t.textMuted }}>No results found</div>}
            </div>
          )}
        </div>
      </Card>
      <Card t={t} style={{ marginBottom: 10 }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setEditingFilm(null); }} placeholder="Search films to rename..." style={{ ...inp, width: "100%" }} />
        {search && <p style={{ fontSize: 11, color: t.textMuted, marginTop: 6 }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>}
      </Card>
      {filtered.length > 0 && search && (
        <div style={{ background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 10, overflow: "hidden" }}>
          {filtered.map((film, i) => (
            <div key={film} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", borderBottom: i < filtered.length - 1 ? `0.5px solid ${t.border}` : "none", background: i % 2 === 0 ? t.surface : t.rowAlt }}>
              <Poster film={film} scoring={scoring} size="small" t={t} />
              {editingFilm === film ? (
                <>
                  <input value={filmVal} onChange={e => setFilmVal(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { updateMovieName(film, filmVal); setEditingFilm(null); setSearch(""); } if (e.key === "Escape") setEditingFilm(null); }} autoFocus style={{ flex: 1, fontSize: 13, padding: "5px 9px", borderRadius: 6, border: `0.5px solid ${t.borderStrong}`, background: t.surface2, color: t.text }} />
                  <button onClick={() => { updateMovieName(film, filmVal); setEditingFilm(null); setSearch(""); }} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "none", background: t.gold, color: "#fff", cursor: "pointer", fontWeight: 600 }}>Save</button>
                  <button onClick={() => setEditingFilm(null)} style={{ fontSize: 12, padding: "5px 10px", borderRadius: 6, border: `0.5px solid ${t.border}`, background: "transparent", color: t.textMuted, cursor: "pointer" }}>Cancel</button>
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
      {search && filtered.length === 0 && <p style={{ fontSize: 13, color: t.textMuted, textAlign: "center", padding: "20px 0" }}>No films match "{search}"</p>}
    </div>
  );
}
