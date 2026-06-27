import type { FAQ } from "../types/faqs";
import type { PageMetadata } from "../types/base-layout";
import type { SeoLandingPage, ThemeConfig } from "../types/theme";

type BreadcrumbItem = {
	name: string;
	path: string;
};

type PageSeoPayload = {
	metadata: PageMetadata;
	structuredData: Record<string, any>[];
	sameAsUrls: string[];
};

function ensureAbsoluteExternalUrl(value: string) {
	return /^https?:\/\//i.test(value) ? value : `https://${value.replace(/^\/+/, "")}`;
}

function getAreaType(name: string) {
	return name.trim().toLowerCase() === "nigeria" ? "Country" : "City";
}

export function trimTrailingSlash(value: string) {
	return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function toAbsoluteUrl(siteUrl: string, path = "/") {
	return new URL(path, `${trimTrailingSlash(siteUrl)}/`).toString();
}

function getSiteName(data: ThemeConfig) {
	return data.seo?.siteName || data.brand.businessName;
}

function getLocale(data: ThemeConfig) {
	return data.seo?.siteLocale || "en_NG";
}

function getOgImage(data: ThemeConfig) {
	const image = data.seo?.defaultOgImage || data.imagery?.heroImage || data.brand.logoImage;
	return toAbsoluteUrl(data.brand.url, image);
}

function getOgImageAlt(data: ThemeConfig) {
	return data.seo?.ogImageAlt || `${getSiteName(data)} logo`;
}

function getTargetKeywords(data: ThemeConfig) {
	return data.seo?.targetKeywords?.length ? data.seo.targetKeywords : data.brand.keywords;
}

function getBreadcrumbSchema(siteUrl: string, items: BreadcrumbItem[]) {
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.name,
			item: toAbsoluteUrl(siteUrl, item.path),
		})),
	};
}

function getFaqSchema(faqs: FAQ[] | undefined) {
	if (!Array.isArray(faqs) || faqs.length === 0) {
		return null;
	}

	return {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: faqs.map((faq) => ({
			"@type": "Question",
			name: faq.question,
			acceptedAnswer: {
				"@type": "Answer",
				text: faq.answer,
			},
		})),
	};
}

function getBaseSchemas(data: ThemeConfig) {
	const siteUrl = data.brand.url;
	const homepageUrl = toAbsoluteUrl(siteUrl, "/");
	const sameAsUrls = [...(data.socialMedia?.map((item) => item.url) ?? [])];

	if (data.googleBusinessProfileLink) {
		sameAsUrls.push(ensureAbsoluteExternalUrl(data.googleBusinessProfileLink));
	}

	const serviceAreas =
		data.seo?.serviceAreas?.map((name) => ({
			"@type": getAreaType(name),
			name,
		})) || [];

	const organizationSchema = {
		"@context": "https://schema.org",
		"@type": "Organization",
		"@id": `${homepageUrl}#organization`,
		name: data.brand.businessName,
		url: homepageUrl,
		logo: toAbsoluteUrl(siteUrl, data.brand.logoImage),
		sameAs: sameAsUrls,
		contactPoint: {
			"@type": "ContactPoint",
			telephone: data.contact.phone,
			contactType: "customer support",
			email: data.contact.email,
			areaServed: data.contact.addressCountry,
			availableLanguage: ["en"],
		},
	};

	const localBusinessSchema = {
		"@context": "https://schema.org",
		"@type": "LocalBusiness",
		"@id": `${homepageUrl}#localbusiness`,
		name: data.brand.businessName,
		description: data.brand.description,
		url: homepageUrl,
		logo: toAbsoluteUrl(siteUrl, data.brand.logoImage),
		image: getOgImage(data),
		telephone: data.contact.phone,
		email: data.contact.email,
		address: {
			"@type": "PostalAddress",
			streetAddress: data.contact.address,
			addressLocality: data.contact.addressLocality,
			addressRegion: data.contact.addressRegion,
			addressCountry: data.contact.addressCountry,
		},
		...(data.contact.geoData?.latitude &&
			data.contact.geoData?.longitude && {
				geo: {
					"@type": "GeoCoordinates",
					latitude: data.contact.geoData.latitude,
					longitude: data.contact.geoData.longitude,
				},
			}),
		sameAs: sameAsUrls,
		areaServed: serviceAreas.length
			? serviceAreas
			: [
					{
						"@type": "Country",
						name: "Nigeria",
					},
				],
		priceRange: "₦₦",
		openingHours: "Mo-Su 08:00-20:00",
	};

	const websiteSchema = {
		"@context": "https://schema.org",
		"@type": "WebSite",
		"@id": `${homepageUrl}#website`,
		name: getSiteName(data),
		alternateName: data.brand.businessName,
		url: homepageUrl,
		description: data.brand.description,
		inLanguage: "en-NG",
	};

	return {
		sameAsUrls,
		organizationSchema,
		localBusinessSchema,
		websiteSchema,
	};
}

