import { createSignal } from "solid-js";

/**
 * Type system as a free MIXER, not fixed presets. Four roles — display, body,
 * num(erals), accent — each independently selectable from FONTS below. The
 * active combo is pushed onto <html> as inline CSS custom properties
 * (--swl-font_*), so it applies app-wide and composes with the color theme and
 * the /type playground. Presets are just convenient starting combos.
 * See [[swol-brand-type-taste]].
 */

export type Role = "display" | "body" | "num" | "accent";

export interface FontOption {
    id: string;
    label: string;
    stack: string;
    note?: string; // foundry / vibe
}

const sans = (n: string) => `"${n}", system-ui, -apple-system, sans-serif`;
const mono = (n: string) => `"${n}", ui-monospace, "SFMono-Regular", Menlo, monospace`;
const serif = (n: string) => `"${n}", Georgia, serif`;

export const FONTS: Record<Role, FontOption[]> = {
    display: [
        { id: "clash-display", label: "Clash Display", stack: sans("Clash Display"), note: "Fontshare" },
        { id: "clash-grotesk", label: "Clash Grotesk", stack: sans("Clash Grotesk"), note: "Fontshare" },
        { id: "archivo-black", label: "Archivo Black", stack: sans("Archivo Black"), note: "Google" },
        { id: "cabinet", label: "Cabinet Grotesk", stack: sans("Cabinet Grotesk"), note: "Fontshare" },
        { id: "hanken", label: "Hanken Grotesk", stack: sans("Hanken Grotesk"), note: "Google" },
    ],
    body: [
        { id: "satoshi", label: "Satoshi", stack: sans("Satoshi"), note: "Fontshare" },
        { id: "hanken", label: "Hanken Grotesk", stack: sans("Hanken Grotesk"), note: "Google" },
        { id: "archivo", label: "Archivo", stack: sans("Archivo"), note: "Google" },
    ],
    num: [
        { id: "martian", label: "Martian Mono", stack: mono("Martian Mono"), note: "condensed" },
        { id: "tabular", label: "Tabular", stack: mono("Tabular"), note: "Fontshare" },
        { id: "plex", label: "IBM Plex Mono", stack: mono("IBM Plex Mono"), note: "clinical" },
        { id: "jetbrains", label: "JetBrains Mono", stack: mono("JetBrains Mono"), note: "terminal" },
    ],
    accent: [
        { id: "chillax", label: "Chillax", stack: sans("Chillax"), note: "Fontshare" },
        { id: "cabinet", label: "Cabinet Grotesk", stack: sans("Cabinet Grotesk"), note: "Fontshare" },
        { id: "arvo", label: "Arvo", stack: serif("Arvo"), note: "slab" },
    ],
};

export interface Combo {
    display: string;
    body: string;
    num: string;
    accent: string;
}

export interface Preset {
    id: string;
    label: string;
    combo: Combo;
}

/* Quick-start combos (Condensed Iron retired — too "periodical", not SWOL). */
export const PRESETS: Preset[] = [
    {
        id: "clash",
        label: "Clash Flair",
        combo: { display: "clash-display", body: "satoshi", num: "martian", accent: "chillax" },
    },
    {
        id: "grotesk",
        label: "Badass Grotesk",
        combo: { display: "clash-grotesk", body: "hanken", num: "martian", accent: "cabinet" },
    },
    {
        id: "archivo",
        label: "Archivo System",
        combo: { display: "archivo-black", body: "archivo", num: "tabular", accent: "arvo" },
    },
];

const DEFAULT: Combo = PRESETS[0].combo; // Clash Flair — the locked brand default
const KEY = "swl-fonts";

function load(): Combo {
    if (typeof localStorage === "undefined") return DEFAULT;
    try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as Partial<Combo>;
            // Merge over DEFAULT + drop any ids no longer in FONTS (e.g. retired).
            const merged = { ...DEFAULT, ...parsed };
            (Object.keys(FONTS) as Role[]).forEach((r) => {
                if (!FONTS[r].some((o) => o.id === merged[r])) merged[r] = DEFAULT[r];
            });
            return merged;
        }
    } catch {
        /* fall through to default */
    }
    return DEFAULT;
}

const [combo, setComboInternal] = createSignal<Combo>(load());

export function getCombo() {
    return combo();
}

function persist(c: Combo) {
    if (typeof localStorage !== "undefined") localStorage.setItem(KEY, JSON.stringify(c));
}

export function setRole(role: Role, id: string) {
    const next = { ...combo(), [role]: id };
    setComboInternal(next);
    persist(next);
}

export function applyPreset(p: Preset) {
    setComboInternal({ ...p.combo });
    persist(p.combo);
}

export function stackFor(role: Role, id: string): string {
    return FONTS[role].find((o) => o.id === id)?.stack ?? "";
}

const VAR: Record<Role, string> = {
    display: "--swl-font_display",
    body: "--swl-font_body",
    num: "--swl-font_num",
    accent: "--swl-font_accent",
};

/** Push the active combo onto <html> as inline CSS vars. Call from an effect. */
export function applyFonts() {
    if (typeof document === "undefined") return;
    const c = combo();
    const root = document.documentElement;
    (Object.keys(VAR) as Role[]).forEach((role) => {
        root.style.setProperty(VAR[role], stackFor(role, c[role]));
    });
    // Keep legacy --swl-font_data aligned to the body face.
    root.style.setProperty("--swl-font_data", stackFor("body", c.body));
}

/** The preset matching the current combo exactly, or null if it's a custom mix. */
export function activePreset(): Preset | null {
    const c = combo();
    return (
        PRESETS.find(
            (p) =>
                p.combo.display === c.display &&
                p.combo.body === c.body &&
                p.combo.num === c.num &&
                p.combo.accent === c.accent,
        ) ?? null
    );
}

/** Cycle through presets (used by the shell quick-toggle). */
export function cyclePreset() {
    const cur = activePreset();
    const i = cur ? PRESETS.findIndex((p) => p.id === cur.id) : -1;
    applyPreset(PRESETS[(i + 1) % PRESETS.length]);
}
