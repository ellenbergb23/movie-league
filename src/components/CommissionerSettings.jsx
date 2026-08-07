import { useState, useEffect } from "react";
import { SL, CollapsibleSL, Card } from "./ui";

export function CommissionerSettings({ leagueName, updateLeagueName, openScoringMode, toggleOpenScoringMode, leagueUsers, players, assignPlayer, t, showToast, movies, backfillPosters, backfillScoring, scoring, applyUnreleasedData }) {
  const [editingLeague, setEditingLeague] = useState(false);
  const [leagueVal, setLeagueVal] = useState(leagueName);
  const [copied, setCopied] = useState(false);
  const [posterProgress, setPosterProgress] = useState(null);
  const [posterRunning, setPosterRunning] = useState(false);
  const [posterResults, setPosterResults] = useState(null);
  const [forceRecheck, setForceRecheck] = useState(false);
  const [scoringProgress, setScoringProgress] = useState(null);
  const [scoringRunning, setScoringRunning] = useState(false);
  const [scoringResults, setScoringResults] = useState(null);
  const [overrideManualScoring, setOverrideManualScoring] = useState(false); // false = Fill Auto Scores Only, true = Override Manual Scores
  const [dismissedUnreleased, setDismissedUnreleased] = useState([]); // films clicked "Remain unreleased" — cleared on next fetch
  const [lastScoringMode, setLastScoringMode] = useState("all");
  const [looksReleasedOpen, setLooksReleasedOpen] = useState(true);
  const [skippedOpen, setSkippedOpen] = useState(false);

  async function runBackfill() {
    setPosterRunning(true);
    setPosterResults(null);
    const results = await backfillPosters((current, total, film) => setPosterProgress({ current, total, film }), forceRecheck);
    setPosterRunning(false);
    setPosterProgress(null);
    setPosterResults(results);
  }

  async function runBackfillScoring(mode = "all") {
    setScoringRunning(true);
    setScoringResults(null);
    setDismissedUnreleased([]);
    setLastScoringMode(mode);
    const results = await backfillScoring((current, total, film) => setScoringProgress({ current, total, film }), overrideManualScoring, mode);
    setScoringRunning(false);
    setScoringProgress(null);
    setScoringResults(results);
  }

  function remainUnreleased(film) {
    setDismissedUnreleased(prev => [...prev, film]);
  }

  useEffect(() => { setLeagueVal(leagueName); }, [leagueName]);

  const inviteUrl = window.location.origin;
  const unassigned = leagueUsers.filter(u => !u.player_name);
  const assigned = leagueUsers.filter(u => u.player_name);
  const inp = { fontSize: 13, padding: "7px 10px", borderRadius: 7, border: `0.5px solid ${t.borderStrong}`, background: t.surface2, color: t.text };

  function copyInvite() { navigator.clipboard.writeText(inviteUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }

  // Merge every skip reason per film into one alphabetically-sorted list — purely informational.
  function buildSkippedFilms(results) {
    if (!results) return [];
    const reasonsByFilm = {};
    const addReason = (film, reason) => {
      if (!reasonsByFilm[film]) reasonsByFilm[film] = { reasons: [], missingRT: false };
      if (!reasonsByFilm[film].reasons.includes(reason)) reasonsByFilm[film].reasons.push(reason);
    };
    (results.boNotFound || []).forEach(f => addReason(f, "No box office data found"));
    (results.boTooEarly || []).forEach(f => addReason(f, "Box office below $5M threshold"));
    (results.rtNotFound || []).forEach(f => { addReason(f, "No Rotten Tomatoes data found"); reasonsByFilm[f].missingRT = true; });
    (results.rtTooEarly || []).forEach(f => addReason(f, "Too early — not yet released"));
    return Object.entries(reasonsByFilm)
      .map(([film, { reasons, missingRT }]) => ({ film, reasons, missingRT }))
      .sort((a, b) => a.film.localeCompare(b.film));
  }
  const skippedFilms = buildSkippedFilms(scoringResults);

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
                      onClick={() => setConfirmRemove({ film: f, owner: findDraftOwner(f) })}
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 4 }}>Fetch box office & Rotten Tomatoes</p>
            <p style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.5 }}>
              {scoringRunning && scoringProgress
                ? `Fetching ${scoringProgress.current}/${scoringProgress.total}: ${scoringProgress.film}…`
                : `Looks up box office and/or RT scores for all ${movies.length} films — skips any that already have data.`}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => runBackfillScoring("bo")} disabled={scoringRunning} style={{ fontSize: 12, padding: "7px 12px", borderRadius: 8, border: `1.5px solid ${t.gold}`, background: "transparent", color: t.gold, cursor: scoringRunning ? "default" : "pointer", fontWeight: 600, whiteSpace: "nowrap", opacity: scoringRunning ? 0.5 : 1 }}>
              Fetch Box Office
            </button>
            <button onClick={() => runBackfillScoring("rt")} disabled={scoringRunning} style={{ fontSize: 12, padding: "7px 12px", borderRadius: 8, border: `1.5px solid ${t.gold}`, background: "transparent", color: t.gold, cursor: scoringRunning ? "default" : "pointer", fontWeight: 600, whiteSpace: "nowrap", opacity: scoringRunning ? 0.5 : 1 }}>
              Fetch Rotten Tomatoes
            </button>
            <button onClick={() => runBackfillScoring("all")} disabled={scoringRunning} style={{ fontSize: 13, padding: "8px 16px", borderRadius: 8, border: `1.5px solid ${t.gold}`, background: scoringRunning ? "transparent" : t.gold, color: scoringRunning ? t.gold : "#fff", cursor: scoringRunning ? "default" : "pointer", fontWeight: 600, whiteSpace: "nowrap", opacity: scoringRunning ? 0.7 : 1 }}>
              {scoringRunning ? "Running…" : "Fetch All Scoring"}
            </button>
          </div>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 12, color: t.textSub, cursor: "pointer" }}>
          <input type="checkbox" checked={overrideManualScoring} onChange={e => setOverrideManualScoring(e.target.checked)} />
          {overrideManualScoring
            ? "Override Manual Scores — fetch always wins, even over existing values"
            : "Fill Auto Scores Only — only fills missing box office/RT, never touches existing values"}
        </label>
        {scoringResults && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `0.5px solid ${t.border}` }}>
            {lastScoringMode !== "rt" && <p style={{ fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 6 }}>Box Office: {scoringResults.boUpdated} added · {scoringResults.boSkipped} skipped</p>}
            {lastScoringMode !== "bo" && <p style={{ fontSize: 12, fontWeight: 600, color: t.text }}>Rotten Tomatoes: {scoringResults.rtUpdated} added · {scoringResults.rtSkipped} skipped</p>}
          </div>
        )}
      </Card>

      {scoringResults && (() => {
        // Live filter: drop any film the moment it's no longer marked Unreleased,
        // even if applied manually elsewhere — no need to re-run the whole fetch.
        const stillUnreleased = (scoringResults.unreleasedWithData || [])
          .filter(({ film }) => scoring[film]?.released === false && !dismissedUnreleased.includes(film));
        if (stillUnreleased.length === 0) return null;
        return (
          <>
            <CollapsibleSL t={t} count={stillUnreleased.length} open={looksReleasedOpen} onToggle={() => setLooksReleasedOpen(o => !o)}>
              🎬 looks released
            </CollapsibleSL>
            {looksReleasedOpen && (
              <Card t={t} style={{ marginBottom: 24, background: t.goldBg, border: `0.5px solid ${t.gold}` }}>
                <p style={{ fontSize: 11, color: t.textSub, marginBottom: 8, lineHeight: 1.5 }}>
                  These films are toggled Unreleased, but box office and/or RT data was found for them from the last fetch. Review below — applying will switch the film to Released and save this data.
                </p>
                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                  <ul style={{ paddingLeft: 0, margin: 0, listStyle: "none" }}>
                    {stillUnreleased.map(({ film, candidate }) => (
                      <li key={film} style={{ fontSize: 12, color: t.text, marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <span style={{ textAlign: "left" }}>
                          {film}
                          {candidate.boRaw != null && <span style={{ color: t.textMuted, marginLeft: 6 }}>· ${(candidate.boRaw / 1_000_000).toFixed(1)}m</span>}
                          {candidate.criticsRT && <span style={{ color: t.textMuted, marginLeft: 6 }}>· RT {candidate.criticsRT}</span>}
                        </span>
                        <span style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <button
                            onClick={() => applyUnreleasedData(film, candidate)}
                            style={{ fontSize: 11, color: "#fff", background: t.gold, border: "none", borderRadius: 6, cursor: "pointer", padding: "4px 10px", fontWeight: 600 }}
                          >
                            Mark released & apply
                          </button>
                          <button
                            onClick={() => remainUnreleased(film)}
                            style={{ fontSize: 11, color: t.textSub, background: "none", border: `0.5px solid ${t.border}`, borderRadius: 6, cursor: "pointer", padding: "4px 10px", fontWeight: 600 }}
                          >
                            Remain unreleased
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            )}
          </>
        );
      })()}

      {skippedFilms.length > 0 && (
        <>
          <CollapsibleSL t={t} count={skippedFilms.length} open={skippedOpen} onToggle={() => setSkippedOpen(o => !o)}>
            skipped — no data
          </CollapsibleSL>
          {skippedOpen && (
            <Card t={t} style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 11, color: t.textMuted, marginBottom: 8, lineHeight: 1.5 }}>
                Films from the last fetch that came up empty, and why. Informational only — no action needed here.
              </p>
              <div style={{ maxHeight: 320, overflowY: "auto", border: `0.5px solid ${t.border}`, borderRadius: 8 }}>
                {skippedFilms.map(({ film, reasons, missingRT }, i) => (
                  <div key={film} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "9px 14px", borderBottom: i < skippedFilms.length - 1 ? `0.5px solid ${t.border}` : "none", background: i % 2 === 0 ? t.surface : t.rowAlt }}>
                    <span style={{ fontSize: 13, color: t.text, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "left" }}>{film}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 10, color: t.textMuted, fontStyle: "italic", textAlign: "right" }}>{reasons.join(" · ")}</span>
                      {missingRT && (
                        <a
                          href={`https://www.rottentomatoes.com/search?search=${encodeURIComponent(film)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 10, color: t.gold, whiteSpace: "nowrap", textDecoration: "none", border: `0.5px solid ${t.gold}`, borderRadius: 5, padding: "2px 6px" }}
                        >
                          RT ↗
                        </a>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      <SL t={t}>scoring mode</SL>
      <Card t={t} style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: openScoringMode ? t.gold : t.text, marginBottom: 4 }}>
              {openScoringMode ? "Open Scoring Mode is ON" : "Commissioner Scoring Mode is ON"}
            </p>
            <p style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.5 }}>
              {openScoringMode ? "Anyone can edit scores, picks, and film names — no login required." : "Only logged-in members can edit. Commissioner controls scoring."}
            </p>
          </div>
          <button onClick={toggleOpenScoringMode} style={{ fontSize: 13, padding: "8px 16px", borderRadius: 8, border: `1.5px solid ${openScoringMode ? t.gold : t.border}`, background: openScoringMode ? t.goldBg : "transparent", color: openScoringMode ? t.gold : t.textSub, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap", marginLeft: 16 }}>
            {openScoringMode ? "Switch to Commissioner Scoring" : "Switch to Open Scoring"}
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
