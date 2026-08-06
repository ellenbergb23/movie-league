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
  await supabase.from("users").update({ player_name: newName }).eq("league_id", LEAGUE_ID).eq("player_name", oldName);
  return newPlayers;
}
export async function dbGetLeagueUsers() {
  const { data } = await supabase.from("users").select("*").eq("league_id", LEAGUE_ID);
  return data || [];
}
export async function dbAssignPlayer(userId, playerName) {
  await supabase.from("users").update({ player_name: playerName }).eq("id", userId);
}
export async function dbGetCurrentUser(userId) {
  const { data } = await supabase.from("users").select("*").eq("id", userId).single();
  return data;
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
export async function dbGetIRConfig() {
  const v = await dbGet("ir_config");
  return v ? { ...DEFAULT_IR_CONFIG, ...JSON.parse(v) } : { ...DEFAULT_IR_CONFIG };
}
export async function dbSetIRConfig(config) {
  await dbSet("ir_config", JSON.stringify(config));
}
