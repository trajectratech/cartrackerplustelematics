import dataJson from "../data/car-tracker-plus-telematics.json";
import type { ThemeConfig } from "../types/theme";
import { toAbsoluteUrl } from "../utils/seo";

const data = dataJson as ThemeConfig;
export const prerender = true;

export function GET() {
	const lines = [
		`# ${data.seo?.siteName || data.brand.businessName}`,
		"",
		"> AI-readable summary of the business, services, and service areas.",
		"",
		"## Business Summary",
		...((data.seo?.aiSummary || [data.brand.description]).map((line) => `- ${line}`)),
		"",
		"## Contact",
		`- Website: ${data.brand.url}`,
		`- Phone: ${data.contact.phone}`,
		`- Email: ${data.contact.email}`,
		`- Address: ${data.contact.address}`,
		"",
		"## Service Areas",
		...((data.seo?.serviceAreas || ["Nigeria"]).map((area) => `- ${area}`)),
		"",
		"## Services",
		...(data.content.servicesSection?.listItems?.map(
			(service) => `- ${service.title}: ${service.description || ""}`.trim(),
		) || []),
		"",
		"## Landing Pages",
		...(data.seo?.landingPages?.map(
			(page) => `- ${page.headline}: ${toAbsoluteUrl(data.brand.url, `/${page.slug}/`)}`,
		) || []),
	];

	return new Response(lines.join("\n"), {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
		},
	});
}
