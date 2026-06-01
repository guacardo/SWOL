import { type ParentProps, Show, createEffect, onMount } from "solid-js";
import { useLocation, useNavigate } from "@solidjs/router";
import { getTheme } from "@/stores/theme.store";
import { initAuth, getUser, isReady } from "@/stores/auth.store";
import AppShell from "@/components/app-shell/AppShell";

export default function RootLayout(props: ParentProps) {
    const location = useLocation();
    const navigate = useNavigate();

    // Keep <html data-theme> in sync with the theme store.
    createEffect(() => {
        document.documentElement.setAttribute("data-theme", getTheme());
    });

    onMount(() => {
        void initAuth();
    });

    const isAuthRoute = () =>
        location.pathname === "/login" || location.pathname === "/auth/callback";

    // Central gate: once auth has resolved, bounce unauthenticated users to the
    // login screen and authenticated users off it.
    createEffect(() => {
        if (!isReady()) return;
        if (!getUser() && !isAuthRoute()) {
            navigate("/login", { replace: true });
        } else if (getUser() && location.pathname === "/login") {
            navigate("/", { replace: true });
        }
    });

    return (
        <Show when={!isAuthRoute()} fallback={props.children}>
            <AppShell>{props.children}</AppShell>
        </Show>
    );
}
