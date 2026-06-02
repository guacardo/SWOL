import type { Workout, ExerciseLog, Exercise } from "@/lib/types";
import { supabase } from "@/supabaseClient";
import { normalizeName } from "./util";
import type { NewWorkout, ExerciseInput } from "./local";

/**
 * Supabase-backed data layer. Same async surface as localDb so views are
 * backend-agnostic. All access goes through the authenticated client, so RLS
 * (auth.uid()) enforces ownership — see migrations/0001_init.sql.
 *
 * The hydrated read shape (Workout -> logs -> exercise + sets) is produced by a
 * single PostgREST embedded select; the embedded resource is aliased to `logs`
 * to match our domain type. PostgREST doesn't guarantee child ordering, so we
 * sort logs and sets by `position` after the fetch.
 */

// `logs:exercise_logs(...)` renames the embed to match Workout.logs.
const WORKOUT_SELECT =
    "*, logs:exercise_logs(*, exercise:exercises(*), sets(*))";

const client = () => {
    if (!supabase) throw new Error("Supabase client unavailable (mock mode)");
    return supabase;
};

function sortWorkout(w: Workout): Workout {
    const logs = (w.logs ?? [])
        .map((l) => ({ ...l, sets: [...(l.sets ?? [])].sort((a, b) => a.position - b.position) }))
        .sort((a, b) => a.position - b.position);
    return { ...w, logs };
}

/**
 * Resolve a free-typed name to a catalog exercise_id. Prefer a global row
 * (owner_id NULL, comparable across users) over the user's own; if neither
 * exists, create a private stub. Mirrors the locked resolution policy.
 */
async function resolveExerciseId(userId: string, name: string): Promise<string> {
    const sb = client();
    const norm = normalizeName(name);

    // RLS already limits selects to globals + own rows.
    const { data: matches, error } = await sb
        .from("exercises")
        .select("id, owner_id")
        .eq("normalized_name", norm);
    if (error) throw error;

    if (matches && matches.length > 0) {
        const global = matches.find((m) => m.owner_id === null);
        return (global ?? matches[0]).id;
    }

    // First sighting: create a private stub (enrich later in the CRUD panel).
    const { data: created, error: insErr } = await sb
        .from("exercises")
        .insert({ owner_id: userId, name, modality: "weighted", unit: "lb", is_stub: true })
        .select("id")
        .single();
    if (insErr) throw insErr;
    return created.id;
}

export const supabaseDb = {
    async listWorkouts(userId: string): Promise<Workout[]> {
        const { data, error } = await client()
            .from("workouts")
            .select(WORKOUT_SELECT)
            .eq("user_id", userId)
            .order("performed_at", { ascending: false });
        if (error) throw error;
        return (data as unknown as Workout[]).map(sortWorkout);
    },

    async createWorkout(userId: string, input: NewWorkout): Promise<Workout> {
        const sb = client();

        // 1) the workout row
        const { data: wk, error: wkErr } = await sb
            .from("workouts")
            .insert({
                user_id: userId,
                title: input.title,
                performed_at: input.performed_at,
            })
            .select("id")
            .single();
        if (wkErr) throw wkErr;
        const workoutId = wk.id as string;

        // 2) one exercise_log per exercise (resolving the catalog id), then its sets
        for (let i = 0; i < input.exercises.length; i++) {
            const e = input.exercises[i];
            const exerciseId = await resolveExerciseId(userId, e.name);

            const { data: log, error: logErr } = await sb
                .from("exercise_logs")
                .insert({
                    workout_id: workoutId,
                    exercise_id: exerciseId,
                    position: i,
                    notes: e.notes ?? null,
                })
                .select("id")
                .single();
            if (logErr) throw logErr;

            if (e.sets.length > 0) {
                const rows = e.sets.map((s, j) => ({
                    exercise_log_id: (log as ExerciseLog).id,
                    position: j,
                    reps: s.reps,
                    weight: s.weight,
                    hr_start: s.hr_start,
                    hr_end: s.hr_end,
                    done: true,
                }));
                const { error: setErr } = await sb.from("sets").insert(rows);
                if (setErr) throw setErr;
            }
        }

        // 3) read it back hydrated, so callers get the same shape as a list row
        const { data, error } = await sb
            .from("workouts")
            .select(WORKOUT_SELECT)
            .eq("id", workoutId)
            .single();
        if (error) throw error;
        return sortWorkout(data as unknown as Workout);
    },

    /* --- exercise catalog CRUD --- */

    async listExercises(_userId: string): Promise<Exercise[]> {
        // RLS returns globals (owner_id NULL) + the user's own rows.
        const { data, error } = await client()
            .from("exercises")
            .select("*")
            .order("name");
        if (error) throw error;
        return data as unknown as Exercise[];
    },

    async createExercise(userId: string, input: ExerciseInput): Promise<Exercise> {
        // normalized_name is a generated column — never sent.
        const { data, error } = await client()
            .from("exercises")
            .insert({ owner_id: userId, is_stub: false, ...input })
            .select("*")
            .single();
        if (error) throw error;
        return data as unknown as Exercise;
    },

    async updateExercise(userId: string, id: string, input: ExerciseInput): Promise<Exercise> {
        // owner_id filter + RLS both guarantee globals stay read-only.
        // Editing promotes a stub to a fully-authored row.
        const { data, error } = await client()
            .from("exercises")
            .update({ is_stub: false, ...input })
            .eq("id", id)
            .eq("owner_id", userId)
            .select("*")
            .single();
        if (error) throw error;
        return data as unknown as Exercise;
    },

    async deleteExercise(userId: string, id: string): Promise<void> {
        const { error } = await client()
            .from("exercises")
            .delete()
            .eq("id", id)
            .eq("owner_id", userId);
        if (error) throw error;
    },
};
