// @ts-check
import { defineConfig, envField } from "astro/config";
import icon from "astro-icon";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";

import solidJs from "@astrojs/solid-js";

const SITE = "https://www.cartrackerplustelematics.com";

function getPriority(/** @type {string} */ url) {
        if (url === `${SITE}/`) return 1.0;
        return 0.8;
}

function getChangeFreq(/** @type {string} */ url) {
        if (url === `${SITE}/`) return "weekly";
        return "monthly";
}

export default defineConfig({
        vite: {
                plugins: [tailwindcss()],
        },
        integrations: [
                icon(),
                sitemap({
                        filter: (page) => !page.includes("/404") && !page.includes("/blogs") && !page.includes("/admin"),
                        serialize(item) {
                                item.priority = getPriority(item.url);
                                item.changefreq = /** @type {any} */ (getChangeFreq(item.url));
                                return item;
                        },
                }),
                solidJs(),
        ],
        env: {
                schema: {
                        ZOHO_SMTP_HOST: envField.string({ context: "server", access: "secret", optional: true }),
                        ZOHO_SMTP_PORT: envField.string({ context: "server", access: "secret", optional: true }),
                        ZOHO_SMTP_USER: envField.string({ context: "server", access: "secret", optional: true }),
                        ZOHO_SMTP_PASSWORD: envField.string({ context: "server", access: "secret", optional: true }),
                        ZOHO_MAIL_FROM: envField.string({ context: "server", access: "secret", optional: true }),
                        ZOHO_MAIL_TO: envField.string({ context: "server", access: "secret", optional: true }),
                        ZOHO_MAIL_CC: envField.string({ context: "server", access: "secret", optional: true }),
                        ZOHO_MAIL_BCC: envField.string({ context: "server", access: "secret", optional: true }),
                        PUBLIC_SUPABASE_URL: envField.string({ context: "client", access: "public", optional: true }),
                        PUBLIC_SUPABASE_ANON_KEY: envField.string({ context: "client", access: "public", optional: true }),
                        SUPABASE_SERVICE_ROLE_KEY: envField.string({ context: "server", access: "secret", optional: true }),
                        COMMENT_IP_SALT: envField.string({ context: "server", access: "secret", optional: true }),
                        VERCEL_BYPASS_TOKEN: envField.string({ context: "server", access: "secret", optional: true }),
                        PUBLIC_SITE_URL: envField.string({ context: "server", access: "public", optional: true, default: SITE }),
                },
        },
        output: "server",
        adapter: vercel(),
        site: SITE,
        trailingSlash: "ignore",
});
