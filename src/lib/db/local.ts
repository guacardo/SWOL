import type { Workout, Exercise } from "@/lib/types";

export interface NewExercise {
    name: string;
    sets: number | null;
    reps: number | null;
    weight_kg: number | null;
}

export interface NewWorkout {
    title: string | null;
    performed_at?: string;
    exercises: NewExercise[];
}

const keyFor = (userId: string) => `swl-workouts:${userId}`;

function read(userId: string): Workout[] {
    const raw = localStorage.getItem(keyFor(userId));
    return raw ? (JSON.parse(raw) as Workout[]) : [];
}

function persist(userId: string, workouts: Workout[]) {
    localStorage.setItem(keyFor(userId), JSON.stringify(workouts));
}

/**
 * localStorage-backed implementation of the data layer. Same async surface the
 * Supabase implementation will expose, so views never need to change.
 */
export const localDb = {
    async listWorkouts(userId: string): Promise<Workout[]> {
        return read(userId).sort((a, b) =>
            b.performed_at.localeCompare(a.performed_at),
        );
    },

    async createWorkout(userId: string, input: NewWorkout): Promise<Workout> {
        const now = new Date().toISOString();
        const workoutId = crypto.randomUUID();

        const exercises: Exercise[] = input.exercises.map((e, i) => ({
            id: crypto.randomUUID(),
            workout_id: workoutId,
            name: e.name,
            position: i,
            sets: e.sets,
            reps: e.reps,
            weight_kg: e.weight_kg,
            duration_sec: null,
            hr_start: null,
            hr_end: null,
            hr_avg: null,
            notes: null,
        }));

        const workout: Workout = {
            id: workoutId,
            user_id: userId,
            title: input.title,
            performed_at: input.performed_at ?? now,
            created_at: now,
            exercises,
        };

        const all = read(userId);
        all.push(workout);
        persist(userId, all);
        return workout;
    },
};
