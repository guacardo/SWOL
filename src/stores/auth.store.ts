import { createSignal } from "solid-js";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/supabaseClient";
import { USE_MOCK } from "@/lib/config";

/** App-level user shape, decoupled from Supabase's Session type. */
export interface AppUser {
    id: string;
    email: string;
    display_name: string;
    avatar_url: string | null;
}

const DEV_KEY = "swl-dev-user";

const [user, setUser] = createSignal<AppUser | null>(null);
const [ready, setReady] = createSignal(false);

export function getUser() {
    return user();
}

export function isReady() {
    return ready();
}

function mapUser(session: Session | null): AppUser | null {
    const u = session?.user;
    if (!u) return null;
    return {
        id: u.id,
        email: u.email ?? "",
        display_name:
            (u.user_metadata?.full_name as string | undefined) ??
            u.email?.split("@")[0] ??
            "Lifter",
        avatar_url: (u.user_metadata?.avatar_url as string | undefined) ?? null,
    };
}

function loadDevUser(): AppUser | null {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(DEV_KEY);
    return raw ? (JSON.parse(raw) as AppUser) : null;
}

/** Wire up auth. Call once at app start. */
export async function initAuth() {
    if (USE_MOCK) {
        setUser(loadDevUser());
        setReady(true);
        return;
    }

    const { data } = await supabase!.auth.getSession();
    setUser(mapUser(data.session));
    setReady(true);
    supabase!.auth.onAuthStateChange((_event, next) => setUser(mapUser(next)));
}

export type OAuthProvider = "google" | "github";

/** Real OAuth (non-mock mode). */
export async function signInWith(provider: OAuthProvider) {
    return supabase!.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
}

/** Mock-mode dev sign-in: fabricate a local user, no network. */
export function signInDev(name = "Dev Lifter") {
    const u: AppUser = {
        id: "dev-user",
        email: "dev@swol.local",
        display_name: name,
        avatar_url: null,
    };
    localStorage.setItem(DEV_KEY, JSON.stringify(u));
    setUser(u);
}

export async function signOut() {
    if (USE_MOCK) {
        localStorage.removeItem(DEV_KEY);
        setUser(null);
        return;
    }
    await supabase!.auth.signOut();
}
