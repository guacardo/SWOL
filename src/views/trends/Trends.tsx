import { onMount, onCleanup, createSignal, createEffect } from "solid-js";
import { getChartColors } from "@/services/theme-colors.service";
import { getTheme } from "@/stores/theme.store";
import { getUser } from "@/stores/auth.store";
import { db } from "@/lib/db";

// Fallback when nothing's been logged yet (top-set weight over sessions).
const SAMPLE = [40, 42.5, 42.5, 45, 47.5, 47.5, 50, 52.5, 55, 55, 57.5, 60];

/**
 * Canvas trend painter. Charts top-set weight over time for your most-logged
 * exercise (falls back to sample data). Reads colors from theme tokens and
 * repaints on theme change.
 */
export default function Trends() {
    let canvas: HTMLCanvasElement | undefined;
    const [series, setSeries] = createSignal<number[]>(SAMPLE);
    const [label, setLabel] = createSignal("Sample data — log a few workouts to see your own");

    const paint = () => {
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const data = series();
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const c = getChartColors();
        const pad = 32;
        const min = Math.min(...data);
        const max = Math.max(...data);
        const x = (i: number) =>
            pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2);
        const y = (v: number) =>
            h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);

        ctx.clearRect(0, 0, w, h);

        ctx.strokeStyle = c.grid;
        ctx.lineWidth = 1;
        for (let g = 0; g <= 4; g++) {
            const gy = pad + (g / 4) * (h - pad * 2);
            ctx.beginPath();
            ctx.moveTo(pad, gy);
            ctx.lineTo(w - pad, gy);
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.moveTo(x(0), y(data[0]));
        data.forEach((v, i) => ctx.lineTo(x(i), y(v)));
        ctx.lineTo(x(data.length - 1), h - pad);
        ctx.lineTo(x(0), h - pad);
        ctx.closePath();
        ctx.fillStyle = c.fill;
        ctx.fill();

        ctx.beginPath();
        data.forEach((v, i) =>
            i === 0 ? ctx.moveTo(x(i), y(v)) : ctx.lineTo(x(i), y(v)),
        );
        ctx.strokeStyle = c.line;
        ctx.lineWidth = 2.5;
        ctx.stroke();
    };

    onMount(async () => {
        const user = getUser();
        if (user) {
            const workouts = await db.listWorkouts(user.id);
            // Oldest -> newest so the line reads left to right.
            const ordered = [...workouts].reverse();

            // One top-set (heaviest) point per exercise per workout; chart the
            // most-logged exercise.
            const byName = new Map<string, number[]>();
            for (const wk of ordered) {
                for (const log of wk.logs ?? []) {
                    const name = log.exercise?.name;
                    if (!name) continue;
                    const weights = (log.sets ?? [])
                        .map((s) => s.weight)
                        .filter((w): w is number => w != null);
                    if (weights.length === 0) continue;
                    const arr = byName.get(name) ?? [];
                    arr.push(Math.max(...weights));
                    byName.set(name, arr);
                }
            }
            let best: [string, number[]] | null = null;
            for (const entry of byName) {
                if (entry[1].length >= 2 && (!best || entry[1].length > best[1].length)) {
                    best = entry;
                }
            }
            if (best) {
                setSeries(best[1]);
                setLabel(`${best[0]} — top set over time`);
            }
        }
        paint();
        window.addEventListener("resize", paint);
        onCleanup(() => window.removeEventListener("resize", paint));
    });

    // Repaint on theme change or new data.
    createEffect(() => {
        getTheme();
        series();
        paint();
    });

    return (
        <div style={{ "max-width": "860px", display: "grid", gap: "1rem" }}>
            <h1 style={{ margin: 0 }}>Trends</h1>
            <p style={{ margin: 0, color: "var(--swl-color_text-muted)" }}>
                {label()}
            </p>
            <canvas
                ref={canvas}
                style={{
                    width: "100%",
                    height: "320px",
                    background: "var(--swl-color_surface)",
                    border: "1px solid var(--swl-color_border)",
                    "border-radius": "var(--swl-radius)",
                }}
            />
        </div>
    );
}
