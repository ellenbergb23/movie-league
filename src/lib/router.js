// Minimal custom router — no library. The app only ever has two kinds of page:
//   "/"          -> Your Leagues (list/switcher)
//   "/l/:id"     -> a specific league (id is the leagues.id value)

export function parseRoute(pathname) {
  const match = pathname.match(/^\/l\/([^/]+)\/?$/);
  if (match) return { page: "league", leagueId: decodeURIComponent(match[1]) };
  return { page: "leagues" };
}

export function leaguePath(leagueId) {
  return `/l/${encodeURIComponent(leagueId)}`;
}
