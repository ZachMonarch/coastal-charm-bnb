// src/integrations/supabase/client.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// In a test environment, use process.env directly
const isTest = process.env.NODE_ENV === 'test';

const SUPABASE_URL = isTest
  ? process.env.VITE_SUPABASE_URL
  : import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_ANON_KEY = isTest
  ? process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  : import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "❌ Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.",
  );
}

// Create a simple in-memory storage for tests that matches Storage interface
const testStorage = {
  _data: new Map<string, string>(),
  getItem: (key: string) => testStorage._data.get(key) || null,
  setItem: (key: string, value: string) => { testStorage._data.set(key, value); },
  removeItem: (key: string) => { testStorage._data.delete(key); }
} as unknown as Storage;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: isTest ? testStorage : localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
