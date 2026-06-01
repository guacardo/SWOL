import { Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { signInWith, signInDev } from "@/stores/auth.store";
import { USE_MOCK } from "@/lib/config";
import styles from "./Login.module.css";

export default function Login() {
    const navigate = useNavigate();

    const enterDev = () => {
        signInDev();
        navigate("/", { replace: true });
    };

    return (
        <div class={styles.page}>
            <div class={styles.card}>
                <h1 class={styles.title}>SWOL</h1>
                <p class={styles.sub}>Track lifts. Flex on friends. Politely.</p>

                <Show
                    when={USE_MOCK}
                    fallback={
                        <>
                            <button class={styles.provider} onClick={() => void signInWith("google")}>
                                Continue with Google
                            </button>
                            <button class={styles.provider} onClick={() => void signInWith("github")}>
                                Continue with GitHub
                            </button>
                        </>
                    }
                >
                    <button class={styles.provider} onClick={enterDev}>
                        Enter (dev mode)
                    </button>
                    <p class={styles.fine}>No Supabase configured — running on the local mock data layer.</p>
                </Show>
            </div>
        </div>
    );
}
