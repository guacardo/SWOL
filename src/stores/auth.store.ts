import { createSignal } from "solid-js";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/supabaseClient";

/** App-level user shape, decoupled from Supabase's Session type. */
export interface AppUser {
    id: string;
    email: string;
    display_name: string;
    avatar_url: string | null;
}

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

/** Wire up auth. Call once at app start. */
export async function initAuth() {
    const { data } = await supabase.auth.getSession();
    setUser(mapUser(data.session));
    setReady(true);
    // Keeps the store in sync across sign-in/out, token refresh, and tabs.
    supabase.auth.onAuthStateChange((_event, next) => setUser(mapUser(next)));
}

export type OAuthProvider = "google" | "github";

/**
 * Email/password sign-in (the primary path locally; signups auto-confirm).
 * Returns an error message on failure, null on success — the session arrives
 * via onAuthStateChange.
 */
export async function signInPassword(email: string, password: string): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
}

/** Email/password sign-up. Same return contract as signInPassword. */
export async function signUpPassword(email: string, password: string): Promise<string | null> {
    const { error } = await supabase.auth.signUp({ email, password });
    return error?.message ?? null;
}

/**
 * OAuth sign-in. Providers aren't configured against the local stack yet (the
 * Login UI surfaces them as "coming soon"), so this is wired for prod later.
 */
export async function signInWith(provider: OAuthProvider): Promise<string | null> {
    const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    return error?.message ?? null;
}

/** Seeded local test account (supabase/seed.sql). Real session, respects RLS. */
const TEST_EMAIL = "test@swol.local";
const TEST_PASSWORD = "swolswol";

/**
 * One-click sign-in as the seeded local test user. Normally the account already
 * exists (db seed); if it's missing (fresh stack, no reset), self-heal by
 * signing it up — local signups auto-confirm — then retry. Real session either
 * way, unlike the mock dev user.
 */
export async function signInTestUser(): Promise<string | null> {
    const first = await signInPassword(TEST_EMAIL, TEST_PASSWORD);
    if (!first) return null;
    const signupErr = await signUpPassword(TEST_EMAIL, TEST_PASSWORD);
    if (signupErr) return signupErr;
    return signInPassword(TEST_EMAIL, TEST_PASSWORD);
}

export async function signOut() {
    await supabase.auth.signOut();
}
