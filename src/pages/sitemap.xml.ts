import dataJson from "../data/car-tracker-plus-telematics.json";
import type { ThemeConfig } from "../types/theme";
import { toAbsoluteUrl } from "../utils/seo";

const data = dataJson as ThemeConfig;

export const prerender = false;

export async function GET() {
	const sitemaps = [
		toAbsoluteUrl(data.brand.url, "/sitemap-index.xml"),
		toAbsoluteUrl(data.brand.url, "/sitemap-blog.xml"),
	];

	const body = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemaps
		.map((loc) => `<sitemap><loc>${loc}</loc></sitemap>`)
		.join("")}</sitemapindex>`;

	return new Response(body, {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
}
