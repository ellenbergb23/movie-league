import { supabase } from "./supabase";
import { DEFAULT_PLAYERS, DEFAULT_IR_CONFIG } from "./constants";
import { normalizeRules, defaultScoringRules } from "./scoringRules";

export async function dbGet(leagueId, key) {
  const { data } = await supabase.from("settings").select("value").eq("league_id", leagueId).eq("key", key).maybeSingle();
  return data?.value;
}
export async function dbSet(leagueId, key, value) {
  await supabase.from("settings").upsert({ league_id: leagueId, key, value }, { onConflict: "league_id,key" });
}
export async function dbGetPlayers(leagueId) {
  const v = await dbGet(leagueId, "players");
  return v ? JSON.parse(v) : [...DEFAULT_PLAYERS];
}
export async function dbGetLeagueName(leagueId) { return (await dbGet(leagueId, "league_name")) || "The 2026 Film League"; }
export async function dbGetJoinCode(leagueId) {
  const { data, error } = await supabase.from("leagues").select("join_code").eq("id", leagueId).single();
  if (error) return null;
  return data?.join_code || null;
}
export async function dbGetOpenScoringMode(leagueId) { return (await dbGet(leagueId, "marxist_mode")) === "true"; }
export async function dbSetOpenScoringMode(leagueId, val) { await dbSet(leagueId, "marxist_mode", String(val)); }
export async function dbGetDraft(leagueId, players) {
  const { data } = await supabase.from("draft_picks").select("*").eq("league_id", leagueId);
  const draft = {};
  players.forEach(p => { draft[p] = Array(9).fill(""); });
  (data || []).forEach(row => { if (draft[row.player_name] !== undefined) draft[row.player_name][row.round_index] = row.film || ""; });
  return draft;
}
export async function dbSetDraftPick(leagueId, player, roundIdx, film) {
  await supabase.from("draft_picks").upsert({ league_id: leagueId, player_name: player, round_index: roundIdx, film }, { onConflict: "league_id,player_name,round_index" });
}
export async function dbGetScores(leagueId) {
  const { data } = await supabase.from("scores").select("*").eq("league_id", leagueId);
  const scoring = {};
  (data || []).forEach(row => { scoring[row.film] = row.data; });
  return scoring;
}
export async function dbSetScore(leagueId, film, data) {
  await supabase.from("scores").upsert({ league_id: leagueId, film, data, updated_at: new Date().toISOString() }, { onConflict: "league_id,film" });
}
export async function dbGetMovies(leagueId) {
  const { data } = await supabase.from("movies").select("title").eq("league_id", leagueId).order("created_at");
  return data?.map(r => r.title) || [];
}
export async function dbAddMovie(leagueId, title) { await supabase.from("movies").insert({ league_id: leagueId, title }); }
export async function dbDeleteMovie(leagueId, title) {
  await supabase.from("movies").delete().eq("league_id", leagueId).eq("title", title);
  await supabase.from("scores").delete().eq("league_id", leagueId).eq("film", title);
}
export async function dbRenameMovie(leagueId, oldTitle, newTitle) {
  await supabase.from("movies").update({ title: newTitle }).eq("league_id", leagueId).eq("title", oldTitle);
  await supabase.from("draft_picks").update({ film: newTitle }).eq("league_id", leagueId).eq("film", oldTitle);
  const { data } = await supabase.from("scores").select("data").eq("league_id", leagueId).eq("film", oldTitle).single();
  if (data) {
    await supabase.from("scores").upsert({ league_id: leagueId, film: newTitle, data: data.data, updated_at: new Date().toISOString() }, { onConflict: "league_id,film" });
    await supabase.from("scores").delete().eq("league_id", leagueId).eq("film", oldTitle);
  }
}
export async function dbRenamePlayer(leagueId, oldName, newName, players) {
  await supabase.from("draft_picks").update({ player_name: newName }).eq("league_id", leagueId).eq("player_name", oldName);
  const newPlayers = players.map(p => p === oldName ? newName : p);
  await dbSet(leagueId, "players", JSON.stringify(newPlayers));
  await supabase.from("league_members").update({ player_name: newName }).eq("league_id", leagueId).eq("player_name", oldName);
  return newPlayers;
}
export async function dbGetLeagueUsers(leagueId) {
  const { data } = await supabase.from("league_members").select("*").eq("league_id", leagueId);
  // alias user_id -> id so existing callers (LeagueView.jsx) that match rows by `.id` keep working
  return (data || []).map(row => ({ ...row, id: row.user_id }));
}
export async function dbAssignPlayer(leagueId, userId, playerName) {
  await supabase.from("league_members").update({ player_name: playerName }).eq("user_id", userId).eq("league_id", leagueId);
}
export async function dbGetCurrentUser(leagueId, userId) {
  const { data } = await supabase.from("league_members").select("*").eq("user_id", userId).eq("league_id", leagueId).maybeSingle();
  return data ? { ...data, id: data.user_id } : data;
}
export async function dbGetIR(leagueId) {
  const v = await dbGet(leagueId, "ir_slots");
  return v ? JSON.parse(v) : {};
}
export async function dbSetIR(leagueId, irSlots) {
  await dbSet(leagueId, "ir_slots", JSON.stringify(irSlots));
}
export async function dbGetScoringRules(leagueId) {
  const v = await dbGet(leagueId, "scoring_rules");
  return v ? normalizeRules(JSON.parse(v)) : defaultScoringRules();
}
export async function dbSetScoringRules(leagueId, rules) { await dbSet(leagueId, "scoring_rules", JSON.stringify(rules)); }
export async function dbGetReplacements(leagueId) {
  const v = await dbGet(leagueId, "ir_replacements");
  return v ? JSON.parse(v) : {};
}
export async function dbSetReplacements(leagueId, replacements) {
  await dbSet(leagueId, "ir_replacements", JSON.stringify(replacements));
}
// Creates a new league: the creating user becomes commissioner and occupies
// one of the team_count slots; the remaining (team_count - 1) slots are
// created empty for others to self-claim later (Step 2c).
// Runs as a single atomic DB function (see create_league in the migration)
// rather than raw client-side inserts — avoids RLS bootstrapping issues
// entirely, since the function creates both rows in one transaction with
// elevated privileges internally, deriving the creator from auth.uid()
// server-side (can't be spoofed by the client).
// Not league-scoped by definition — it CREATES a league — so no leagueId argument.
export async function dbCreateLeague({ name, teamCount, filmsPerTeam, visibility }) {
  const { data, error } = await supabase.rpc("create_league", {
    p_name: name,
    p_team_count: teamCount,
    p_films_per_team: filmsPerTeam,
    p_visibility: visibility === "public" ? "public" : "private",
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("League creation did not return a result.");
  return { id: row.out_id, joinCode: row.out_join_code };
}

// Looks up a league by join code and returns its open team slots + already-
// taken colors, so the join flow can show a picker before the user commits.
// Read-only, works whether or not the caller is signed in yet (see
// preview_league_by_code in the migration for why this is a SECURITY
// DEFINER RPC rather than a raw client select).
export async function dbPreviewLeagueByCode(joinCode) {
  const { data, error } = await supabase.rpc("preview_league_by_code", { p_join_code: joinCode });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("League lookup did not return a result.");
  return {
    id: row.out_id,
    name: row.out_name,
    teamCount: row.out_team_count,
    filmsPerTeam: row.out_films_per_team,
    openSlots: row.out_open_slots || [],
    takenColors: row.out_taken_colors || [],
  };
}

// Atomically claims one open team slot in a league (see join_league in the
// migration). slotName must be one of the values dbPreviewLeagueByCode
// returned in openSlots (e.g. "Team 3").
export async function dbJoinLeague({ joinCode, slotName, playerName, teamColor }) {
  const { data, error } = await supabase.rpc("join_league", {
    p_join_code: joinCode,
    p_slot_name: slotName,
    p_player_name: playerName,
    p_team_color: teamColor,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Join did not return a result.");
  return { id: row.out_id };
}

// Lets a member (including the commissioner) set their own display name +
// team color after the fact — used by the "Welcome to the League" prompt
// that appears the first time someone with no color yet lands in a league.
export async function dbSetMyTeam(leagueId, { playerName, teamColor }) {
  const { error } = await supabase.rpc("set_my_team", {
    p_league_id: leagueId,
    p_player_name: playerName,
    p_team_color: teamColor,
  });
  if (error) throw error;
}

// Permanently deletes a league and all its data (see delete_league in the
// migration — SECURITY DEFINER, checks the caller is that league's
// commissioner server-side before doing anything, and relies on ON DELETE
// CASCADE from leagues -> every child table so one call is enough).
export async function dbDeleteLeague(leagueId) {
  const { error } = await supabase.rpc("delete_league", { p_league_id: leagueId });
  if (error) throw error;
}

export async function dbGetIRConfig(leagueId) {
  const v = await dbGet(leagueId, "ir_config");
  return v ? { ...DEFAULT_IR_CONFIG, ...JSON.parse(v) } : { ...DEFAULT_IR_CONFIG };
}
export async function dbSetIRConfig(leagueId, config) {
  await dbSet(leagueId, "ir_config", JSON.stringify(config));
}

// Lists every league a given user belongs to, for the "Your Leagues" page.
// Two-step lookup (memberships, then leagues by id) instead of a single
// nested-select query — keeps this independent of exactly how the
// league_members -> leagues foreign key relationship is named in Postgres,
// which is safer against silent query failures.
export async function dbGetUserLeagues(userId) {
  const { data: memberships } = await supabase.from("league_members").select("league_id, player_name, role").eq("user_id", userId);
  if (!memberships || memberships.length === 0) return [];
  const leagueIds = memberships.map(m => m.league_id);
  const { data: leagues } = await supabase.from("leagues").select("id, name, year, join_code, visibility, team_count").in("id", leagueIds);
  const leagueById = {};
  (leagues || []).forEach(l => { leagueById[l.id] = l; });
  return memberships
    .map(m => {
      const league = leagueById[m.league_id];
      if (!league) return null; // membership row with no matching league — skip rather than crash
      return { ...league, playerName: m.player_name, role: m.role };
    })
    .filter(Boolean);
}
