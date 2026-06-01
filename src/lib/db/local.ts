import type { Workout, ExerciseLog, WorkoutSet, Exercise } from "@/lib/types";
import { normalizeName } from "./util";

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

const workoutsKey = (userId: string) => `swl-workouts:${userId}`;
const catalogKey = (userId: string) => `swl-exercises:${userId}`;

function readWorkouts(userId: string): Workout[] {
    const raw = localStorage.getItem(workoutsKey(userId));
    return raw ? (JSON.parse(raw) as Workout[]) : [];
}

function persistWorkouts(userId: string, workouts: Workout[]) {
    localStorage.setItem(workoutsKey(userId), JSON.stringify(workouts));
}

function readCatalog(userId: string): Exercise[] {
    const raw = localStorage.getItem(catalogKey(userId));
    return raw ? (JSON.parse(raw) as Exercise[]) : [];
}

function persistCatalog(userId: string, catalog: Exercise[]) {
    localStorage.setItem(catalogKey(userId), JSON.stringify(catalog));
}

/**
 * Resolve a free-typed exercise name to a catalog row, creating a private stub
 * on first sighting. This is the local mirror of the real "exercise resolution
 * policy": log fast now, enrich (modality, units, ranges) later in the CRUD
 * panel. Mutates `catalog` in place; caller persists.
 */
function resolveExercise(catalog: Exercise[], userId: string, name: string, now: string): Exercise {
    const norm = normalizeName(name);
    const existing = catalog.find((e) => e.normalized_name === norm);
    if (existing) return existing;

    const stub: Exercise = {
        id: crypto.randomUUID(),
        owner_id: userId,
        name,
        normalized_name: norm,
        modality: "weighted",
        muscle_group: null,
        equipment: null,
        unit: "lb",
        increment: null,
        min_value: null,
        max_value: null,
        is_stub: true,
        created_at: now,
    };
    catalog.push(stub);
    return stub;
}

/**
 * localStorage-backed implementation of the data layer. Same async surface the
 * Supabase implementation will expose, so views never need to change. Workouts
 * are stored already hydrated (logs -> sets, plus the resolved catalog row), so
 * reads are a straight return.
 */
export const localDb = {
    async listWorkouts(userId: string): Promise<Workout[]> {
        return readWorkouts(userId).sort((a, b) =>
            b.performed_at.localeCompare(a.performed_at),
        );
    },

    async createWorkout(userId: string, input: NewWorkout): Promise<Workout> {
        const now = new Date().toISOString();
        const workoutId = crypto.randomUUID();
        const catalog = readCatalog(userId);

        const logs: ExerciseLog[] = input.exercises.map((e, i) => {
            const exercise = resolveExercise(catalog, userId, e.name, now);
            const logId = crypto.randomUUID();

            const sets: WorkoutSet[] = e.sets.map((s, j) => ({
                id: crypto.randomUUID(),
                exercise_log_id: logId,
                position: j,
                reps: s.reps,
                weight: s.weight,
                duration_sec: null,
                distance_m: null,
                rpe: null,
                hr_start: s.hr_start,
                hr_end: s.hr_end,
                hr_avg: null,
                is_warmup: false,
                done: true,
            }));

            return {
                id: logId,
                workout_id: workoutId,
                exercise_id: exercise.id,
                position: i,
                notes: e.notes ?? null,
                exercise,
                sets,
            };
        });

        persistCatalog(userId, catalog);

        const workout: Workout = {
            id: workoutId,
            user_id: userId,
            title: input.title,
            notes: null,
            routine_id: null,
            performed_at: input.performed_at ?? now,
            created_at: now,
            logs,
        };

        const all = readWorkouts(userId);
        all.push(workout);
        persistWorkouts(userId, all);
        return workout;
    },
};
