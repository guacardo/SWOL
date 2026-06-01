import { type ParentProps, createEffect, onMount } from "solid-js";
import { getTheme } from "@/stores/theme.store";
import { initAuth } from "@/stores/auth.store";
import AppShell from "@/components/app-shell/AppShell";

export default function RootLayout(props: ParentProps) {
    // Keep <html data-theme> in sync with the theme store.
    createEffect(() => {
        document.documentElement.setAttribute("data-theme", getTheme());
    });

    onMount(() => {
        void initAuth();
    });

    return <AppShell>{props.children}</AppShell>;
}
