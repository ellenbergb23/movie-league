import { useState, useEffect, useRef } from "react";
import { THEMES } from "../lib/constants";
import { dbGetUserLeagues } from "../lib/db";
import { leaguePath } from "../lib/router";

// A small dropdown, meant for the header, that lists the leagues the signed-in
// user belongs to and lets them jump straight to one. currentLeagueId (optional)
// highlights whichever league is currently being viewed. currentLeagueName
// (optional) overrides the displayed name for that one entry with the live
// value from the page you're on — the fetched `leagues` list is only loaded
// once per mount, so without this a rename made via Commissioner Settings on
// this same page wouldn't show up here until a full reload.
export function LeagueSwitcher({ authUser, darkMode, navigate, currentLeagueId, currentLeagueName, onShowJoinLeagueModal }) {
  const [leagues, setLeagues] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const t = darkMode ? THEMES.dark : THEMES.light;

  useEffect(() => {
    if (!authUser) { setLeagues([]); return; }
    dbGetUserLeagues(authUser.id).then(setLeagues);
  }, [authUser]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!authUser) return null;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{ background: "none", border: `0.5px solid ${t.border}`, borderRadius: 6, padding: "5px 10px", fontSize: 12, color: t.textMuted, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
        Your Leagues <span style={{ fontSize: 9 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, minWidth: 220, background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 8, boxShadow: "0 6px 20px rgba(0,0,0,0.15)", zIndex: 1000, overflow: "hidden" }}>
          {leagues.length === 0 ? (
            <div style={{ padding: "12px 14px", fontSize: 12, color: t.textMuted }}>No leagues yet</div>
          ) : (
            leagues.map(league => (
              <button
                key={league.id}
                onClick={() => { setOpen(false); navigate(leaguePath(league.id)); }}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", textAlign: "left", padding: "9px 14px", fontSize: 13, color: league.id === currentLeagueId ? t.gold : t.text, fontWeight: league.id === currentLeagueId ? 600 : 400, background: "none", border: "none", borderBottom: `0.5px solid ${t.border}`, cursor: "pointer" }}
              >
                <span>{league.id === currentLeagueId && currentLeagueName ? currentLeagueName : league.name}</span>
                {league.id === currentLeagueId && <span style={{ fontSize: 11 }}>●</span>}
              </button>
            ))
          )}
          <button
            onClick={() => { setOpen(false); navigate("/"); }}
            style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", fontSize: 12, color: t.gold, background: "none", border: "none", borderBottom: `0.5px solid ${t.border}`, cursor: "pointer" }}
          >
            See all / create new →
          </button>
          <button
            onClick={() => { setOpen(false); onShowJoinLeagueModal?.(); }}
            style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", fontSize: 12, color: t.textMuted, background: "none", border: "none", cursor: "pointer" }}
          >
            Join a league with a code
          </button>
        </div>
      )}
    </div>
  );
}
