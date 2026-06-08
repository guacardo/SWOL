import { type ParentProps, For } from "solid-js";
import { A } from "@solidjs/router";
import { Dumbbell, ChartLine, Users, Plus, Palette, Library, Type } from "lucide-solid";
import { cycleTheme } from "@/stores/theme.store";
import { cyclePreset, activePreset } from "@/stores/font.store";
import styles from "./AppShell.module.css";

const NAV = [
    { href: "/", label: "Today", icon: Dumbbell },
    { href: "/log", label: "Log", icon: Plus },
    { href: "/exercises", label: "Exercises", icon: Library },
    { href: "/trends", label: "Trends", icon: ChartLine },
    { href: "/friends", label: "Friends", icon: Users },
    { href: "/type", label: "Type", icon: Type },
];

/**
 * Single responsive shell. On wide screens the nav is a left rail; on narrow
 * screens it collapses to a bottom tab bar (driven entirely by CSS, no JS
 * device sniffing). Same app everywhere.
 */
export default function AppShell(props: ParentProps) {
    return (
        <div class={styles.shell}>
            <nav class={styles.nav}>
                <div class={styles.brand}>SWOL</div>
                <ul class={styles.navList}>
                    <For each={NAV}>
                        {(item) => (
                            <li>
                                <A href={item.href} class={styles.navLink} activeClass={styles.active} end={item.href === "/"}>
                                    <item.icon size={20} />
                                    <span>{item.label}</span>
                                </A>
                            </li>
                        )}
                    </For>
                </ul>
                <div class={styles.controls}>
                    <button
                        class={styles.themeBtn}
                        onClick={cyclePreset}
                        title={`Type: ${activePreset()?.label ?? "Custom mix"} — tap to cycle presets (mix at /type)`}
                    >
                        <Type size={20} />
                    </button>
                    <button class={styles.themeBtn} onClick={cycleTheme} title="Cycle color theme">
                        <Palette size={20} />
                    </button>
                </div>
            </nav>
            <main class={styles.main}>{props.children}</main>
        </div>
    );
}
