/*
 * Runtime mode switch. With no Supabase env configured we fall back to the
 * local mock data layer + dev auth stub, so the app runs with zero infra.
 * Drop real values into .env and everything flips to the real backend.
 */
export const USE_MOCK =
    !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;
