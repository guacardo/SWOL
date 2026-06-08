import { For } from "solid-js";
import {
    FONTS,
    PRESETS,
    getCombo,
    setRole,
    applyPreset,
    activePreset,
    type Role,
} from "@/stores/font.store";
import { getTheme, cycleTheme } from "@/stores/theme.store";
import styles from "./TypeSpecimen.module.css";

/**
 * Type MIXER. Pick each role (display / body / numerals / accent) independently
 * and the whole app re-typesets live — these aren't fixed presets, they're a
 * build-your-own kit. Presets are just starting points. Judge on real content:
 * the lowercase g, the descenders, whether numbers hold a column. Color theme is
 * a separate axis (cycle the chip). See /type in the nav.
 */

const PANGRAM = "Pack my big jug of pre-workout — gauge the agony, enjoy.";

const ROLES: { key: Role; label: string; hint: string }[] = [
    { key: "display", label: "Display", hint: "headers + wordmark" },
    { key: "body", label: "Body", hint: "UI + copy" },
    { key: "num", label: "Numerals", hint: "weights · reps · HR" },
    { key: "accent", label: "Accent", hint: "dry one-liners" },
];

const SETS = [
    { ex: "Barbell Bench Press", weight: 225, reps: 5, hr: 142 },
    { ex: "Incline Dumbbell Press", weight: 80, reps: 8, hr: 151 },
    { ex: "Cable Fly", weight: 27.5, reps: 12, hr: 138 },
];

export default function TypeSpecimen() {
    const combo = () => getCombo();
    const preset = () => activePreset();

    return (
        <div class={styles.page}>
            <header class={styles.head}>
                <h1 class={styles.h1}>Type mixer</h1>
                <p class={styles.lede}>
                    Mix each role independently — it re-typesets the whole app live.
                    Judge the <span class={styles.kbd}>g</span>, the descenders, and
                    whether the numbers hold a column.
                </p>

                {/* preset quick-starts */}
                <div class={styles.presetRow}>
                    <span class={styles.roleLabel}>Start from</span>
                    <For each={PRESETS}>
                        {(p) => (
                            <button
                                class={styles.preset}
                                classList={{ [styles.presetOn]: preset()?.id === p.id }}
                                onClick={() => applyPreset(p)}
                            >
                                {p.label}
                            </button>
                        )}
                    </For>
                    <span class={styles.activeTag}>
                        {preset() ? preset()!.label : "Custom mix"}
                    </span>
                    <button class={styles.themeChip} onClick={cycleTheme}>
                        theme: {getTheme()} ↻
                    </button>
                </div>

                {/* per-role pickers — each chip previews its own font */}
                <For each={ROLES}>
                    {(role) => (
                        <div class={styles.roleGroup}>
                            <div class={styles.roleHead}>
                                <span class={styles.roleLabel}>{role.label}</span>
                                <span class={styles.roleHint}>{role.hint}</span>
                            </div>
                            <div class={styles.chips}>
                                <For each={FONTS[role.key]}>
                                    {(opt) => (
                                        <button
                                            class={styles.chip}
                                            classList={{
                                                [styles.chipOn]: combo()[role.key] === opt.id,
                                            }}
                                            style={{ "font-family": opt.stack }}
                                            onClick={() => setRole(role.key, opt.id)}
                                        >
                                            {opt.label}
                                            <span class={styles.chipNote}>{opt.note}</span>
                                        </button>
                                    )}
                                </For>
                            </div>
                        </div>
                    )}
                </For>
            </header>

            {/* live preview — reflects the global combo on <html> */}
            <section class={styles.card}>
                <div class={styles.wordmark}>SWOL</div>
                <h2 class={styles.section}>Push Day · Chest</h2>

                <p class={styles.body}>
                    Show up. Move the weight. Log it honestly. {PANGRAM}
                </p>

                <div class={styles.table}>
                    <div class={styles.thead}>
                        <span>Exercise</span>
                        <span class={styles.num}>Weight</span>
                        <span class={styles.num}>Reps</span>
                        <span class={styles.num}>HR</span>
                    </div>
                    <For each={SETS}>
                        {(s) => (
                            <div class={styles.trow}>
                                <span>{s.ex}</span>
                                <span class={styles.num}>{s.weight}</span>
                                <span class={styles.num}>{s.reps}</span>
                                <span class={styles.num}>{s.hr}</span>
                            </div>
                        )}
                    </For>
                    <div class={styles.totals}>
                        <span>Volume</span>
                        <span class={styles.num} style={{ "grid-column": "2 / -1" }}>
                            12,480 lb
                        </span>
                    </div>
                </div>

                <div class={styles.glyphRow}>
                    <span class={styles.glyphsDisplay}>g j y p q a g R Q & @</span>
                </div>
                <div class={styles.glyphRow}>
                    <span class={styles.glyphsData}>0 1 2 3 4 5 6 7 8 9</span>
                </div>
                <div class={styles.statLine}>
                    225 lb × 5 · 142 bpm · 12,480 lb · 1:30 rest
                </div>

                <p class={styles.accent}>“0 lbs moved today. Bold strategy.”</p>

                <div class={styles.actions}>
                    <button class={styles.primary}>Save workout</button>
                    <button class={styles.ghost}>+ Add set</button>
                </div>
            </section>
        </div>
    );
}
