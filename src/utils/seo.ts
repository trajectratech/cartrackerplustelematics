import type { FAQ } from "../types/faqs";
import type { PageMetadata } from "../types/base-layout";
import type { SeoLandingPage, ThemeConfig } from "../types/theme";

export type BreadcrumbItem = {
	name: string;
	path: string;
};

type PageSeoPayload = {
	metadata: PageMetadata;
	structuredData: Record<string, any>[];
	breadcrumbs: BreadcrumbItem[];
};

const IMAGE_MIME_TYPES: Record<string, string> = {
	avif: "image/avif",
	gif: "image/gif",
	jpeg: "image/jpeg",
	jpg: "image/jpeg",
	png: "image/png",
	svg: "image/svg+xml",
	webp: "image/webp",
};

function getImageMimeType(path: string) {
	const extension = path.split("?")[0].split(".").pop()?.toLowerCase();
	return extension ? IMAGE_MIME_TYPES[extension] : undefined;
}

function getAreaType(name: string) {
	return name.trim().toLowerCase() === "nigeria" ? "Country" : "City";
}

function trimTrailingSlash(value: string) {
	return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function toAbsoluteUrl(siteUrl: string, path = "/") {
	return new URL(path, `${trimTrailingSlash(siteUrl)}/`).toString();
}

function getSiteName(data: ThemeConfig) {
	return data.seo?.siteName || data.brand.businessName;
}

function getSiteAlternateName(data: ThemeConfig): string | undefined {
	const alternateName = data.seo?.siteAlternateName?.trim();
	if (!alternateName) return undefined;
	return alternateName.toLowerCase() === getSiteName(data).trim().toLowerCase()
		? undefined
		: alternateName;
}

function getLocale(data: ThemeConfig) {
	return data.seo?.siteLocale || "en_NG";
}

function getDefaultOgImagePath(data: ThemeConfig) {
	return data.seo?.defaultOgImage || data.imagery?.heroImage || data.brand.logoImage;
}

function getOgImage(data: ThemeConfig) {
	return toAbsoluteUrl(data.brand.url, getDefaultOgImagePath(data));
}

function getOgImageAlt(data: ThemeConfig) {
	return data.seo?.ogImageAlt || `${getSiteName(data)} logo`;
}

function getOgImageMeta(data: ThemeConfig) {
	const path = getDefaultOgImagePath(data);
	return {
		ogImage: toAbsoluteUrl(data.brand.url, path),
		ogImageAlt: getOgImageAlt(data),
		ogImageWidth: data.seo?.defaultOgImageWidth ?? 1200,
		ogImageHeight: data.seo?.defaultOgImageHeight ?? 630,
		ogImageType: getImageMimeType(path),
	};
}

function getLandingPageOgImageMeta(data: ThemeConfig, page: SeoLandingPage) {
	const leadImage = page.images?.[0];
	const path = page.ogImage || getDefaultOgImagePath(data);
	const usesPageImage = Boolean(page.ogImage);
	const matchesLeadImage = usesPageImage && leadImage?.src === page.ogImage;

	return {
		ogImage: toAbsoluteUrl(data.brand.url, path),
		ogImageAlt: page.ogImageAlt || getOgImageAlt(data),
		ogImageWidth:
			(matchesLeadImage
				? leadImage?.width
				: usesPageImage
					? page.ogImageWidth
					: data.seo?.defaultOgImageWidth) ?? 1200,
		ogImageHeight:
			(matchesLeadImage
				? leadImage?.height
				: usesPageImage
					? page.ogImageHeight
					: data.seo?.defaultOgImageHeight) ?? 630,
		ogImageType: getImageMimeType(path),
	};
}

function getTargetKeywords(data: ThemeConfig) {
	return data.seo?.targetKeywords?.length ? data.seo.targetKeywords : data.brand.keywords;
}

function getBreadcrumbSchema(siteUrl: string, pageUrl: string, items: BreadcrumbItem[]) {
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		"@id": `${pageUrl}#breadcrumb`,
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
		sameAsUrls.push(data.googleBusinessProfileLink);
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
		areaServed: { "@type": "Country", name: "Nigeria" },
		serviceArea: serviceAreas.length
			? serviceAreas
			: [{ "@type": "Country", name: "Nigeria" }],
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
		openingHoursSpecification: [
			{
				"@type": "OpeningHoursSpecification",
				dayOfWeek: [
					"Monday",
					"Tuesday",
					"Wednesday",
					"Thursday",
					"Friday",
					"Saturday",
					"Sunday",
				],
				opens: "08:00",
				closes: "20:00",
			},
		],
		...(data.googleBusinessProfileLink
			? { hasMap: data.googleBusinessProfileLink }
			: {}),
	};

	const siteAlternateName = getSiteAlternateName(data);

	const websiteSchema = {
		"@context": "https://schema.org",
		"@type": "WebSite",
		"@id": `${homepageUrl}#website`,
		name: getSiteName(data),
		...(siteAlternateName ? { alternateName: siteAlternateName } : {}),
		url: homepageUrl,
		description: data.brand.description,
		inLanguage: "en-NG",
		publisher: { "@id": `${homepageUrl}#organization` },
		image: getOgImage(data),
		potentialAction: [
			{
				"@type": "SearchAction",
				target: {
					"@type": "EntryPoint",
					urlTemplate: `${homepageUrl}?s={search_term_string}`,
				},
				"query-input": "required name=search_term_string",
			},
		],
	};

	const offerCatalogSchema = {
		"@context": "https://schema.org",
		"@type": "OfferCatalog",
		name: `${data.brand.businessName} services`,
		itemListElement:
			data.content.servicesSection?.listItems?.map((service) => ({
				"@type": "Offer",
				itemOffered: {
					"@type": "Service",
					name: service.title,
					description: service.description,
					provider: {
						"@id": `${homepageUrl}#organization`,
					},
					areaServed: serviceAreas.length
						? serviceAreas
						: [
								{
									"@type": "Country",
									name: "Nigeria",
								},
							],
				},
			})) || [],
	};

	return {
		sameAsUrls,
		organizationSchema,
		localBusinessSchema,
		websiteSchema,
		offerCatalogSchema,
	};
}

