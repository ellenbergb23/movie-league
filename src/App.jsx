import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { THEMES, FONT_SANS } from "./lib/constants";
import { parseRoute } from "./lib/router";
import { AuthModal } from "./components/AuthModal";
import { CreateLeagueModal } from "./components/CreateLeagueModal";
import { JoinLeagueModal } from "./components/JoinLeagueModal";
import YourLeagues from "./components/YourLeagues";
import LeagueView from "./components/LeagueView";

export default function App() {
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateLeagueModal, setShowCreateLeagueModal] = useState(false);
  const [showJoinLeagueModal, setShowJoinLeagueModal] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [toast, setToast] = useState(null);
  const [route, setRoute] = useState(() => parseRoute(window.location.pathname));

  const t = darkMode ? THEMES.dark : THEMES.light;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user || null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handlePopState() { setRoute(parseRoute(window.location.pathname)); }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function navigate(path) {
    if (path !== window.location.pathname) {
      window.history.pushState({}, "", path);
      setRoute(parseRoute(path));
    }
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2000); }
  function toggleDark() { setDarkMode(d => { localStorage.setItem("darkMode", !d); return !d; }); }
  async function signOut() { await supabase.auth.signOut(); setAuthUser(null); }

  if (authLoading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: t.bg, color: t.textMuted, fontFamily: FONT_SANS, fontSize: 14 }}>Loading…</div>;

  // leagueId in scope for the auth modal when we're inside a specific league — lets signup
  // auto-enroll into that league, same as the old hardcoded-demo-league behavior did.
  const currentLeagueId = route.page === "league" ? route.leagueId : undefined;

  return (
    <>
      {showAuthModal && <AuthModal t={t} leagueId={currentLeagueId} onAuth={user => { setAuthUser(user); setShowAuthModal(false); }} onClose={() => setShowAuthModal(false)} />}
      {showCreateLeagueModal && <CreateLeagueModal t={t} authUser={authUser} navigate={navigate} onAuth={user => setAuthUser(user)} onClose={() => setShowCreateLeagueModal(false)} showToast={showToast} />}
      {showJoinLeagueModal && <JoinLeagueModal t={t} authUser={authUser} navigate={navigate} onAuth={user => setAuthUser(user)} onClose={() => setShowJoinLeagueModal(false)} showToast={showToast} />}
      {toast && <div style={{ position: "fixed", top: 16, right: 16, background: t.gold, color: darkMode ? "#0A0A0A" : "#fff", padding: "9px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500, zIndex: 999 }}>{toast}</div>}

      {route.page === "league" ? (
        <LeagueView
          key={route.leagueId}
          leagueId={route.leagueId}
          authUser={authUser}
          darkMode={darkMode}
          toggleDark={toggleDark}
          showToast={showToast}
          onShowAuthModal={() => setShowAuthModal(true)}
          onShowCreateLeagueModal={() => setShowCreateLeagueModal(true)}
          onShowJoinLeagueModal={() => setShowJoinLeagueModal(true)}
          signOut={signOut}
          navigate={navigate}
        />
      ) : (
        <YourLeagues
          authUser={authUser}
          darkMode={darkMode}
          toggleDark={toggleDark}
          onShowAuthModal={() => setShowAuthModal(true)}
          onShowCreateLeagueModal={() => setShowCreateLeagueModal(true)}
          onShowJoinLeagueModal={() => setShowJoinLeagueModal(true)}
          signOut={signOut}
          navigate={navigate}
        />
      )}
    </>
  );
}
