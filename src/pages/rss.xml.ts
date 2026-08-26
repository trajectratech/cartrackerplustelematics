import dataJson from "../data/car-tracker-plus-telematics.json";
import type { ThemeConfig } from "../types/theme";
import { getPublicClient } from "../lib/supabase";
import { getLivePosts } from "../lib/posts";
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

export async function GET() {
	const siteName = data.seo?.siteName || data.brand.businessName;
	const blogUrl = toAbsoluteUrl(data.brand.url, "/blogs/");
	const feedUrl = toAbsoluteUrl(data.brand.url, "/rss.xml");

	let items = "";
	const client = getPublicClient();
	if (client) {
		try {
			const result = await getLivePosts(client, { page: 1, perPage: 20 });
			if (result.status === "ok") {
				items = result.data
					.map((post) => {
						const link = toAbsoluteUrl(data.brand.url, `/blogs/${post.slug}/`);
						const pubDate = new Date(post.published_at ?? Date.now()).toUTCString();
						const parts = [
							"<item>",
							`<title>${escapeXml(post.title)}</title>`,
							`<link>${escapeXml(link)}</link>`,
							`<guid isPermaLink="true">${escapeXml(link)}</guid>`,
							`<description>${escapeXml(post.excerpt)}</description>`,
							`<pubDate>${pubDate}</pubDate>`,
							post.categories?.name ? `<category>${escapeXml(post.categories.name)}</category>` : "",
							"</item>",
						];
						return parts.join("");
					})
					.join("");
			}
		} catch (err) {
			console.log(
				JSON.stringify({
					scope: "rss",
					event: "load_failed",
					message: err instanceof Error ? err.message : String(err),
				}),
			);
		}
	}

	const body = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
		"<channel>",
		`<title>${escapeXml(siteName)} blog</title>`,
		`<link>${escapeXml(blogUrl)}</link>`,
		`<description>${escapeXml(data.brand.description)}</description>`,
		"<language>en-ng</language>",
		`<atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />`,
		items,
		"</channel>",
		"</rss>",
	].join("");

	return new Response(body, {
		headers: {
			"Content-Type": "application/rss+xml; charset=utf-8",
			"Cache-Control": "public, max-age=300, stale-while-revalidate=3600, stale-if-error=86400",
		},
	});
}