export function getHomePageSeo(data: ThemeConfig): PageSeoPayload & { sameAsUrls: string[] } {
	const base = getBaseSchemas(data);
	const homepageUrl = toAbsoluteUrl(data.brand.url, "/");
	const faqSchema = getFaqSchema(data.content?.faqsSection?.faqs);

	const breadcrumbs: BreadcrumbItem[] = [{ name: "Home", path: "/" }];

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
		breadcrumb: {
			"@id": `${homepageUrl}#breadcrumb`,
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
		...getOgImageMeta(data),
		locale: getLocale(data),
		twitterHandle: data.seo?.twitterHandle,
		type: "website",
		robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
	};

	return {
		metadata,
		breadcrumbs,
		sameAsUrls: base.sameAsUrls,
		structuredData: [
			base.websiteSchema,
			base.organizationSchema,
			base.localBusinessSchema,
			base.offerCatalogSchema,
			webPageSchema,
			getBreadcrumbSchema(data.brand.url, homepageUrl, breadcrumbs),
			...(faqSchema ? [faqSchema] : []),
		],
	};
}

export function getLandingPageSeo(
	data: ThemeConfig,
	page: SeoLandingPage,
): PageSeoPayload & { sameAsUrls: string[] } {
	const base = getBaseSchemas(data);
	const homepageUrl = toAbsoluteUrl(data.brand.url, "/");
	const pageUrl = toAbsoluteUrl(data.brand.url, `/${page.slug}/`);
	const faqSchema = getFaqSchema(page.faqs);
	const imageMeta = getLandingPageOgImageMeta(data, page);
	const breadcrumbs: BreadcrumbItem[] = [
		{ name: "Home", path: "/" },
		{ name: page.cardTitle || page.serviceType, path: `/${page.slug}/` },
	];

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
		mainEntity: {
			"@id": `${pageUrl}#service`,
		},
		breadcrumb: {
			"@id": `${pageUrl}#breadcrumb`,
		},
		primaryImageOfPage: imageMeta.ogImage,
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
		keywords: [page.primaryKeyword, ...(page.secondaryKeywords || []), ...getTargetKeywords(data)],
		siteName: getSiteName(data),
		...imageMeta,
		locale: getLocale(data),
		twitterHandle: data.seo?.twitterHandle,
		type: "website",
		robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
	};

	return {
		metadata,
		breadcrumbs,
		sameAsUrls: base.sameAsUrls,
		structuredData: [
			base.organizationSchema,
			base.localBusinessSchema,
			webPageSchema,
			serviceSchema,
			getBreadcrumbSchema(data.brand.url, pageUrl, breadcrumbs),
			...(faqSchema ? [faqSchema] : []),
		],
	};
}

