import { Show, createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
import {
    signInWith,
    signInDev,
    signInPassword,
    signUpPassword,
} from "@/stores/auth.store";
import { USE_MOCK } from "@/lib/config";
import styles from "./Login.module.css";

export default function Login() {
    const navigate = useNavigate();

    const [mode, setMode] = createSignal<"signin" | "signup">("signin");
    const [email, setEmail] = createSignal("");
    const [password, setPassword] = createSignal("");
    const [error, setError] = createSignal<string | null>(null);
    const [busy, setBusy] = createSignal(false);

    const enterDev = () => {
        signInDev();
        navigate("/", { replace: true });
    };

    const submit = async (e: Event) => {
        e.preventDefault();
        setError(null);
        setBusy(true);
        const fn = mode() === "signup" ? signUpPassword : signInPassword;
        const err = await fn(email().trim(), password());
        setBusy(false);
        if (err) {
            setError(err);
            return;
        }
        navigate("/", { replace: true });
    };

    const oauth = async (provider: "google" | "github") => {
        setError(null);
        const err = await signInWith(provider);
        if (err) setError(`${provider}: ${err}`);
    };

    return (
        <div class={styles.page}>
            <div class={styles.card}>
                <h1 class={styles.title}>SWOL</h1>
                <p class={styles.sub}>Track lifts. Flex on friends. Politely.</p>

                <Show
                    when={!USE_MOCK}
                    fallback={
                        <>
                            <button class={styles.provider} onClick={enterDev}>
                                Enter (dev mode)
                            </button>
                            <p class={styles.fine}>
                                No Supabase configured — running on the local mock data layer.
                            </p>
                        </>
                    }
                >
                    <form class={styles.form} onSubmit={submit}>
                        <input
                            class={styles.input}
                            type="email"
                            placeholder="Email"
                            autocomplete="email"
                            required
                            value={email()}
                            onInput={(e) => setEmail(e.currentTarget.value)}
                        />
                        <input
                            class={styles.input}
                            type="password"
                            placeholder="Password"
                            autocomplete={mode() === "signup" ? "new-password" : "current-password"}
                            required
                            minLength={6}
                            value={password()}
                            onInput={(e) => setPassword(e.currentTarget.value)}
                        />

                        <Show when={error()}>
                            <p class={styles.error}>{error()}</p>
                        </Show>

                        <button class={styles.primary} type="submit" disabled={busy()}>
                            {busy()
                                ? "…"
                                : mode() === "signup"
                                  ? "Create account"
                                  : "Sign in"}
                        </button>
                    </form>

                    <button
                        class={styles.toggle}
                        onClick={() => {
                            setError(null);
                            setMode(mode() === "signup" ? "signin" : "signup");
                        }}
                    >
                        {mode() === "signup"
                            ? "Have an account? Sign in"
                            : "New here? Create an account"}
                    </button>

                    <div class={styles.divider}>
                        <span>or</span>
                    </div>

                    <button class={styles.provider} onClick={() => void oauth("google")}>
                        Continue with Google
                    </button>
                    <button class={styles.provider} onClick={() => void oauth("github")}>
                        Continue with GitHub
                    </button>
                </Show>
            </div>
        </div>
    );
}
