/*
 * Domain types. These mirror the Postgres schema in
 * supabase/migrations/0001_init.sql (the model locked with Will):
 *
 *   exercises      canonical catalog (owner_id NULL = global/shared)
 *   workouts       a session (metadata)
 *     exercise_logs  one exercise within a workout (-> exercise_id, workout_id)
 *       sets         individual sets, child of an exercise_log (per-set HR)
 *
 * The relational rows below are 1:1 with their tables. The optional `exercise`,
 * `sets`, and `logs` fields are *hydrated joins* the data layer fills in when it
 * expands a workout for display — they're not columns.
 *
 * DOB lives on `profiles` but is RLS-protected so only the owner can read it;
 * the public-facing shape (PublicProfile) omits it entirely.
 */

export interface Profile {
    id: string; // = auth.users.id
    display_name: string;
    avatar_url: string | null;
    dob: string | null; // ISO date, private
    created_at: string;
}

export type PublicProfile = Omit<Profile, "dob">;

export type ExerciseModality =
    | "weighted" // external load: barbell, dumbbell, machine
    | "bodyweight" // reps, optionally +/- assist load
    | "duration" // timed holds: plank, etc.
    | "cardio"; // distance/time/HR focused

/** A row in the exercise catalog (public.exercises). */
export interface Exercise {
    id: string;
    /** NULL = global/seeded/shared. Non-null = a user's private exercise. */
    owner_id: string | null;
    name: string;
    /** lower(name) with non-alphanumerics stripped; used for resolution. */
    normalized_name: string;
    modality: ExerciseModality;
    muscle_group: string | null;
    equipment: string | null;
    unit: string; // lb | kg | sec | m | etc.
    increment: number | null;
    min_value: number | null;
    max_value: number | null;
    /** Inline-created exercises start as stubs until promoted in the CRUD panel. */
    is_stub: boolean;
    created_at: string;
}

/** One set within an exercise_log (public.sets). HR is tracked per set. */
export interface WorkoutSet {
    id: string;
    exercise_log_id: string;
    /** Ordered position within the exercise_log. */
    position: number;
    reps: number | null;
    weight: number | null;
    duration_sec: number | null;
    distance_m: number | null;
    rpe: number | null; // rate of perceived exertion 0-10
    hr_start: number | null;
    hr_end: number | null;
    hr_avg: number | null;
    is_warmup: boolean;
    done: boolean;
}

/** One exercise performed within a workout (public.exercise_logs). */
export interface ExerciseLog {
    id: string;
    workout_id: string;
    exercise_id: string;
    /** Ordered position within the workout. */
    position: number;
    notes: string | null;
    // hydrated joins (filled by the data layer, not columns):
    exercise?: Exercise;
    sets?: WorkoutSet[];
}

export interface Workout {
    id: string;
    user_id: string;
    title: string | null;
    notes: string | null;
    routine_id: string | null;
    performed_at: string; // ISO timestamp
    created_at: string;
    // hydrated join (filled by the data layer, not a column):
    logs?: ExerciseLog[];
}

export interface Follow {
    follower_id: string;
    followee_id: string;
    created_at: string;
}

export interface Reaction {
    id: string;
    workout_id: string;
    user_id: string;
    emoji: string; // e.g. "ðŸ’ª"
    created_at: string;
}
