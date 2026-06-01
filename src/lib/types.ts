/*
 * Domain types. These mirror the Postgres schema in supabase/schema.sql.
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

export interface Exercise {
    id: string;
    workout_id: string;
    name: string;
    /** Ordered position within the workout. */
    position: number;
    sets: number | null;
    reps: number | null;
    weight_kg: number | null;
    duration_sec: number | null;
    hr_start: number | null;
    hr_end: number | null;
    hr_avg: number | null;
    notes: string | null;
}

export interface Workout {
    id: string;
    user_id: string;
    title: string | null;
    performed_at: string; // ISO timestamp
    created_at: string;
    exercises?: Exercise[];
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
