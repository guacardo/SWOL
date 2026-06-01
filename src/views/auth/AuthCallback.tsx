import { onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { supabase } from "@/supabaseClient";

/**
 * OAuth redirect target. supabase-js parses the session out of the URL on load
 * (detectSessionInUrl, on by default); we wait for it then bounce home. In mock
 * mode there's no client, so we just redirect.
 */
export default function AuthCallback() {
    const navigate = useNavigate();

    onMount(async () => {
        if (supabase) await supabase.auth.getSession();
        navigate("/", { replace: true });
    });

    return <p style={{ padding: "2rem" }}>Signing you in…</p>;
}
