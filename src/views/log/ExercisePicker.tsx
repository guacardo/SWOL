import { createSignal, createMemo, For, Show } from "solid-js";
import { normalizeName } from "@/lib/db/util";
import type { Exercise } from "@/lib/types";
import styles from "./ExercisePicker.module.css";

interface Props {
    value: string;
    catalog: Exercise[];
    onInput: (name: string) => void;
    placeholder?: string;
}

const MAX_SUGGESTIONS = 8;

/**
 * Free-text exercise name input with a catalog typeahead. Suggests canonical
 * rows as you type so "bench" surfaces "Barbell Bench Press" instead of silently
 * creating a private stub. Matching is on normalized_name (lower, alphanumerics
 * only) so it's punctuation/case/space-insensitive — the same key the data layer
 * resolves against.
 */
export default function ExercisePicker(props: Props) {
    const [open, setOpen] = createSignal(false);
    const [active, setActive] = createSignal(0);

    const norm = createMemo(() => normalizeName(props.value));

    // Per-word tokens, each normalized. "bench press" -> ["bench", "press"].
    const tokens = createMemo(() =>
        props.value
            .trim()
            .split(/\s+/)
            .map(normalizeName)
            .filter(Boolean),
    );

    const matches = createMemo(() => {
        const q = norm();
        const toks = tokens();
        // Rank: exact normalized > prefix > every-token-appears (any order).
        // Token matching is what makes "bench" / "bench press" surface Barbell
        // Bench Press, Dumbbell Bench Press, Smith Machine Bench Press, etc.
        const scored = props.catalog
            .map((e) => {
                const n = e.normalized_name;
                let rank = -1;
                if (q && n === q) rank = 0;
                else if (q && n.startsWith(q)) rank = 1;
                else if (toks.length === 0) rank = 3;
                else if (toks.every((t) => n.includes(t))) rank = 2;
                return { e, rank };
            })
            .filter((s) => s.rank >= 0)
            .sort((a, b) => a.rank - b.rank || a.e.name.localeCompare(b.e.name));
        return scored.slice(0, MAX_SUGGESTIONS).map((s) => s.e);
    });

    /** Exact canonical hit for the current text, if any. */
    const exact = createMemo(() =>
        props.catalog.find((e) => e.normalized_name === norm()),
    );

    const choose = (name: string) => {
        props.onInput(name);
        setOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
        if (!open() || matches().length === 0) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, matches().length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            const m = matches()[active()];
            if (m) {
                e.preventDefault();
                choose(m.name);
            }
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    };

    return (
        <div class={styles.wrap}>
            <input
                class={styles.input}
                placeholder={props.placeholder ?? "Exercise name"}
                value={props.value}
                autocomplete="off"
                onInput={(e) => {
                    props.onInput(e.currentTarget.value);
                    setActive(0);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                onKeyDown={onKeyDown}
            />

            <Show
                when={
                    props.value.trim().length > 0 && !exact() && !open()
                }
            >
                <span class={styles.newHint}>New exercise — will be added</span>
            </Show>

            <Show when={open() && matches().length > 0}>
                <ul class={styles.menu}>
                    <For each={matches()}>
                        {(ex, i) => (
                            <li>
                                <button
                                    type="button"
                                    class={`${styles.option} ${i() === active() ? styles.active : ""}`}
                                    // mousedown fires before the input's blur, so the
                                    // click lands before the menu closes.
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        choose(ex.name);
                                    }}
                                    onMouseEnter={() => setActive(i())}
                                >
                                    <span class={styles.optName}>{ex.name}</span>
                                    <Show when={ex.muscle_group}>
                                        <span class={styles.optTag}>
                                            {ex.muscle_group}
                                        </span>
                                    </Show>
                                </button>
                            </li>
                        )}
                    </For>
                </ul>
            </Show>
        </div>
    );
}
