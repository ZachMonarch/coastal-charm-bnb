import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = "https://yhegaaqxmuhszesbjtdo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZWdhYXF4bXVoc3plc2JqdGRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4OTcwNDMsImV4cCI6MjA3MTQ3MzA0M30.4eXtITVS_i9pn07jVgKYAblkZCi7LJQhETaxHNmspiE";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
