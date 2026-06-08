import { Show, For, createResource } from "solid-js";
import { A } from "@solidjs/router";
import { getUser, isReady, signOut } from "@/stores/auth.store";
import { db } from "@/lib/db";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
    const user = () => getUser();

    const [workouts] = createResource(
        () => user()?.id ?? null,
        (id) => db.listWorkouts(id),
    );

    return (
        <div class={styles.page}>
            <header class={styles.header}>
                <h1 class={styles.title}>Today</h1>
                <p class={styles.sub}>Pump up the jams. Why your legs be stumpin'?</p>
            </header>

            <Show when={isReady()} fallback={<p class={styles.muted}>Loading…</p>}>
                <Show
                    when={user()}
                    fallback={
                        <div class={styles.card}>
                            <p>You're not signed in.</p>
                            <A href="/login" class={styles.cta}>
                                Sign in
                            </A>
                        </div>
                    }
                >
                    <div class={styles.card}>
                        <p class={styles.muted}>Welcome back</p>
                        <p class={styles.email}>{user()!.display_name}</p>
                        <button class={styles.linkBtn} onClick={() => void signOut()}>
                            Sign out
                        </button>
                    </div>

                    <A href="/log" class={styles.cta}>
                        Start a workout
                    </A>

                    <section class={styles.recent}>
                        <h2 class={styles.h2}>Recent workouts</h2>
                        <Show when={(workouts()?.length ?? 0) > 0} fallback={<p class={styles.muted}>Nothing logged yet — go lift something.</p>}>
                            <ul class={styles.list}>
                                <For each={workouts()}>
                                    {(w) => (
                                        <li>
                                            <A href={`/workouts/${w.id}`} class={styles.item}>
                                                <span class={styles.itemTitle}>{w.title || "Workout"}</span>
                                                <span class={styles.muted}>
                                                    {new Date(w.performed_at).toLocaleDateString()} · {w.logs?.length ?? 0} exercises
                                                </span>
                                            </A>
                                        </li>
                                    )}
                                </For>
                            </ul>
                        </Show>
                    </section>
                </Show>
            </Show>
        </div>
    );
}
