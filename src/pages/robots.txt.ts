import dataJson from "../data/car-tracker-plus-telematics.json";
import type { ThemeConfig } from "../types/theme";
import { toAbsoluteUrl } from "../utils/seo";

const data = dataJson as ThemeConfig;
export const prerender = true;

export function GET() {
	const body = [
		"User-agent: *",
		"Allow: /",
		"",
		`Sitemap: ${toAbsoluteUrl(data.brand.url, "/sitemap-index.xml")}`,
		`Host: ${new URL(data.brand.url).host}`,
	].join("\n");

	return new Response(body, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
		},
	});
}
