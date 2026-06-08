import { supabaseDb } from "./supabase";

/**
 * Single data-layer entry point. Backed by Supabase (Postgres + RLS); views are
 * backend-agnostic and only ever touch this `db`.
 */
export const db = supabaseDb;

export type {
    NewWorkout,
    NewExerciseLog,
    NewSet,
    ExerciseInput,
    WorkoutPatch,
    ProfilePatch,
} from "./types";
