import { For, Show, createMemo, createResource, createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { Plus, Pencil, Trash2, X, Search } from "lucide-solid";
import { db } from "@/lib/db";
import { getUser } from "@/stores/auth.store";
import type { Exercise, ExerciseModality } from "@/lib/types";
import type { ExerciseInput } from "@/lib/db";
import styles from "./Exercises.module.css";

const MODALITIES: ExerciseModality[] = ["weighted", "bodyweight", "duration", "cardio"];
const UNITS = ["lb", "kg", "sec", "m"];
const MUSCLE_GROUPS = ["chest", "back", "shoulders", "biceps", "triceps", "legs", "core", "cardio"];
const EQUIPMENT = ["barbell", "dumbbell", "cable", "machine", "bodyweight", "kettlebell", "band"];

const emptyForm = (): ExerciseInput => ({
    name: "",
    modality: "weighted",
    muscle_group: null,
    equipment: null,
    unit: "lb",
    increment: null,
    min_value: null,
    max_value: null,
});

// "" -> null, otherwise a number (NaN guarded).
const num = (v: string): number | null => {
    const t = v.trim();
    if (t === "") return null;
    const n = Number(t);
    return Number.isNaN(n) ? null : n;
};

export default function Exercises() {
    const user = () => getUser();
    const [exercises, { refetch }] = createResource(
        () => user()?.id ?? null,
        (id) => db.listExercises(id),
    );

    const [query, setQuery] = createSignal("");
    const [editingId, setEditingId] = createSignal<string | null>(null); // null = closed
    const [isNew, setIsNew] = createSignal(false);
    const [form, setForm] = createStore<ExerciseInput>(emptyForm());
    const [saving, setSaving] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);

    const open = () => editingId() !== null || isNew();
    const isMine = (e: Exercise) => !!user() && e.owner_id === user()!.id;

    const filtered = createMemo(() => {
        const q = query().trim().toLowerCase();
        const list = exercises() ?? [];
        return q ? list.filter((e) => e.name.toLowerCase().includes(q)) : list;
    });

    // Group by muscle group for catalog-style scanning.
    const grouped = createMemo(() => {
        const groups = new Map<string, Exercise[]>();
        for (const e of filtered()) {
            const key = e.muscle_group || "uncategorized";
            (groups.get(key) ?? groups.set(key, []).get(key)!).push(e);
        }
        return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    });

    const startNew = () => {
        setError(null);
        setForm(emptyForm());
        setIsNew(true);
        setEditingId(null);
    };

    const startEdit = (e: Exercise) => {
        setError(null);
        setForm({
            name: e.name,
            modality: e.modality,
            muscle_group: e.muscle_group,
            equipment: e.equipment,
            unit: e.unit,
            increment: e.increment,
            min_value: e.min_value,
            max_value: e.max_value,
        });
        setIsNew(false);
        setEditingId(e.id);
    };

    const close = () => {
        setIsNew(false);
        setEditingId(null);
    };

    const save = async (ev: Event) => {
        ev.preventDefault();
        const u = user();
        if (!u) return;
        if (!form.name.trim()) {
            setError("Name is required.");
            return;
        }
        if (form.min_value != null && form.max_value != null && form.min_value > form.max_value) {
            setError("Min can't be greater than max.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const input: ExerciseInput = { ...form, name: form.name.trim() };
            if (isNew()) {
                await db.createExercise(u.id, input);
            } else {
                await db.updateExercise(u.id, editingId()!, input);
            }
            close();
            void refetch();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Save failed.");
        } finally {
            setSaving(false);
        }
    };

    const remove = async (e: Exercise) => {
        const u = user();
        if (!u) return;
        if (!confirm(`Delete "${e.name}"? This can't be undone.`)) return;
        try {
            await db.deleteExercise(u.id, e.id);
            void refetch();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Delete failed.");
        }
    };

    return (
        <div class={styles.page}>
            <header class={styles.header}>
                <div>
                    <h1 class={styles.title}>Exercises</h1>
                    <p class={styles.sub}>
                        Your catalog. Shared exercises are read-only; edit or add your own.
                    </p>
                </div>
                <button class={styles.newBtn} onClick={startNew}>
                    <Plus size={16} /> New exercise
                </button>
            </header>

            <div class={styles.searchRow}>
                <Search size={16} class={styles.searchIcon} />
                <input
                    class={styles.search}
                    placeholder="Search exercises…"
                    value={query()}
                    onInput={(e) => setQuery(e.currentTarget.value)}
                />
            </div>

            <Show
                when={!exercises.loading}
                fallback={<p class={styles.muted}>Loading…</p>}
            >
                <Show
                    when={filtered().length > 0}
                    fallback={<p class={styles.muted}>No exercises match.</p>}
                >
                    <For each={grouped()}>
                        {([group, items]) => (
                            <section class={styles.group}>
                                <h2 class={styles.groupTitle}>{group}</h2>
                                <ul class={styles.list}>
                                    <For each={items}>
                                        {(e) => (
                                            <li class={styles.row}>
                                                <div class={styles.rowMain}>
                                                    <span class={styles.name}>{e.name}</span>
                                                    <Show when={!isMine(e)}>
                                                        <span class={styles.badge}>shared</span>
                                                    </Show>
                                                    <Show when={isMine(e) && e.is_stub}>
                                                        <span class={`${styles.badge} ${styles.stub}`}>stub</span>
                                                    </Show>
                                                </div>
                                                <div class={styles.meta}>
                                                    <span>{e.modality}</span>
                                                    <Show when={e.equipment}>
                                                        <span>· {e.equipment}</span>
                                                    </Show>
                                                    <span>
                                                        {" · "}
                                                        {e.increment != null ? `${e.increment} ${e.unit} steps` : e.unit}
                                                    </span>
                                                    <Show when={e.min_value != null || e.max_value != null}>
                                                        <span>
                                                            {" · "}
                                                            {e.min_value ?? "–"}–{e.max_value ?? "–"} {e.unit}
                                                        </span>
                                                    </Show>
                                                </div>
                                                <Show when={isMine(e)}>
                                                    <div class={styles.actions}>
                                                        <button class={styles.iconBtn} title="Edit" onClick={() => startEdit(e)}>
                                                            <Pencil size={15} />
                                                        </button>
                                                        <button class={styles.iconBtn} title="Delete" onClick={() => void remove(e)}>
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </Show>
                                            </li>
                                        )}
                                    </For>
                                </ul>
                            </section>
                        )}
                    </For>
                </Show>
            </Show>

            <Show when={open()}>
                <div class={styles.overlay} onClick={close}>
                    <form class={styles.modal} onSubmit={save} onClick={(e) => e.stopPropagation()}>
                        <div class={styles.modalHead}>
                            <h2 class={styles.modalTitle}>{isNew() ? "New exercise" : "Edit exercise"}</h2>
                            <button type="button" class={styles.iconBtn} title="Close" onClick={close}>
                                <X size={18} />
                            </button>
                        </div>

                        <label class={styles.field}>
                            <span>Name</span>
                            <input
                                class={styles.input}
                                value={form.name}
                                onInput={(e) => setForm("name", e.currentTarget.value)}
                                placeholder="e.g. Incline Dumbbell Press"
                            />
                        </label>

                        <div class={styles.fieldRow}>
                            <label class={styles.field}>
                                <span>Modality</span>
                                <select
                                    class={styles.input}
                                    value={form.modality}
                                    onChange={(e) => setForm("modality", e.currentTarget.value as ExerciseModality)}
                                >
                                    <For each={MODALITIES}>{(m) => <option value={m}>{m}</option>}</For>
                                </select>
                            </label>
                            <label class={styles.field}>
                                <span>Unit</span>
                                <select
                                    class={styles.input}
                                    value={form.unit}
                                    onChange={(e) => setForm("unit", e.currentTarget.value)}
                                >
                                    <For each={UNITS}>{(u) => <option value={u}>{u}</option>}</For>
                                </select>
                            </label>
                        </div>

                        <div class={styles.fieldRow}>
                            <label class={styles.field}>
                                <span>Muscle group</span>
                                <input
                                    class={styles.input}
                                    list="muscle-groups"
                                    value={form.muscle_group ?? ""}
                                    onInput={(e) => setForm("muscle_group", e.currentTarget.value || null)}
                                />
                                <datalist id="muscle-groups">
                                    <For each={MUSCLE_GROUPS}>{(g) => <option value={g} />}</For>
                                </datalist>
                            </label>
                            <label class={styles.field}>
                                <span>Equipment</span>
                                <input
                                    class={styles.input}
                                    list="equipment"
                                    value={form.equipment ?? ""}
                                    onInput={(e) => setForm("equipment", e.currentTarget.value || null)}
                                />
                                <datalist id="equipment">
                                    <For each={EQUIPMENT}>{(g) => <option value={g} />}</For>
                                </datalist>
                            </label>
                        </div>

                        <div class={styles.fieldRow}>
                            <label class={styles.field}>
                                <span>Increment</span>
                                <input
                                    class={styles.input}
                                    type="number"
                                    inputmode="decimal"
                                    placeholder="e.g. 2.5"
                                    value={form.increment ?? ""}
                                    onInput={(e) => setForm("increment", num(e.currentTarget.value))}
                                />
                            </label>
                            <label class={styles.field}>
                                <span>Min</span>
                                <input
                                    class={styles.input}
                                    type="number"
                                    inputmode="decimal"
                                    value={form.min_value ?? ""}
                                    onInput={(e) => setForm("min_value", num(e.currentTarget.value))}
                                />
                            </label>
                            <label class={styles.field}>
                                <span>Max</span>
                                <input
                                    class={styles.input}
                                    type="number"
                                    inputmode="decimal"
                                    value={form.max_value ?? ""}
                                    onInput={(e) => setForm("max_value", num(e.currentTarget.value))}
                                />
                            </label>
                        </div>

                        <Show when={error()}>
                            <p class={styles.error}>{error()}</p>
                        </Show>

                        <div class={styles.modalActions}>
                            <button type="button" class={styles.ghost} onClick={close}>
                                Cancel
                            </button>
                            <button type="submit" class={styles.save} disabled={saving()}>
                                {saving() ? "Saving…" : isNew() ? "Create" : "Save"}
                            </button>
                        </div>
                    </form>
                </div>
            </Show>
        </div>
    );
}
