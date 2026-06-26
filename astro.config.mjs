// @ts-check
import { defineConfig } from "astro/config";
import icon from "astro-icon";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

import solidJs from "@astrojs/solid-js";

// https://astro.build/config
export default defineConfig({
    vite: {
        plugins: [tailwindcss()],
    },
    integrations: [icon(), sitemap(), solidJs()],

    site: "https://cartrackerplustelematics.com",
});
