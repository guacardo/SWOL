import type { ExerciseModality } from "@/lib/types";

/* --- input (draft) shapes coming from the logging UI --- */

export interface NewSet {
    reps: number | null;
    weight: number | null;
    hr_start: number | null;
    hr_end: number | null;
}

/** One exercise within a draft workout. `name` is resolved to a catalog row. */
export interface NewExerciseLog {
    name: string;
    sets: NewSet[];
    notes?: string | null;
}

export interface NewWorkout {
    title: string | null;
    performed_at?: string;
    exercises: NewExerciseLog[];
}

/** Metadata-only edits to a logged workout (set editing is a separate flow). */
export interface WorkoutPatch {
    title?: string | null;
    performed_at?: string;
    notes?: string | null;
}

/** Editable profile fields. dob is private (owner-only via RLS). */
export interface ProfilePatch {
    display_name?: string;
    avatar_url?: string | null;
    dob?: string | null;
}

/** Editable catalog fields, used for both create and update in the CRUD panel. */
export interface ExerciseInput {
    name: string;
    modality: ExerciseModality;
    muscle_group: string | null;
    equipment: string | null;
    unit: string;
    increment: number | null;
    min_value: number | null;
    max_value: number | null;
}
