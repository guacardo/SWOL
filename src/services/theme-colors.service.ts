/*
 * Bridge between CSS theme tokens and the <canvas> 2D context.
 * Canvas can't read CSS variables directly, so we resolve them off the root
 * element. Read fresh on each paint (or after a theme change) so charts always
 * match the active `data-theme`.
 */

export function cssVar(name: string): string {
    if (typeof document === "undefined") return "";
    return getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();
}

export interface ChartColors {
    grid: string;
    line: string;
    line2: string;
    fill: string;
    text: string;
    textMuted: string;
}

export function getChartColors(): ChartColors {
    return {
        grid: cssVar("--swl-chart_grid"),
        line: cssVar("--swl-chart_line"),
        line2: cssVar("--swl-chart_line-2"),
        fill: cssVar("--swl-chart_fill"),
        text: cssVar("--swl-color_text"),
        textMuted: cssVar("--swl-color_text-muted"),
    };
}
