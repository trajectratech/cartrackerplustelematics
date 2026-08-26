import dataJson from "../data/car-tracker-plus-telematics.json";
import type { ThemeConfig } from "../types/theme";
import { getAllLandingPages } from "../utils/landingPages";
import { formatPhoneNumber } from "../utils/formatPhoneNumber";
import { toAbsoluteUrl } from "../utils/seo";

const data = dataJson as ThemeConfig;
export const prerender = true;
const landingPages = getAllLandingPages(data);

export function GET() {
	const servicePages = landingPages.filter(
		(page) => (page.pageCategory ?? "service") === "service",
	);
	const locationPages = landingPages.filter((page) => page.pageCategory === "location");

	const describeLandingPage = (page: (typeof landingPages)[number]) => {
		const url = toAbsoluteUrl(data.brand.url, `/${page.slug}/`);
		const summary = page.cardDescription || page.metaDescription || page.intro;
		return `- [${page.cardTitle || page.headline}](${url}): ${summary}`;
	};

	const lines = [
		`# ${data.seo?.siteName || data.brand.businessName}`,
		"",
		`> ${data.brand.description}`,
		"",
		"## Business Summary",
		"",
		...(data.seo?.aiSummary || [data.brand.description]).map((line) => `- ${line}`),
		"",
		"## Contact",
		"",
		`- Website: ${data.brand.url}`,
		`- Phone: ${formatPhoneNumber(data.contact.phone)} (${data.contact.phone})`,
		`- WhatsApp: ${data.contact.whatsapp || data.contact.phone}`,
		`- Email: ${data.contact.email}`,
		`- Address: ${[
			data.contact.address,
			data.contact.addressLocality,
			data.contact.addressRegion,
			data.contact.addressCountry,
		]
			.filter(Boolean)
			.reduce<string[]>((parts, part) => {
				if (parts.some((existing) => existing.toLowerCase().includes(part.toLowerCase()))) {
					return parts;
				}
				return [...parts, part];
			}, [])
			.join(", ")}`,
		"- Opening hours: Monday to Sunday, 08:00-20:00 (WAT)",
		"",
		"## Service Areas",
		"",
		...(data.seo?.serviceAreas || ["Nigeria"]).map((area) => `- ${area}`),
		"",
		"## Pricing",
		"",
		"- Pricing is quote-based. Cost depends on the tracking device, the vehicle, the",
		"  number of units, and the installation requirement.",
		`- Quotes are requested through the form at ${toAbsoluteUrl(data.brand.url, "/#get-a-quote")}`,
		"  or over WhatsApp. No public price list is published.",
		"",
		"## Services",
		"",
		...(data.content.servicesSection?.listItems?.map((service) =>
			`- ${service.title}: ${service.description || ""}`.trim(),
		) || []),
		"",
		"## Service Pages",
		"",
		...servicePages.map(describeLandingPage),
		...(locationPages.length
			? ["", "## Location Pages", "", ...locationPages.map(describeLandingPage)]
			: []),
		"",
		"## Blog",
		"",
		`- Articles are published at ${toAbsoluteUrl(data.brand.url, "/blogs/")}`,
		`- A machine-readable feed of every published article, with titles, links and dates, is at ${toAbsoluteUrl(data.brand.url, "/rss.xml")}`,
		`- A complete URL list including every article is at ${toAbsoluteUrl(data.brand.url, "/sitemap-blog.xml")}`,
		"",
		"## Notes",
		"",
		"- Content is published in English (en-NG).",
		`- Machine-readable Schema.org data (Organization, LocalBusiness, Service, Article, FAQPage, BreadcrumbList) is embedded as JSON-LD in every page of ${data.brand.url}.`,
		`- A full URL list is available at ${toAbsoluteUrl(data.brand.url, "/sitemap-index.xml")}`,
		"",
	];

	return new Response(lines.join("\n"), {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
}