export function getBlogIndexSeo(
	data: ThemeConfig,
	options: { page?: number; totalPages?: number } = {},
): PageSeoPayload & { sameAsUrls: string[] } {
	const base = getBaseSchemas(data);
	const homepageUrl = toAbsoluteUrl(data.brand.url, "/");
	const page = options.page ?? 1;
	const pageUrl =
		page > 1
			? toAbsoluteUrl(data.brand.url, `/blogs/page/${page}/`)
			: toAbsoluteUrl(data.brand.url, "/blogs/");

	const breadcrumbs: BreadcrumbItem[] = [
		{ name: "Home", path: "/" },
		{ name: "Blog", path: "/blogs/" },
	];

	const title =
		page > 1
			? `Blog (page ${page}) | ${getSiteName(data)}`
			: `Blog | ${getSiteName(data)}`;

	const metadata: PageMetadata = {
		title,
		description:
			"Practical guides on premium vehicle tracking, fleet telematics, dashcam systems, fuel monitoring, executive security and vehicle tracking in Nigeria.",
		canonicalUrl: pageUrl,
		keywords: [
			"vehicle tracking blog",
			"fleet telematics guides",
			"gps tracking nigeria",
			...getTargetKeywords(data),
		],
		siteName: getSiteName(data),
		...getOgImageMeta(data),
		locale: getLocale(data),
		twitterHandle: data.seo?.twitterHandle,
		type: "website",
		robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
	};

	const blogSchema = {
		"@context": "https://schema.org",
		"@type": "Blog",
		"@id": `${toAbsoluteUrl(data.brand.url, "/blogs/")}#blog`,
		name: `${getSiteName(data)} blog`,
		url: toAbsoluteUrl(data.brand.url, "/blogs/"),
		description: metadata.description,
		isPartOf: { "@id": `${homepageUrl}#website` },
		publisher: { "@id": `${homepageUrl}#organization` },
		inLanguage: "en-NG",
	};

	return {
		metadata,
		breadcrumbs,
		sameAsUrls: base.sameAsUrls,
		structuredData: [
			base.organizationSchema,
			base.localBusinessSchema,
			blogSchema,
			getBreadcrumbSchema(data.brand.url, pageUrl, breadcrumbs),
		],
	};
}

export type BlogPostSeoInput = {
	slug: string;
	title: string;
	excerpt: string;
	metaTitle?: string | null;
	metaDescription?: string | null;
	publishedAt: string;
	updatedAt: string;
	authorName: string;
	categoryName?: string | null;
	tagNames?: string[];
	imageUrl?: string | null;
	imageAlt?: string | null;
	imageWidth?: number | null;
	imageHeight?: number | null;
	readingMinutes: number;
	commentCount?: number;
};

