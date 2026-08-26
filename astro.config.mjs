// @ts-check
import { defineConfig, envField } from "astro/config";
import icon from "astro-icon";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";

import solidJs from "@astrojs/solid-js";

const SITE = "https://www.cartrackerplustelematics.com";

/**
 * Relative priority. A hint only, but leaving every URL at the 0.5 default gave
 * crawlers nothing to distinguish the homepage and commercial landing pages
 * from a deep article.
 */
function getPriority(/** @type {string} */ url) {
	if (url === `${SITE}/`) return 1.0;
	return 0.8; // service and location landing pages
}

function getChangeFreq(/** @type {string} */ url) {
	if (url === `${SITE}/`) return "weekly";
	return "monthly";
}

// https://astro.build/config
export default defineConfig({
	vite: {
		plugins: [tailwindcss()],
	},
	integrations: [
		icon(),
		sitemap({
			// The 404 route is noindex; it must not be advertised in the sitemap.
			filter: (page) => !page.includes("/404") && !page.includes("/blogs") && !page.includes("/admin"),
			serialize(item) {
				item.priority = getPriority(item.url);
				item.changefreq = /** @type {any} */ (getChangeFreq(item.url));
				return item;
			},
		}),
		solidJs(),
	],
	/**
	 * Mail credentials are declared as `access: "secret"` so Astro resolves them
	 * from the runtime environment.
	 *
	 * They were previously read via `import.meta.env.ZOHO_*`, which Vite replaces
	 * with string literals during the production build. That baked the SMTP
	 * password into the deployed serverless bundle, and -- because the values were
	 * compile-time constants -- the `if (!user || !pass) return null` guard in the
	 * API route was dead-code-eliminated entirely. It also meant rotating the
	 * password had no effect until the next full rebuild.
	 *
	 * Every field is `optional` on purpose. A missing secret must surface as a
	 * friendly "not configured" response from the API route, not as a hard startup
	 * validation error that takes the whole site down.
	 */
	env: {
		schema: {
			ZOHO_SMTP_HOST: envField.string({
				context: "server",
				access: "secret",
				optional: true,
			}),
			ZOHO_SMTP_PORT: envField.string({
				context: "server",
				access: "secret",
				optional: true,
			}),
			ZOHO_SMTP_USER: envField.string({
				context: "server",
				access: "secret",
				optional: true,
			}),
			ZOHO_SMTP_PASSWORD: envField.string({
				context: "server",
				access: "secret",
				optional: true,
			}),
			ZOHO_MAIL_FROM: envField.string({
				context: "server",
				access: "secret",
				optional: true,
			}),
			ZOHO_MAIL_TO: envField.string({
				context: "server",
				access: "secret",
				optional: true,
			}),
			ZOHO_MAIL_CC: envField.string({
				context: "server",
				access: "secret",
				optional: true,
			}),
			ZOHO_MAIL_BCC: envField.string({
				context: "server",
				access: "secret",
				optional: true,
			}),

			/*
			 * Supabase. The URL and anon key are `public` because they are sent to
			 * the browser by design -- row-level security, not secrecy, is what
			 * protects the data behind them (see supabase/migrations/0001).
			 *
			 * The service-role key bypasses RLS entirely and must never reach the
			 * client, so it is `secret` and is only ever imported from
			 * `astro:env/server` inside server-only modules.
			 */
			PUBLIC_SUPABASE_URL: envField.string({
				context: "client",
				access: "public",
				optional: true,
			}),
			PUBLIC_SUPABASE_ANON_KEY: envField.string({
				context: "client",
				access: "public",
				optional: true,
			}),
			SUPABASE_SERVICE_ROLE_KEY: envField.string({
				context: "server",
				access: "secret",
				optional: true,
			}),
			/** Salt for hashing commenter IPs. Rotating it resets rate-limit state. */
			COMMENT_IP_SALT: envField.string({
				context: "server",
				access: "secret",
				optional: true,
			}),

			/**
			 * Shared with the `isr.bypassToken` below. Presence of this value in an
			 * `x-prerender-revalidate` header tells Vercel to regenerate a cached
			 * page, which is how publishing a post updates the live site without a
			 * redeploy. Secret: anyone holding it can force cache regeneration.
			 */
			VERCEL_BYPASS_TOKEN: envField.string({
				context: "server",
				access: "secret",
				optional: true,
			}),
			/** Absolute origin used when calling back into the site to revalidate. */
			PUBLIC_SITE_URL: envField.string({
				context: "server",
				access: "public",
				optional: true,
				default: SITE,
			}),
		},
	},
	output: "server",
	/*
	 * ISR is deliberately NOT enabled.
	 *
	 * With `isr.exclude`, the adapter emits the excluded routes WITHOUT a
	 * trailing slash (`^/admin$`, `^/api/quote$`) while `trailingSlash: "always"`
	 * installs a global 308 that forces one on. The redirected request then
	 * matches nothing and Vercel returns 404 -- which is exactly why /admin and
	 * the quote endpoint 404'd in production while the ISR-handled /blogs routes
	 * (emitted correctly as `^/blogs/$`) worked.
	 *
	 * Blog pages instead set `Cache-Control: s-maxage` themselves, so Vercel's
	 * CDN still serves crawlers a cached response without the adapter rewriting
	 * routes. Trade-off: a published post refreshes on the cache window rather
	 * than instantly.
	 */
	adapter: vercel(),
	site: SITE,
	/*
	 * We need BOTH "/admin" and "/admin/" (and every other route form) to reach
	 * the middleware below so it can issue the 308 redirect from slashless →
	 * slashed. With `trailingSlash: "always"` Astro's own dev-server router
	 * short-circuits slashless requests with a generic 404 / help page BEFORE
	 * the custom middleware ever sees them, so the redirect never fires.
	 * `ignore` makes Astro match both forms to the same page file. The
	 * middleware at src/middleware.ts then enforces the canonical trailing
	 * slash on every non-file URL (308) so crawlers and the Vercel CDN see a
	 * single canonical form — exactly as when `trailingSlash: "always"` was
	 * active for production, except now it also works in dev and for /admin.
	 */
	trailingSlash: "ignore",
});
