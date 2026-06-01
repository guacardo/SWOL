import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
    plugins: [
        solid(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["icon.svg"],
            manifest: {
                name: "SWOL",
                short_name: "SWOL",
                description: "Workout tracker with low-key social.",
                theme_color: "#0d0d0f",
                background_color: "#0d0d0f",
                display: "standalone",
                start_url: "/",
                icons: [
                    {
                        src: "icon.svg",
                        sizes: "any",
                        type: "image/svg+xml",
                        purpose: "any maskable",
                    },
                ],
            },
        }),
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
        },
    },
});
