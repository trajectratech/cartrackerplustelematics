import type { BusinessKeyEnum } from "../enums/business-key";
import type { SectionKeyEnum } from "../enums/section-key";
import type { SocialKeyEnum } from "../enums/social-key";
import type { FAQ } from "./faqs";
import type { FAQsSection } from "./faqs";
import type { Product } from "./product";

export type SectionKey = `${SectionKeyEnum}`;
export type SocialKey = `${SocialKeyEnum}`;
export type BusinessKey = `${BusinessKeyEnum}`;

export interface SeoLandingPageImage {
	src: string;
	alt: string;
	width: number;
	height: number;
	caption?: string;
}

export interface SeoLandingPageSection {
	title: string;
	paragraphs?: string[];
	bullets?: string[];
}

export interface SeoLandingPageFeatureGroup {
	title: string;
	items: string[];
}

export interface SeoLandingPagePackage {
	name: string;
	price?: string;
	summary?: string;
	features: string[];
	idealFor?: string[];
}

export interface SeoLandingPageCallout {
	title: string;
	description: string;
}

export interface SeoLandingPageCalloutGroup {
	title: string;
	intro?: string;
	items: SeoLandingPageCallout[];
	tone?: "default" | "accent";
}

export interface SeoLandingPage {
	slug: string;
	pageTitle: string;
	metaDescription: string;
	headline: string;
	intro: string;
	serviceType: string;
	location: string;
	primaryKeyword: string;
	secondaryKeywords?: string[];
	benefits: string[];
	faqs?: FAQ[];
	pageCategory?: "location" | "service";
	cardTitle?: string;
	cardDescription?: string;
	eyebrow?: string;
	ogImage?: string;
	ogImageAlt?: string;
	ogImageWidth?: number;
	ogImageHeight?: number;
	images?: SeoLandingPageImage[];
	sections?: SeoLandingPageSection[];
	featureGroups?: SeoLandingPageFeatureGroup[];
	packages?: SeoLandingPagePackage[];
	processSteps?: string[];
	audiences?: string[];
	relatedSlugs?: string[];
	quoteLabel?: string;
	calloutGroups?: SeoLandingPageCalloutGroup[];
	bestPractices?: { title: string; intro?: string; items: string[] };
	relatedServiceNames?: { title: string; intro?: string; items: string[] };
	closing?: { title: string; paragraphs: string[] };
}

export interface ThemeConfig {
	brand: {
		title: string;
		businessName: string;
		tagline: string;
		description: string;
		logoImage: string;
		url: string;
		keywords: string[];
		publicDirectory: string;
	};
	colors: {
		primary: string;
		secondary: string;
		accent: string;
		background: string;
		text: string;
		heading: string;
		link: string;
		hover: string;
		active: string;
		error: string;
		success: string;
		muted: string;
	};
	typography: {
		fontFamily: string;
		fontSizes: {
			h1: string;
			h2: string;
			h3: string;
			paragraph: string;
			caption: string;
		};
		fontStyles: {
			bold: string;
			italic: string;
			underline: string;
		};
		fontWeights: {
			light: number;
			regular: number;
			medium: number;
			bold: number;
			black: number;
		};
	};
	imagery: {
		backgroundImage?: string;
		heroImage?: string;
		heroTextColor?: string;
		logoImage: string;
		galleryTitle?: string;
		gallery?: { imageUrl: string; alt?: string; caption?: string }[];
	};
	logo?: {
		dimensions: {
			width: number;
			height: number;
		};
		padding: number;
		margin: number;
	};

