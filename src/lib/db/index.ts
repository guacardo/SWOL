import { USE_MOCK } from "@/lib/config";
import { localDb } from "./local";
import { supabaseDb } from "./supabase";

/**
 * Single data-layer entry point. Same async surface either way, so views are
 * backend-agnostic: real Supabase when configured, localStorage mock otherwise.
 */
export const db = USE_MOCK ? localDb : supabaseDb;

export type { NewWorkout, NewExerciseLog, NewSet, ExerciseInput } from "./local";
