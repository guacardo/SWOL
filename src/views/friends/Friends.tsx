/** Social feed placeholder — wired up once the backend lands. */
export default function Friends() {
    return (
        <div style={{ "max-width": "720px", display: "grid", gap: "0.75rem" }}>
            <h1 style={{ margin: 0 }}>Friends</h1>
            <p style={{ margin: 0, color: "var(--swl-color_text-muted)" }}>
                Following, the workout feed, and 💪 reactions land here once
                we're on a real backend (the schema already has follows +
                reactions tables).
            </p>
        </div>
    );
}
