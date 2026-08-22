import { seoPages } from "../data/seo-pages";
import type { SeoLandingPage, ThemeConfig } from "../types/theme";

export function getAllLandingPages(theme: ThemeConfig): SeoLandingPage[] {
	const merged = new Map<string, SeoLandingPage>();

	for (const page of theme.seo?.landingPages ?? []) {
		merged.set(page.slug, page);
	}

	for (const page of seoPages as unknown as SeoLandingPage[]) {
		merged.set(page.slug, page);
	}

	return [...merged.values()];
}

const FEATURED_SERVICE_SLUGS = [
	"car-tracker-nigeria",
	"fleet-management-nigeria",
	"dashcam-installation-nigeria",
	"fuel-monitoring-system-nigeria",
	"vehicle-tracking-abuja",
	"executive-vehicle-security-nigeria",
] as const;

export function getServiceLandingPages(theme: ThemeConfig): SeoLandingPage[] {
	const bySlug = new Map(getAllLandingPages(theme).map((page) => [page.slug, page]));
	return FEATURED_SERVICE_SLUGS.map((slug) => bySlug.get(slug)).filter(
		(page): page is SeoLandingPage => Boolean(page),
	);
}

export function getLocationLandingPages(theme: ThemeConfig): SeoLandingPage[] {
	return getAllLandingPages(theme).filter((page) => page.pageCategory === "location");
}

export function getLandingPageBySlug(theme: ThemeConfig, slug: string) {
	return getAllLandingPages(theme).find((page) => page.slug === slug);
}

export function getCoverageLandingPages(theme: ThemeConfig): SeoLandingPage[] {
	const featured = new Set<string>(FEATURED_SERVICE_SLUGS);
	return getAllLandingPages(theme).filter((page) => !featured.has(page.slug));
}
