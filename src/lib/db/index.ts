import { localDb } from "./local";

/**
 * Single data-layer entry point. Mock-only for now; when the Supabase client
 * lands this becomes `USE_MOCK ? localDb : supabaseDb` and nothing else changes.
 */
export const db = localDb;

export type { NewWorkout, NewExercise } from "./local";
