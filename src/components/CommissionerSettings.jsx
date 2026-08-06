import { useState, useEffect } from "react";
import { SL, Card } from "./ui";

export function CommissionerSettings({ leagueName, updateLeagueName, marxistMode, toggleMarxistMode, leagueUsers, players, assignPlayer, t, showToast, movies, backfillPosters, backfillScoring, scoring, deleteMovie, draft }) {
  const [editingLeague, setEditingLeague] = useState(false);
  const [leagueVal, setLeagueVal] = useState(leagueName);
  const [copied, setCopied] = useState(false);
  const [filmFilter, setFilmFilter] = useState("");
  const [posterProgress, setPosterProgress] = useState(null);
  const [posterRunning, setPosterRunning] = useState(false);
  const [posterResults, setPosterResults] = useState(null);
  const [forceRecheck, setForceRecheck] = useState(false);
  const [scoringProgress, setScoringProgress] = useState(null);
  const [scoringRunning, setScoringRunning] = useState(false);
  const [scoringResults, setScoringResults] = useState(null);
  const [forceRecheckScoring, setForceRecheckScoring] = useState(false);

  async function runBackfill() {
    setPosterRunning(true);
    setPosterResults(null);
    const results = await backfillPosters((current, total, film) => setPosterProgress({ current, total, film }), forceRecheck);
    setPosterRunning(false);
    setPosterProgress(null);
    setPosterResults(results);
  }

  async function runBackfillScoring() {
    setScoringRunning(true);
    setScoringResults(null);
    const results = await backfillScoring((current, total, film) => setScoringProgress({ current, total, film }), forceRecheckScoring);
    setScoringRunning(false);
    setScoringProgress(null);
    setScoringResults(results);
  }

  useEffect(() => { setLeagueVal(leagueName); }, [leagueName]);

  const inviteUrl = window.location.origin;
  const unassigned = leagueUsers.filter(u => !u.player_name);
  const assigned = leagueUsers.filter(u => u.player_name);
  const inp = { fontSize: 13, padding: "7px 10px", borderRadius: 7, border: `0.5px solid ${t.borderStrong}`, background: t.surface2, color: t.text };

  function copyInvite() { navigator.clipboard.writeText(inviteUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }

  // Finds which player currently has this film in a draft board slot, if any.
  function findDraftOwner(film) {
    for (const [player, picks] of Object.entries(draft || {})) {
      if ((picks || []).includes(film)) return player;
    }
    return null;
  }

  function handleRemoveFilm(film) {
    const owner = findDraftOwner(film);
    const msg = owner
      ? `⚠️ "${film}" is currently drafted by ${owner}. Removing it will clear that pick from their board. Continue?`
      : `Remove "${film}" from the league? This can't be undone.`;
    if (window.confirm(msg)) deleteMovie(film);
  }

  const filteredMovies = [...movies].sort((a, b) => a.localeCompare(b)).filter(f => f.toLowerCase().includes(filmFilter.trim().toLowerCase()));

  return (
    <div>
      <SL t={t}>film posters</SL>
      <Card t={t} style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 4 }}>Fetch missing posters</p>
            <p style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.5 }}>
              {posterRunning && posterProgress
                ? `Checking ${posterProgress.current}/${posterProgress.total}: ${posterProgress.film}…`
                : `Looks up posters for all ${movies.length} films already in your league — skips any that already have one.`}
            </p>
          </div>
          <button onClick={runBackfill} disabled={posterRunning} style={{ fontSize: 13, padding: "8px 16px", borderRadius: 8, border: `1.5px solid ${t.gold}`, background: posterRunning ? "transparent" : t.gold, color: posterRunning ? t.gold : "#fff", cursor: posterRunning ? "default" : "pointer", fontWeight: 600, whiteSpace: "nowrap", marginLeft: 16, opacity: posterRunning ? 0.7 : 1 }}>
            {posterRunning ? "Running…" : "Fetch posters"}
          </button>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 12, color: t.textSub, cursor: "pointer" }}>
          <input type="checkbox" checked={forceRecheck} onChange={e => setForceRecheck(e.target.checked)} />
          Re-check films that already have a poster (use this to fix any wrong posters saved previously)
        </label>
        {posterResults && posterResults.notFound.length > 0 && (() => {
          // Live filter: drop any film from this list the moment it has a poster_path saved,
          // even if fixed manually after the fetch ran — no need to re-run the whole thing.
          const stillMissing = posterResults.notFound.filter(f => movies.includes(f) && !scoring[f]?.poster_path);
          if (stillMissing.length === 0) return null;
          return (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `0.5px solid ${t.border}` }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 8 }}>
                No exact TMDB match found for {stillMissing.length} film{stillMissing.length !== 1 ? "s" : ""} — add these manually via the search box in Settings:
              </p>
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {stillMissing.map(f => (
                  <li key={f} style={{ fontSize: 12, color: t.textSub, marginBottom: 3, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, maxWidth: 420 }}>
                    <span>{f}</span>
                    <button
                      onClick={() => { if (window.confirm(`Remove "${f}" from the league? This can't be undone.`)) deleteMovie(f); }}
                      style={{ fontSize: 10, color: t.red, background: "none", border: "none", cursor: "pointer", padding: "1px 4px", flexShrink: 0 }}
                    >
                      remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })()}
      </Card>

      <SL t={t}>scoring data</SL>
      <Card t={t} style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 4 }}>Fetch box office & Rotten Tomatoes</p>
            <p style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.5 }}>
              {scoringRunning && scoringProgress
                ? `Fetching ${scoringProgress.current}/${scoringProgress.total}: ${scoringProgress.film}…`
                : `Looks up box office and RT scores for all ${movies.length} films — skips any that already have data.`}
            </p>
          </div>
          <button onClick={runBackfillScoring} disabled={scoringRunning} style={{ fontSize: 13, padding: "8px 16px", borderRadius: 8, border: `1.5px solid ${t.gold}`, background: scoringRunning ? "transparent" : t.gold, color: scoringRunning ? t.gold : "#fff", cursor: scoringRunning ? "default" : "pointer", fontWeight: 600, whiteSpace: "nowrap", marginLeft: 16, opacity: scoringRunning ? 0.7 : 1 }}>
            {scoringRunning ? "Running…" : "Fetch scoring"}
          </button>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 12, color: t.textSub, cursor: "pointer" }}>
          <input type="checkbox" checked={forceRecheckScoring} onChange={e => setForceRecheckScoring(e.target.checked)} />
          Re-check films that already have scores
        </label>
        {scoringResults && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `0.5px solid ${t.border}` }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 6 }}>Box Office: {scoringResults.boUpdated} added · {scoringResults.boSkipped} skipped</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: t.text }}>Rotten Tomatoes: {scoringResults.rtUpdated} added · {scoringResults.rtSkipped} skipped</p>
            {(() => {
              const tooEarlySet = new Set([...(scoringResults.boTooEarly || []), ...(scoringResults.rtTooEarly || [])]);
              const tooEarlyFilms = [...tooEarlySet];
              if (tooEarlyFilms.length === 0) return null;
              return (
                <div style={{ marginTop: 12, padding: "10px 12px", background: "#1A0A00", border: "0.5px solid #E65100", borderRadius: 8 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#FF8A65", marginBottom: 6 }}>
                    ⏳ Skipped — too early ({tooEarlyFilms.length} film{tooEarlyFilms.length !== 1 ? "s" : ""})
                  </p>
                  <p style={{ fontSize: 11, color: "#FFCCBC", marginBottom: 8, lineHeight: 1.5 }}>
                    These films had limited/preview data below the threshold. Run fetch again once they have a wide US release.
                  </p>
                  <ul style={{ paddingLeft: 16, margin: 0 }}>
                    {tooEarlyFilms.map(f => {
                      const boFlag = scoringResults.boTooEarly?.includes(f);
                      const rtFlag = scoringResults.rtTooEarly?.includes(f);
                      const reason = boFlag && rtFlag ? "BO + RT" : boFlag ? "Box office" : "RT scores";
                      return (
                        <li key={f} style={{ fontSize: 11, color: "#FFCCBC", marginBottom: 4, display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 460 }}>
                          <span>{f}</span>
                          <span style={{ fontSize: 10, color: "#FF8A65", fontStyle: "italic", marginLeft: 8 }}>{reason} skipped</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })()}
          </div>
        )}
      </Card>

      <SL t={t}>manage films · {movies.length}</SL>
      <Card t={t} style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.5, marginBottom: 10 }}>
          Remove films you added by mistake or under the wrong title (e.g. old/misnamed entries). This deletes the film and its data entirely — it will no longer be checked by Fetch scoring.
        </p>
        <input
          value={filmFilter}
          onChange={e => setFilmFilter(e.target.value)}
          placeholder="Filter films…"
          style={{ ...inp, width: "100%", boxSizing: "border-box", marginBottom: 10 }}
        />
        <div style={{ maxHeight: 320, overflowY: "auto", border: `0.5px solid ${t.border}`, borderRadius: 8 }}>
          {filteredMovies.length === 0 && (
            <div style={{ padding: "12px 14px", fontSize: 12, color: t.textMuted }}>No films match.</div>
          )}
          {filteredMovies.map((f, i) => {
            const owner = findDraftOwner(f);
            return (
              <div key={f} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "9px 14px", borderBottom: i < filteredMovies.length - 1 ? `0.5px solid ${t.border}` : "none", background: i % 2 === 0 ? t.surface : t.rowAlt }}>
                <span style={{ fontSize: 13, color: t.text, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {f}
                  {owner && <span style={{ fontSize: 10, color: t.gold, marginLeft: 8, fontWeight: 600 }}>· drafted by {owner}</span>}
                </span>
                <button
                  onClick={() => handleRemoveFilm(f)}
                  style={{ fontSize: 11, color: t.red, background: "none", border: `0.5px solid ${t.red}`, borderRadius: 6, cursor: "pointer", padding: "3px 8px", flexShrink: 0 }}
                >
                  remove
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      <SL t={t}>marxist mode</SL>
      <Card t={t} style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: marxistMode ? t.red : t.text, marginBottom: 4 }}>
              {marxistMode ? "☭ Marxist Mode is ON" : "Marxist Mode is OFF"}
            </p>
            <p style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.5 }}>
              {marxistMode ? "Anyone can edit scores, picks, and film names — no login required." : "Only logged-in members can edit. Commissioner controls scoring."}
            </p>
          </div>
          <button onClick={toggleMarxistMode} style={{ fontSize: 13, padding: "8px 16px", borderRadius: 8, border: `1.5px solid ${marxistMode ? t.red : t.border}`, background: marxistMode ? t.redBg : "transparent", color: marxistMode ? t.red : t.textSub, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap", marginLeft: 16 }}>
            {marxistMode ? "Disable" : "Enable ☭"}
          </button>
        </div>
      </Card>

      <SL t={t}>invite link</SL>
      <Card t={t} style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: t.textSub, fontFamily: "monospace" }}>{inviteUrl}</span>
          <button onClick={copyInvite} style={{ fontSize: 12, padding: "5px 14px", borderRadius: 6, border: `0.5px solid ${t.border}`, background: copied ? t.gold : "transparent", color: copied ? "#fff" : t.gold, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap", marginLeft: 12 }}>
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
        <p style={{ fontSize: 11, color: t.textMuted, marginTop: 8 }}>Share with your league. After they sign up, assign them to their team below.</p>
      </Card>

      {unassigned.length > 0 && (
        <>
          <SL t={t}>waiting for assignment · {unassigned.length}</SL>
          <div style={{ background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
            {unassigned.map((user, i) => (
              <div key={user.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: i < unassigned.length - 1 ? `0.5px solid ${t.border}` : "none" }}>
                <span style={{ flex: 1, fontSize: 13, color: t.text }}>{user.email}</span>
                <select onChange={e => { if (e.target.value) assignPlayer(user.id, e.target.value); }} defaultValue="" style={{ ...inp, fontSize: 12, padding: "5px 8px" }}>
                  <option value="">Assign to team…</option>
                  {players.filter(p => !assigned.find(a => a.player_name === p)).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            ))}
          </div>
        </>
      )}

      {assigned.length > 0 && (
        <>
          <SL t={t}>assigned members</SL>
          <div style={{ background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
            {assigned.map((user, i) => (
              <div key={user.id} style={{ display: "flex", alignItems: "center", padding: "10px 16px", borderBottom: i < assigned.length - 1 ? `0.5px solid ${t.border}` : "none", background: i % 2 === 0 ? t.surface : t.rowAlt }}>
                <span style={{ flex: 1, fontSize: 13, color: t.text }}>{user.email}</span>
                <span style={{ fontSize: 12, color: t.gold, fontWeight: 600 }}>{user.player_name}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <SL t={t}>league name</SL>
      <Card t={t}>
        {editingLeague ? (
          <div style={{ display: "flex", gap: 8 }}>
            <input value={leagueVal} onChange={e => setLeagueVal(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { updateLeagueName(leagueVal); setEditingLeague(false); } if (e.key === "Escape") setEditingLeague(false); }} autoFocus style={{ ...inp, flex: 1 }} />
            <button onClick={() => { updateLeagueName(leagueVal); setEditingLeague(false); }} style={{ fontSize: 13, padding: "7px 16px", borderRadius: 7, border: "none", background: t.gold, color: "#fff", cursor: "pointer", fontWeight: 600 }}>Save</button>
            <button onClick={() => setEditingLeague(false)} style={{ fontSize: 13, padding: "7px 12px", borderRadius: 7, border: `0.5px solid ${t.border}`, background: "transparent", color: t.textMuted, cursor: "pointer" }}>Cancel</button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: t.text }}>{leagueName}</span>
            <button onClick={() => { setEditingLeague(true); setLeagueVal(leagueName); }} style={{ fontSize: 12, color: t.gold, background: "none", border: "none", cursor: "pointer" }}>rename</button>
          </div>
        )}
      </Card>
    </div>
  );
}
