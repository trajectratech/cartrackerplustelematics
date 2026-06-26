import dataJson from "../data/car-tracker-plus-telematics.json";
import type { ThemeConfig } from "../types/theme";

const data = dataJson as ThemeConfig;
export const prerender = true;

export function GET() {
	const manifest = {
		name: data.seo?.manifest?.name || data.seo?.siteName || data.brand.businessName,
		short_name:
			data.seo?.manifest?.shortName || data.seo?.siteName || data.brand.businessName,
		icons: [
			{
				src: "/android-chrome-192x192.png",
				sizes: "192x192",
				type: "image/png",
			},
			{
				src: "/android-chrome-512x512.png",
				sizes: "512x512",
				type: "image/png",
			},
		],
		theme_color: data.seo?.manifest?.themeColor || data.colors.primary,
		background_color: data.seo?.manifest?.backgroundColor || data.colors.background,
		display: data.seo?.manifest?.display || "standalone",
		start_url: "/",
		scope: "/",
	};

	return new Response(JSON.stringify(manifest, null, 2), {
		headers: {
			"Content-Type": "application/manifest+json; charset=utf-8",
		},
	});
}
