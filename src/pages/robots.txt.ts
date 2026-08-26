import dataJson from "../data/car-tracker-plus-telematics.json";
import type { ThemeConfig } from "../types/theme";
import { toAbsoluteUrl } from "../utils/seo";

const data = dataJson as ThemeConfig;
export const prerender = true;

const AI_CRAWLERS = [
	"GPTBot",
	"OAI-SearchBot",
	"ChatGPT-User",
	"ClaudeBot",
	"Claude-User",
	"Claude-SearchBot",
	"PerplexityBot",
	"Perplexity-User",
	"Google-Extended",
	"Applebot-Extended",
	"CCBot",
];

export function GET() {
	const body = [
		`# ${data.seo?.siteName || data.brand.businessName}`,
		"# Full crawl access. A structured plain-text summary for assistants",
		`# is published at ${toAbsoluteUrl(data.brand.url, "/llms.txt")}`,
		"",
		"User-agent: *",
		"Allow: /",
		"Disallow: /api/",
		"Disallow: /admin/",
		"",
		...AI_CRAWLERS.flatMap((agent) => [
			`User-agent: ${agent}`,
			"Allow: /",
			"Disallow: /api/",
			"Disallow: /admin/",
			"",
		]),
		`Sitemap: ${toAbsoluteUrl(data.brand.url, "/sitemap-index.xml")}`,
		`Sitemap: ${toAbsoluteUrl(data.brand.url, "/sitemap-blog.xml")}`,
	].join("\n");

	return new Response(body, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
}
