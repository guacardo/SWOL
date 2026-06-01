import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { USE_MOCK } from "@/lib/config";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// In mock mode there is no client; auth.store / db route around it.
export const supabase: SupabaseClient | null = USE_MOCK
    ? null
    : createClient(supabaseUrl, supabaseAnonKey);
