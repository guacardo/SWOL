import { createSignal } from "solid-js";

export type Theme = "dark" | "light" | "iron";

export const THEMES: Theme[] = ["dark", "light", "iron"];

const THEME_KEY = "swl-theme";

const stored = (typeof localStorage !== "undefined" &&
    localStorage.getItem(THEME_KEY)) as Theme | null;

const [theme, setThemeInternal] = createSignal<Theme>(stored ?? "dark");

export function getTheme() {
    return theme();
}

export function setTheme(t: Theme) {
    setThemeInternal(t);
    if (typeof localStorage !== "undefined") {
        localStorage.setItem(THEME_KEY, t);
    }
}

export function cycleTheme() {
    const i = THEMES.indexOf(theme());
    setTheme(THEMES[(i + 1) % THEMES.length]);
}
