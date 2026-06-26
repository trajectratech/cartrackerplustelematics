import type { SectionKey, ThemeConfig } from "./theme";

export type PageMetadata = {
	title: string;
	description: string;
	canonicalUrl: string;
	keywords: string[];
	siteName: string;
	ogImage: string;
	ogImageAlt: string;
	locale: string;
	twitterHandle?: string;
	type: "website" | "article";
	robots: string;
};

export type BaseLayoutProps = {
	data: ThemeConfig;
	layout: SectionKey[];
	colorVars: Record<
		| "--color-primary"
		| "--color-secondary"
		| "--color-accent"
		| "--color-background"
		| "--color-text"
		| "--color-heading"
		| "--color-link"
		| "--color-hover"
		| "--color-active"
		| "--color-error"
		| "--color-success"
		| "--color-muted",
		string
	>;
	metadata?: PageMetadata;
	structuredData: Record<string, any> | Record<string, any>[];
	webPageSchema?: {
		"@context": "https://schema.org";
		"@type": "WebPage";
		name: string;
		url: string;
		description: string;
	};
	breadcrumbSchema?: {
		"@context": "https://schema.org";
		"@type": "BreadcrumbList";
		itemListElement: Array<{
			"@type": "ListItem";
			position: number;
			name: string;
			item: string;
		}>;
	};
	ratingSchema?: {
		"@context": "https://schema.org";
		"@type": "AggregateRating";
		ratingValue: string;
		reviewCount: number;
		itemReviewed: {
			"@type": "LocalBusiness";
			name: string;
		};
	} | null;
	organizationSchema?: {
		"@context": "https://schema.org";
		"@type": "Organization";
		name: string;
		url: string;
		logo: string;
		sameAs: string[];
	};
	faqsSchema?: {
		"@context": "https://schema.org";
		"@type": "FAQPage";
		mainEntity: {
			"@type": "Question";
			name: string;
			acceptedAnswer: {
				"@type": "Answer";
				text: string;
			};
		}[];
	} | null;
	sameAsUrls?: string[];
};

export type LegacyBaseLayoutProps = {
	structuredData: {
		"@context": "https://schema.org";
		"@type": "LocalBusiness";
		name: string;
		description: string;
		"@id": string;
		url: string;
		logo: string;
		image: string;
		telephone: string;
		address: {
			"@type": "PostalAddress";
			streetAddress: string;
			addressLocality: string;
			addressRegion: string;
			addressCountry: string;
		};
		contactPoint: {
			"@type": "ContactPoint";
			telephone: string;
			contactType: string;
			email: string;
		};
		geo?: {
			"@type": "GeoCoordinates";
			latitude: number;
			longitude: number;
		};
		areaServed: {
			"@type": "Place";
			address: {
				"@type": "PostalAddress";
				addressRegion: string;
				addressCountry: string;
			};
		};
		sameAs: string[];
		priceRange: string;
		openingHours: string;
	};
	webPageSchema: {
		"@context": "https://schema.org";
		"@type": "WebPage";
		name: string;
		url: string;
		description: string;
	};
	breadcrumbSchema: {
		"@context": "https://schema.org";
		"@type": "BreadcrumbList";
		itemListElement: Array<{
			"@type": "ListItem";
			position: number;
			name: string;
			item: string;
		}>;
	};
	ratingSchema: {
		"@context": "https://schema.org";
		"@type": "AggregateRating";
		ratingValue: string;
		reviewCount: number;
		itemReviewed: {
			"@type": "LocalBusiness";
			name: string;
		};
	} | null;
	organizationSchema: {
		"@context": "https://schema.org";
		"@type": "Organization";
		name: string;
		url: string;
		logo: string;
		sameAs: string[];
	};
	faqsSchema: {
		"@context": "https://schema.org";
		"@type": "FAQPage";
		mainEntity: {
			"@type": "Question";
			name: string;
			acceptedAnswer: {
				"@type": "Answer";
				text: string;
			};
		}[];
	};
	sameAsUrls: string[];
};
