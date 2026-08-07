import { supabase, LEAGUE_ID } from "./supabase";
import { DEFAULT_PLAYERS, DEFAULT_IR_CONFIG } from "./constants";
import { normalizeRules, defaultScoringRules } from "./scoringRules";

export async function dbGet(key) {
  const { data } = await supabase.from("settings").select("value").eq("league_id", LEAGUE_ID).eq("key", key).maybeSingle();
  return data?.value;
}
export async function dbSet(key, value) {
  await supabase.from("settings").upsert({ league_id: LEAGUE_ID, key, value }, { onConflict: "league_id,key" });
}
export async function dbGetPlayers() {
  const v = await dbGet("players");
  return v ? JSON.parse(v) : [...DEFAULT_PLAYERS];
}
export async function dbGetLeagueName() { return (await dbGet("league_name")) || "The 2026 Film League"; }
export async function dbGetOpenScoringMode() { return (await dbGet("marxist_mode")) === "true"; }
export async function dbSetOpenScoringMode(val) { await dbSet("marxist_mode", String(val)); }
export async function dbGetDraft(players) {
  const { data } = await supabase.from("draft_picks").select("*").eq("league_id", LEAGUE_ID);
  const draft = {};
  players.forEach(p => { draft[p] = Array(9).fill(""); });
  (data || []).forEach(row => { if (draft[row.player_name] !== undefined) draft[row.player_name][row.round_index] = row.film || ""; });
  return draft;
}
export async function dbSetDraftPick(player, roundIdx, film) {
  await supabase.from("draft_picks").upsert({ league_id: LEAGUE_ID, player_name: player, round_index: roundIdx, film }, { onConflict: "league_id,player_name,round_index" });
}
export async function dbGetScores() {
  const { data } = await supabase.from("scores").select("*").eq("league_id", LEAGUE_ID);
  const scoring = {};
  (data || []).forEach(row => { scoring[row.film] = row.data; });
  return scoring;
}
export async function dbSetScore(film, data) {
  await supabase.from("scores").upsert({ league_id: LEAGUE_ID, film, data, updated_at: new Date().toISOString() }, { onConflict: "league_id,film" });
}
export async function dbGetMovies() {
  const { data } = await supabase.from("movies").select("title").eq("league_id", LEAGUE_ID).order("created_at");
  return data?.map(r => r.title) || [];
}
export async function dbAddMovie(title) { await supabase.from("movies").insert({ league_id: LEAGUE_ID, title }); }
export async function dbDeleteMovie(title) {
  await supabase.from("movies").delete().eq("league_id", LEAGUE_ID).eq("title", title);
  await supabase.from("scores").delete().eq("league_id", LEAGUE_ID).eq("film", title);
}
export async function dbRenameMovie(oldTitle, newTitle) {
  await supabase.from("movies").update({ title: newTitle }).eq("league_id", LEAGUE_ID).eq("title", oldTitle);
  await supabase.from("draft_picks").update({ film: newTitle }).eq("league_id", LEAGUE_ID).eq("film", oldTitle);
  const { data } = await supabase.from("scores").select("data").eq("league_id", LEAGUE_ID).eq("film", oldTitle).single();
  if (data) {
    await supabase.from("scores").upsert({ league_id: LEAGUE_ID, film: newTitle, data: data.data, updated_at: new Date().toISOString() }, { onConflict: "league_id,film" });
    await supabase.from("scores").delete().eq("league_id", LEAGUE_ID).eq("film", oldTitle);
  }
}
export async function dbRenamePlayer(oldName, newName, players) {
  await supabase.from("draft_picks").update({ player_name: newName }).eq("league_id", LEAGUE_ID).eq("player_name", oldName);
  const newPlayers = players.map(p => p === oldName ? newName : p);
  await dbSet("players", JSON.stringify(newPlayers));
  await supabase.from("league_members").update({ player_name: newName }).eq("league_id", LEAGUE_ID).eq("player_name", oldName);
  return newPlayers;
}
export async function dbGetLeagueUsers() {
  const { data } = await supabase.from("league_members").select("*").eq("league_id", LEAGUE_ID);
  // alias user_id -> id so existing callers (App.jsx) that match rows by `.id` keep working
  return (data || []).map(row => ({ ...row, id: row.user_id }));
}
export async function dbAssignPlayer(userId, playerName) {
  await supabase.from("league_members").update({ player_name: playerName }).eq("user_id", userId).eq("league_id", LEAGUE_ID);
}
export async function dbGetCurrentUser(userId) {
  const { data } = await supabase.from("league_members").select("*").eq("user_id", userId).eq("league_id", LEAGUE_ID).maybeSingle();
  return data ? { ...data, id: data.user_id } : data;
}
export async function dbGetIR() {
  const v = await dbGet("ir_slots");
  return v ? JSON.parse(v) : {};
}
export async function dbSetIR(irSlots) {
  await dbSet("ir_slots", JSON.stringify(irSlots));
}
export async function dbGetScoringRules() {
  const v = await dbGet("scoring_rules");
  return v ? normalizeRules(JSON.parse(v)) : defaultScoringRules();
}
export async function dbSetScoringRules(rules) { await dbSet("scoring_rules", JSON.stringify(rules)); }
export async function dbGetReplacements() {
  const v = await dbGet("ir_replacements");
  return v ? JSON.parse(v) : {};
}
export async function dbSetReplacements(replacements) {
  await dbSet("ir_replacements", JSON.stringify(replacements));
}
function slugify(name) {
  return (name || "league").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 30) || "league";
}
function randomJoinCode(len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars (0/O, 1/I)
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// Creates a new league: the creating user becomes commissioner and occupies
// one of the team_count slots; the remaining (team_count - 1) slots are
// created empty for others to self-claim later (Step 2c).
export async function dbCreateLeague(creatorUserId, { name, teamCount, filmsPerTeam, visibility }) {
  const id = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;

  let joinCode = randomJoinCode();
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await supabase.from("leagues").select("id").eq("join_code", joinCode).maybeSingle();
    if (!existing) break;
    joinCode = randomJoinCode();
  }

  const { error: leagueErr } = await supabase.from("leagues").insert({
    id,
    name,
    year: String(new Date().getFullYear()),
    join_code: joinCode,
    visibility: visibility === "public" ? "public" : "private",
    created_by: creatorUserId,
    films_per_team: filmsPerTeam,
    team_count: teamCount,
  });
  if (leagueErr) throw leagueErr;

  const rows = [{ user_id: creatorUserId, league_id: id, role: "commissioner", player_name: null, team_color: null }];
  for (let i = 1; i < teamCount; i++) {
    rows.push({ user_id: null, league_id: id, role: "player", player_name: null, team_color: null });
  }
  const { error: membersErr } = await supabase.from("league_members").insert(rows);
  if (membersErr) throw membersErr;

  return { id, joinCode };
}

export async function dbGetIRConfig() {
  const v = await dbGet("ir_config");
  return v ? { ...DEFAULT_IR_CONFIG, ...JSON.parse(v) } : { ...DEFAULT_IR_CONFIG };
}
export async function dbSetIRConfig(config) {
  await dbSet("ir_config", JSON.stringify(config));
}
