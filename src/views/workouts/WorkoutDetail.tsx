import { Show, For, createResource, createSignal } from "solid-js";
import { A, useParams, useNavigate } from "@solidjs/router";
import { getUser, isReady } from "@/stores/auth.store";
import { db } from "@/lib/db";
import type { ExerciseLog, WorkoutSet } from "@/lib/types";
import styles from "./WorkoutDetail.module.css";

/** Long-form date, e.g. "Saturday, June 7, 2026 · 9:14 AM". */
const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });

/** "8 × 135 lb", "8 reps", "135 lb", or "—" depending on what was logged. */
const formatSet = (s: WorkoutSet, unit: string) => {
    const parts: string[] = [];
    if (s.reps != null) parts.push(`${s.reps} reps`);
    if (s.weight != null) parts.push(`${s.weight} ${unit}`);
    if (s.duration_sec != null) parts.push(`${s.duration_sec}s`);
    if (s.distance_m != null) parts.push(`${s.distance_m} m`);
    return parts.length ? parts.join(" · ") : "—";
};

/** Per-set HR summary, e.g. "120 → 158 bpm" (only the values present). */
const formatHr = (s: WorkoutSet) => {
    const { hr_start, hr_end, hr_avg } = s;
    if (hr_start != null && hr_end != null) return `${hr_start} → ${hr_end} bpm`;
    if (hr_avg != null) return `${hr_avg} bpm avg`;
    if (hr_start != null) return `${hr_start} bpm`;
    if (hr_end != null) return `${hr_end} bpm`;
    return null;
};

const logTitle = (log: ExerciseLog) =>
    log.exercise?.name ?? "Unknown exercise";

export default function WorkoutDetail() {
    const params = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [deleting, setDeleting] = createSignal(false);

    const [workout] = createResource(
        () => {
            const u = getUser();
            return u && params.id ? { userId: u.id, id: params.id } : null;
        },
        ({ userId, id }) => db.getWorkout(userId, id),
    );

    const remove = async () => {
        const u = getUser();
        if (!u) return;
        if (!window.confirm("Delete this workout? This can't be undone.")) return;
        setDeleting(true);
        try {
            await db.deleteWorkout(u.id, params.id);
            navigate("/");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div class={styles.page}>
            <A href="/" class={styles.back}>
                ← Back
            </A>

            <Show
                when={isReady()}
                fallback={<p class={styles.muted}>Loading…</p>}
            >
                <Show
                    when={getUser()}
                    fallback={
                        <div class={styles.card}>
                            <p>You're not signed in.</p>
                            <A href="/login" class={styles.cta}>
                                Sign in
                            </A>
                        </div>
                    }
                >
                    <Show
                        when={!workout.loading}
                        fallback={<p class={styles.muted}>Loading workout…</p>}
                    >
                        <Show
                            when={workout()}
                            fallback={
                                <div class={styles.card}>
                                    <p>That workout doesn't exist.</p>
                                    <A href="/" class={styles.cta}>
                                        Back to dashboard
                                    </A>
                                </div>
                            }
                        >
                            {(w) => (
                                <>
                                    <header class={styles.header}>
                                        <h1 class={styles.title}>
                                            {w().title || "Workout"}
                                        </h1>
                                        <p class={styles.sub}>
                                            {formatDate(w().performed_at)}
                                        </p>
                                        <p class={styles.muted}>
                                            {w().logs?.length ?? 0} exercises
                                        </p>
                                    </header>

                                    <Show when={w().notes}>
                                        <p class={styles.notes}>{w().notes}</p>
                                    </Show>

                                    <Show
                                        when={(w().logs?.length ?? 0) > 0}
                                        fallback={
                                            <p class={styles.muted}>
                                                No exercises were logged.
                                            </p>
                                        }
                                    >
                                        <ul class={styles.exList}>
                                            <For each={w().logs}>
                                                {(log) => (
                                                    <li class={styles.card}>
                                                        <div class={styles.exHeader}>
                                                            <h2
                                                                class={
                                                                    styles.exName
                                                                }
                                                            >
                                                                {logTitle(log)}
                                                            </h2>
                                                            <Show
                                                                when={
                                                                    log.exercise
                                                                        ?.muscle_group
                                                                }
                                                            >
                                                                <span
                                                                    class={
                                                                        styles.tag
                                                                    }
                                                                >
                                                                    {
                                                                        log
                                                                            .exercise!
                                                                            .muscle_group
                                                                    }
                                                                </span>
                                                            </Show>
                                                        </div>

                                                        <Show when={log.notes}>
                                                            <p
                                                                class={
                                                                    styles.exNotes
                                                                }
                                                            >
                                                                {log.notes}
                                                            </p>
                                                        </Show>

                                                        <Show
                                                            when={
                                                                (log.sets
                                                                    ?.length ??
                                                                    0) > 0
                                                            }
                                                            fallback={
                                                                <p
                                                                    class={
                                                                        styles.muted
                                                                    }
                                                                >
                                                                    No sets.
                                                                </p>
                                                            }
                                                        >
                                                            <ol
                                                                class={
                                                                    styles.setList
                                                                }
                                                            >
                                                                <For
                                                                    each={
                                                                        log.sets
                                                                    }
                                                                >
                                                                    {(s, i) => (
                                                                        <li
                                                                            class={
                                                                                styles.setRow
                                                                            }
                                                                        >
                                                                            <span
                                                                                class={
                                                                                    styles.setNum
                                                                                }
                                                                            >
                                                                                {s.is_warmup
                                                                                    ? "W"
                                                                                    : i() +
                                                                                      1}
                                                                            </span>
                                                                            <span
                                                                                class={
                                                                                    styles.setMain
                                                                                }
                                                                            >
                                                                                {formatSet(
                                                                                    s,
                                                                                    log
                                                                                        .exercise
                                                                                        ?.unit ??
                                                                                        "lb",
                                                                                )}
                                                                            </span>
                                                                            <Show
                                                                                when={formatHr(
                                                                                    s,
                                                                                )}
                                                                            >
                                                                                <span
                                                                                    class={
                                                                                        styles.hr
                                                                                    }
                                                                                >
                                                                                    {formatHr(
                                                                                        s,
                                                                                    )}
                                                                                </span>
                                                                            </Show>
                                                                        </li>
                                                                    )}
                                                                </For>
                                                            </ol>
                                                        </Show>
                                                    </li>
                                                )}
                                            </For>
                                        </ul>
                                    </Show>

                                    <div class={styles.actions}>
                                        <button
                                            class={styles.danger}
                                            onClick={() => void remove()}
                                            disabled={deleting()}
                                        >
                                            {deleting()
                                                ? "Deleting…"
                                                : "Delete workout"}
                                        </button>
                                    </div>
                                </>
                            )}
                        </Show>
                    </Show>
                </Show>
            </Show>
        </div>
    );
}
