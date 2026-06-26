import type { ThemeConfig } from "../types/theme";

export function getNavItemsFromTheme(theme: ThemeConfig) {
	const items = [];

	if (theme.content.aboutSection)
		items.push({ label: "About", href: "/#about" });
	if (theme.content.servicesSection.listItems?.length)
		items.push({ label: "Services", href: "/#services" });
	if (theme.content.howItWorksSection)
		items.push({ label: "How It Works", href: "/#how-it-works" });
	if (theme.pricing?.length) items.push({ label: "Pricing", href: "/#pricing" });
	if (theme.content.testimonialsSection?.testimonials?.length)
		items.push({ label: "Testimonials", href: "/#testimonials" });
	if (theme.seo?.landingPages?.length)
		items.push({
			label: "Search Guides",
			href: `/${theme.seo.landingPages[0].slug}/`,
		});
	if (theme.content.faqsSection?.faqs?.length)
		items.push({ label: "FAQs", href: "/#faqs" });
	if (theme.contact) items.push({ label: "Contact", href: "/#contact" });
	if (theme.content.heroSection.ctaText) {
		items.push({
			label: theme.content.heroSection.ctaText,
			href: theme.content.heroSection.ctaUrl,
			external: true,
		});
	}

	return items;
}