	socialMedia: {
		name: SocialKey;
		url: string;
	}[];
	googleBusinessProfileLink?: string;
	content: {
		heroSection: {
			heading: string;
			paragraph: string;
			ctaText: string;
			ctaUrl: string;
		};
		aboutSection: {
			heading: string;
			paragraph: string;
			imageUrl?: string;
		};
		servicesSection: {
			heading: string;
			paragraph: string;
			listItems: { title: string; description?: string }[];
		};
		searchGuideSection?: {
			heading: string;
			paragraph?: string;
			items: {
				title: string;
				description: string;
				href: string;
				keyword?: string;
			}[];
		};
		testimonialsSection?: {
			heading: string;
			testimonials: {
				name: string;
				position: string;
				comment: string;
				rating: number;
				avatarUrl?: string;
			}[];
		};
		productsSection?: {
			heading: string;
			products: Product[];
		};
		faqsSection: FAQsSection;
		howItWorksSection?: {
			heading: string;
			steps?: {
				title: string;
				description: string;
				iconUrl?: string;
			}[];
			url?: string;
			urlText?: string;
		};

		ctaSection?: {
			heading: string;
			subheading?: string;
			ctaText: string;
			ctaUrl: string;
			backgroundImage?: string;
			backgroundColor?: string;
		};

		targetAudienceSection?: {
			heading: string;
			audienceList: {
				title: string;
				iconUrl?: string;
			}[];
		};

		demoShowcaseSection?: {
			heading: string;
			demos: {
				title: string;
				url: string;
				screenshotUrl?: string;
				description?: string;
			}[];
		};

		trustSection?: {
			heading: string;
			trustBadges?: string[];
			guarantees?: string[];
			stats?: {
				label: string;
				value: string;
			}[];
		};
		promoBanner?: {
			message: string;
			ctaText: string;
			ctaUrl: string;
			expiresAt?: string;
			enableCountdown?: boolean;
		};

		liveMetrics?: {
			showVisitorCount?: boolean;
			showCustomerCount?: boolean;
			lastUpdatedText?: string;
		};
	};
	pricing?: {
		plan: string;
		price?: string;
		showPricing?: boolean;
		description?: string;
		features: string[];
	}[];

	map?: {
		embedUrl: string;
	};
	contact: {
		email: string;
		phone: string;
		whatsapp: string;
		address: string;
		addressLocality: string;
		addressRegion: string;
		addressCountry: string;
		geoData?: {
			latitude: number;
			longitude: number;
		};
	};
	layout: {
		sectionOrder: SectionKey[];
		sectionPadding: number;
		containerWidth: number;
		containerPadding: number;
	};
	interactions?: {
		animationStyles: {
			[key: string]: string;
		};
		transitionEffects: {
			[key: string]: string;
		};
	};
	components?: {
		buttonStyles: {
			backgroundColor: string;
			textColor: string;
			padding: number;
			borderRadius: number;
		};
		formStyles: {
			inputFieldStyles: {
				padding: number;
				border: string;
				borderRadius: number;
			};
		};
	};
	responsiveness?: {
		breakpoints: {
			desktop: number;
			tablet: number;
			mobile: number;
		};
	};
	settings: {
		darkMode?: boolean;
		showBooking?: boolean;
		showPricing?: boolean;
		isSeller?: boolean;
	};
	booking?: {
		enabled: boolean;
		bookingUrl?: string;
		bookingInstructions?: string;
	};

	ecommerce?: {
		currency: string;
		allowCart?: boolean;
		paymentProviders?: string[];
	};
	seo?: {
		siteName?: string;
		siteAlternateName?: string;
		siteLocale?: string;
		siteCategory?: string;
		defaultOgImage?: string;
		defaultOgImageWidth?: number;
		defaultOgImageHeight?: number;
		ogImageAlt?: string;
		twitterHandle?: string;
		manifest?: {
			name?: string;
			shortName?: string;
			backgroundColor?: string;
			themeColor?: string;
			display?: "standalone" | "minimal-ui" | "browser" | "fullscreen";
		};
		aiSummary?: string[];
		serviceAreas?: string[];
		targetKeywords?: string[];
		landingPages?: SeoLandingPage[];
		pageTitle?: string;
		metaDescription?: string;
		structuredData?: {
			type: BusinessKey;
			schemaJson: any;
		};
	};

	poweredBy: {
		title: string;
		url: string;
		shouldShow: boolean;
	};
}
