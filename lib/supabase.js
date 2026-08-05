import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://rudchnnifyfkkrkikmfw.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1ZGNobm5pZnlma2tya2lrbWZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4ODU2NjIsImV4cCI6MjEwMTQ2MTY2Mn0.Y_lrwiFLPVuv51pGd2Pge3RMZMSwkhpZ5AaYa7Xexoo";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const LEAGUE_ID = "demo2026";
export const COMMISSIONER_EMAIL = "ellenbergb23@gmail.com";