export function getBlogPostSeo(
	data: ThemeConfig,
	post: BlogPostSeoInput,
): PageSeoPayload & { sameAsUrls: string[] } {
	const base = getBaseSchemas(data);
	const homepageUrl = toAbsoluteUrl(data.brand.url, "/");
	const blogUrl = toAbsoluteUrl(data.brand.url, "/blogs/");
	const pageUrl = toAbsoluteUrl(data.brand.url, `/blogs/${post.slug}/`);
	const imageUrl = post.imageUrl || getOgImage(data);

	const breadcrumbs: BreadcrumbItem[] = [
		{ name: "Home", path: "/" },
		{ name: "Blog", path: "/blogs/" },
		{ name: post.title, path: `/blogs/${post.slug}/` },
	];

	const description = post.metaDescription || post.excerpt;

	const metadata: PageMetadata = {
		title: post.metaTitle || post.title,
		description,
		canonicalUrl: pageUrl,
		keywords: [...(post.tagNames ?? []), ...getTargetKeywords(data)],
		siteName: getSiteName(data),
		ogImage: imageUrl,
		ogImageAlt: post.imageAlt || post.title,
		ogImageWidth: post.imageWidth ?? undefined,
		ogImageHeight: post.imageHeight ?? undefined,
		ogImageType: getImageMimeType(imageUrl),
		locale: getLocale(data),
		twitterHandle: data.seo?.twitterHandle,
		type: "article",
		robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
		publishedTime: post.publishedAt,
		modifiedTime: post.updatedAt,
		articleAuthor: post.authorName,
		articleSection: post.categoryName ?? undefined,
		articleTags: post.tagNames,
	};

	const postingSchema: Record<string, any> = {
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		"@id": `${pageUrl}#article`,
		headline: post.title,
		description,
		url: pageUrl,
		datePublished: post.publishedAt,
		dateModified: post.updatedAt,
		author: { "@type": "Organization", name: post.authorName },
		publisher: { "@id": `${homepageUrl}#organization` },
		mainEntityOfPage: { "@id": `${pageUrl}#webpage` },
		isPartOf: { "@id": `${blogUrl}#blog` },
		about: { "@id": `${homepageUrl}#organization` },
		image: {
			"@type": "ImageObject",
			url: imageUrl,
			...(post.imageWidth ? { width: post.imageWidth } : {}),
			...(post.imageHeight ? { height: post.imageHeight } : {}),
		},
		timeRequired: `PT${Math.max(1, post.readingMinutes)}M`,
		inLanguage: "en-NG",
		...(post.categoryName ? { articleSection: post.categoryName } : {}),
		...(post.tagNames?.length ? { keywords: post.tagNames.join(", ") } : {}),
		...(post.commentCount
			? {
					commentCount: post.commentCount,
					interactionStatistic: {
						"@type": "InteractionCounter",
						interactionType: "https://schema.org/CommentAction",
						userInteractionCount: post.commentCount,
					},
				}
			: {}),
	};

	const webPageSchema = {
		"@context": "https://schema.org",
		"@type": "WebPage",
		"@id": `${pageUrl}#webpage`,
		name: post.metaTitle || post.title,
		url: pageUrl,
		description,
		isPartOf: { "@id": `${homepageUrl}#website` },
		about: { "@id": `${homepageUrl}#organization` },
		mainEntity: { "@id": `${pageUrl}#article` },
		breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
		primaryImageOfPage: imageUrl,
		inLanguage: "en-NG",
	};

	return {
		metadata,
		breadcrumbs,
		sameAsUrls: base.sameAsUrls,
		structuredData: [
			base.organizationSchema,
			base.localBusinessSchema,
			webPageSchema,
			postingSchema,
			getBreadcrumbSchema(data.brand.url, pageUrl, breadcrumbs),
		],
	};
}

export function getNotFoundSeo(data: ThemeConfig): PageSeoPayload {
	const homepageUrl = toAbsoluteUrl(data.brand.url, "/");
	const pageUrl = toAbsoluteUrl(data.brand.url, "/404/");

	return {
		metadata: {
			title: `Page not found | ${getSiteName(data)}`,
			description:
				"The page you requested could not be found. Browse premium vehicle tracking, fleet telematics, dashcam systems, fuel monitoring, and executive vehicle security services instead.",
			canonicalUrl: pageUrl,
			keywords: getTargetKeywords(data),
			siteName: getSiteName(data),
			...getOgImageMeta(data),
			locale: getLocale(data),
			twitterHandle: data.seo?.twitterHandle,
			type: "website",
			robots: "noindex, follow",
		},
		breadcrumbs: [],
		structuredData: [
			{
				"@context": "https://schema.org",
				"@type": "WebPage",
				name: `Page not found | ${getSiteName(data)}`,
				url: pageUrl,
				isPartOf: { "@id": `${homepageUrl}#website` },
				inLanguage: "en-NG",
			},
		],
	};
}
