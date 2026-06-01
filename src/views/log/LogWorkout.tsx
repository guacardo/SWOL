import { createSignal, For, Show } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { useNavigate } from "@solidjs/router";
import { Plus, X } from "lucide-solid";
import { db } from "@/lib/db";
import { getUser } from "@/stores/auth.store";
import styles from "./LogWorkout.module.css";

interface DraftSet {
    reps: number | null;
    weight: number | null;
    hr_start: number | null;
    hr_end: number | null;
}

interface DraftExercise {
    name: string;
    sets: DraftSet[];
}

const blankSet = (): DraftSet => ({
    reps: 8,
    weight: 20,
    hr_start: null,
    hr_end: null,
});
const blankExercise = (): DraftExercise => ({ name: "", sets: [blankSet()] });

/**
 * In-gym logging loop. Backed by a store (not a signal array) so editing one
 * field mutates it in place — the DOM nodes (and their focus) survive
 * keystrokes. Replacing array items on each keystroke would make <For> recreate
 * the row and steal focus.
 *
 * Each set carries reps, weight, and optional start/end heart rate, saved as
 * workout -> exercise_logs -> sets.
 */
export default function LogWorkout() {
    const navigate = useNavigate();
    const [title, setTitle] = createSignal("");
    const [exercises, setExercises] = createStore<DraftExercise[]>([
        blankExercise(),
    ]);
    const [saving, setSaving] = createSignal(false);

    const addExercise = () =>
        setExercises(produce((xs) => xs.push(blankExercise())));
    const removeExercise = (i: number) =>
        setExercises(produce((xs) => xs.splice(i, 1)));
    const addSet = (i: number) =>
        setExercises(i, "sets", produce((s) => s.push(blankSet())));
    const removeSet = (i: number, j: number) =>
        setExercises(i, "sets", produce((s) => s.splice(j, 1)));

    // "" -> null, otherwise a number (NaN guarded).
    const num = (v: string): number | null => {
        const t = v.trim();
        if (t === "") return null;
        const n = Number(t);
        return Number.isNaN(n) ? null : n;
    };

    const canSave = () =>
        exercises.some((e) => e.name.trim().length > 0) && !saving();

    const save = async () => {
        const user = getUser();
        if (!user) {
            navigate("/login");
            return;
        }
        setSaving(true);
        await db.createWorkout(user.id, {
            title: title().trim() || null,
            exercises: exercises
                .filter((e) => e.name.trim().length > 0)
                .map((e) => ({
                    name: e.name.trim(),
                    sets: e.sets.map((s) => ({
                        reps: s.reps,
                        weight: s.weight,
                        hr_start: s.hr_start,
                        hr_end: s.hr_end,
                    })),
                })),
        });
        navigate("/");
    };

    return (
        <div class={styles.page}>
            <h1 class={styles.title}>Log workout</h1>

            <input
                class={styles.input}
                placeholder="Workout title (e.g. Push day)"
                value={title()}
                onInput={(e) => setTitle(e.currentTarget.value)}
            />

            <For each={exercises}>
                {(ex, i) => (
                    <div class={styles.card}>
                        <div class={styles.exHeader}>
                            <input
                                class={styles.input}
                                placeholder="Exercise name"
                                value={ex.name}
                                onInput={(e) =>
                                    setExercises(i(), "name", e.currentTarget.value)
                                }
                            />
                            <Show when={exercises.length > 1}>
                                <button
                                    class={styles.iconBtn}
                                    title="Remove exercise"
                                    onClick={() => removeExercise(i())}
                                >
                                    <X size={16} />
                                </button>
                            </Show>
                        </div>

                        <div class={styles.setHeadRow}>
                            <span class={styles.setNum}>#</span>
                            <span>Reps</span>
                            <span>Weight</span>
                            <span>HR start</span>
                            <span>HR end</span>
                            <span />
                        </div>

                        <For each={ex.sets}>
                            {(s, j) => (
                                <div class={styles.setRow}>
                                    <span class={styles.setNum}>{j() + 1}</span>
                                    <input
                                        class={styles.cell}
                                        type="number"
                                        inputmode="numeric"
                                        value={s.reps ?? ""}
                                        onInput={(e) =>
                                            setExercises(
                                                i(),
                                                "sets",
                                                j(),
                                                "reps",
                                                num(e.currentTarget.value),
                                            )
                                        }
                                    />
                                    <input
                                        class={styles.cell}
                                        type="number"
                                        inputmode="decimal"
                                        value={s.weight ?? ""}
                                        onInput={(e) =>
                                            setExercises(
                                                i(),
                                                "sets",
                                                j(),
                                                "weight",
                                                num(e.currentTarget.value),
                                            )
                                        }
                                    />
                                    <input
                                        class={styles.cell}
                                        type="number"
                                        inputmode="numeric"
                                        placeholder="bpm"
                                        value={s.hr_start ?? ""}
                                        onInput={(e) =>
                                            setExercises(
                                                i(),
                                                "sets",
                                                j(),
                                                "hr_start",
                                                num(e.currentTarget.value),
                                            )
                                        }
                                    />
                                    <input
                                        class={styles.cell}
                                        type="number"
                                        inputmode="numeric"
                                        placeholder="bpm"
                                        value={s.hr_end ?? ""}
                                        onInput={(e) =>
                                            setExercises(
                                                i(),
                                                "sets",
                                                j(),
                                                "hr_end",
                                                num(e.currentTarget.value),
                                            )
                                        }
                                    />
                                    <Show
                                        when={ex.sets.length > 1}
                                        fallback={<span />}
                                    >
                                        <button
                                            class={styles.iconBtn}
                                            title="Remove set"
                                            onClick={() => removeSet(i(), j())}
                                        >
                                            <X size={14} />
                                        </button>
                                    </Show>
                                </div>
                            )}
                        </For>

                        <button class={styles.addSet} onClick={() => addSet(i())}>
                            <Plus size={14} /> Add set
                        </button>
                    </div>
                )}
            </For>

            <div class={styles.actions}>
                <button onClick={addExercise} class={styles.ghost}>
                    + Add exercise
                </button>
                <button
                    onClick={() => void save()}
                    class={styles.save}
                    disabled={!canSave()}
                >
                    {saving() ? "Saving…" : "Save workout"}
                </button>
            </div>
        </div>
    );
}