export function getHomePageSeo(data: ThemeConfig): PageSeoPayload {
	const base = getBaseSchemas(data);
	const homepageUrl = toAbsoluteUrl(data.brand.url, "/");
	const testimonials = data.content?.testimonialsSection?.testimonials ?? [];
	const faqSchema = getFaqSchema(data.content?.faqsSection?.faqs);

	const ratingSchema =
		testimonials.length > 0
			? {
					"@context": "https://schema.org",
					"@type": "AggregateRating",
					ratingValue: (
						testimonials.reduce((sum, item) => sum + (item.rating || 0), 0) /
						testimonials.length
					).toFixed(1),
					reviewCount: testimonials.length,
					itemReviewed: {
						"@id": `${homepageUrl}#localbusiness`,
					},
				}
			: null;

	const webPageSchema = {
		"@context": "https://schema.org",
		"@type": "WebPage",
		"@id": `${homepageUrl}#webpage`,
		name: data.seo?.pageTitle || data.brand.title,
		url: homepageUrl,
		description: data.seo?.metaDescription || data.brand.description,
		isPartOf: {
			"@id": `${homepageUrl}#website`,
		},
		about: {
			"@id": `${homepageUrl}#organization`,
		},
		primaryImageOfPage: getOgImage(data),
		inLanguage: "en-NG",
	};

	const metadata: PageMetadata = {
		title: data.seo?.pageTitle || data.brand.title,
		description: data.seo?.metaDescription || data.brand.description,
		canonicalUrl: homepageUrl,
		keywords: getTargetKeywords(data),
		siteName: getSiteName(data),
		ogImage: getOgImage(data),
		ogImageAlt: getOgImageAlt(data),
		locale: getLocale(data),
		twitterHandle: data.seo?.twitterHandle,
		type: "website",
		robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
	};

	return {
		metadata,
		sameAsUrls: base.sameAsUrls,
		structuredData: [
			base.websiteSchema,
			base.organizationSchema,
			base.localBusinessSchema,
			webPageSchema,
			getBreadcrumbSchema(data.brand.url, [{ name: "Home", path: "/" }]),
			...(faqSchema ? [faqSchema] : []),
			...(ratingSchema ? [ratingSchema] : []),
		],
	};
}

export function getLandingPageSeo(
	data: ThemeConfig,
	page: SeoLandingPage,
): PageSeoPayload {
	const base = getBaseSchemas(data);
	const homepageUrl = toAbsoluteUrl(data.brand.url, "/");
	const pageUrl = toAbsoluteUrl(data.brand.url, `/${page.slug}/`);
	const faqSchema = getFaqSchema(page.faqs);

	const webPageSchema = {
		"@context": "https://schema.org",
		"@type": "WebPage",
		"@id": `${pageUrl}#webpage`,
		name: page.pageTitle,
		url: pageUrl,
		description: page.metaDescription,
		isPartOf: {
			"@id": `${homepageUrl}#website`,
		},
		about: {
			"@id": `${homepageUrl}#organization`,
		},
		inLanguage: "en-NG",
	};

	const serviceSchema = {
		"@context": "https://schema.org",
		"@type": "Service",
		"@id": `${pageUrl}#service`,
		name: page.serviceType,
		description: page.metaDescription,
		serviceType: page.serviceType,
		areaServed: {
			"@type": getAreaType(page.location),
			name: page.location,
		},
		provider: {
			"@id": `${homepageUrl}#organization`,
		},
		url: pageUrl,
		offers: {
			"@type": "Offer",
			availability: "https://schema.org/InStock",
			priceSpecification: {
				"@type": "PriceSpecification",
				priceCurrency: "NGN",
				price: "0",
				description: "Contact for a quote",
			},
		},
	};

	const metadata: PageMetadata = {
		title: page.pageTitle,
		description: page.metaDescription,
		canonicalUrl: pageUrl,
		keywords: [
			page.primaryKeyword,
			...(page.secondaryKeywords || []),
			...getTargetKeywords(data),
		],
		siteName: getSiteName(data),
		ogImage: getOgImage(data),
		ogImageAlt: getOgImageAlt(data),
		locale: getLocale(data),
		twitterHandle: data.seo?.twitterHandle,
		type: "website",
		robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
	};

	return {
		metadata,
		sameAsUrls: base.sameAsUrls,
		structuredData: [
			base.websiteSchema,
			base.organizationSchema,
			base.localBusinessSchema,
			webPageSchema,
			serviceSchema,
			getBreadcrumbSchema(data.brand.url, [
				{ name: "Home", path: "/" },
				{ name: page.headline, path: `/${page.slug}/` },
			]),
			...(faqSchema ? [faqSchema] : []),
		],
	};
}
