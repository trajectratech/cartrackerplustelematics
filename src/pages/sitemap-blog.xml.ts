import type { APIContext } from "astro";
import dataJson from "../data/car-tracker-plus-telematics.json";
import type { ThemeConfig } from "../types/theme";
import { getPublicClient } from "../lib/supabase";
import { getLivePostIndex } from "../lib/posts";
import { toAbsoluteUrl } from "../utils/seo";

const data = dataJson as ThemeConfig;

export const prerender = false;

function escapeXml(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;");
}

export async function GET(_context: APIContext) {
	const client = getPublicClient();
	const index = client ? await getLivePostIndex(client) : null;

	const indexEntries = index?.status === "ok" ? index.entries : [];

	const blogListUrl = escapeXml(toAbsoluteUrl(data.brand.url, "/blogs/"));
	const entries = indexEntries
		.map((e) => {
			const loc = escapeXml(toAbsoluteUrl(data.brand.url, `/blogs/${e.slug}/`));
			const lastmod = new Date(e.updated_at || e.published_at || Date.now()).toISOString();
			return `<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`;
		})
		.join("");

	const body =
		'<?xml version="1.0" encoding="UTF-8"?>' +
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
		`<url><loc>${blogListUrl}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>` +
		entries +
		"</urlset>";

	return new Response(body, {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": "public, max-age=300, stale-while-revalidate=3600, stale-if-error=86400",
		},
	});
}
