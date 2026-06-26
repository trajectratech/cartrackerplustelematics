export type SeoPageConfig = {
	slug: string;
	pageTitle: string;
	metaDescription: string;
	searchLabel: string;
	heading: string;
	intro: string;
	supportingText: string;
	keywords: string[];
	highlights: string[];
	audience: string[];
	ctaText: string;
};

export const seoPages: SeoPageConfig[] = [
	{
		slug: "car-tracker-nigeria",
		pageTitle: "Car Tracker In Nigeria | Premium Tracking Installation And Support",
		metaDescription:
			"Looking for a car tracker in Nigeria? Car Tracker Plus Telematics provides premium tracking installation, live monitoring tools, immobilisation options, and responsive support.",
		searchLabel: "car tracker nigeria",
		heading: "Premium car tracker installation for drivers and businesses across Nigeria.",
		intro:
			"If you are searching for a dependable car tracker in Nigeria, this page gives you a clearer route to live tracking, vehicle protection, and cleaner after-sales support.",
		supportingText:
			"We support private vehicles, executive mobility, and commercial operations that need visibility, fast alerts, and a more professional installation experience.",
		keywords: ["car tracker nigeria", "gps car tracker nigeria", "vehicle tracking nigeria"],
		highlights: [
			"Live location visibility with route history",
			"Remote immobilisation options for eligible setups",
			"Clean installation with support after deployment"
		],
		audience: ["Private car owners", "Executives", "Business vehicle operators"],
		ctaText: "Enquire About Car Tracker Installation"
	},
	{
		slug: "vehicle-tracking-lagos",
		pageTitle: "Vehicle Tracking In Lagos | Real-Time Tracking And Security Support",
		metaDescription:
			"Need vehicle tracking in Lagos? Car Tracker Plus Telematics offers real-time tracking, security-focused installation, and support for private vehicles and fleets.",
		searchLabel: "vehicle tracking lagos",
		heading: "Vehicle tracking in Lagos for owners who need fast visibility and dependable support.",
		intro:
			"Lagos drivers and operators often need more than a basic tracker. This page focuses on vehicle tracking solutions designed for busy urban movement, faster responses, and stronger vehicle oversight.",
		supportingText:
			"We help clients in Lagos deploy tracking systems that support private security, logistics coordination, and everyday monitoring confidence.",
		keywords: ["vehicle tracking lagos", "car tracker lagos", "gps tracking lagos"],
		highlights: [
			"Real-time movement visibility for Lagos operations",
			"Alerts, route playback, and monitoring support",
			"Installation for private, executive, and fleet vehicles"
		],
		audience: ["Lagos car owners", "Dispatch teams", "School transport operators"],
		ctaText: "Book Vehicle Tracking In Lagos"
	},
	{
		slug: "fleet-management-nigeria",
		pageTitle: "Fleet Management In Nigeria | Telematics For Better Fleet Visibility",
		metaDescription:
			"Need fleet management in Nigeria? Car Tracker Plus Telematics provides tracking, telematics oversight, route visibility, and operational support for growing fleets.",
		searchLabel: "fleet management nigeria",
		heading: "Fleet management in Nigeria with better telematics visibility and cleaner operational control.",
		intro:
			"For companies running multiple vehicles, the goal is not only knowing where each unit is. It is also improving accountability, route awareness, and reporting quality.",
		supportingText:
			"Our fleet telematics offering helps logistics teams, service businesses, and institutions build stronger visibility across daily vehicle operations.",
		keywords: ["fleet management nigeria", "fleet telematics nigeria", "fleet tracking nigeria"],
		highlights: [
			"Multi-vehicle oversight from one platform",
			"Route and driver visibility for operations teams",
			"Support for growing fleets and structured deployments"
		],
		audience: ["Logistics companies", "Corporate fleets", "Institutional transport teams"],
		ctaText: "Request A Fleet Telematics Plan"
	},
	{
		slug: "dashcam-installation-nigeria",
		pageTitle: "Dashcam Installation In Nigeria | Premium Camera Deployment For Vehicles",
		metaDescription:
			"Looking for dashcam installation in Nigeria? Car Tracker Plus Telematics deploys premium dash camera systems for private cars, executive vehicles, and fleets.",
		searchLabel: "dashcam installation nigeria",
		heading: "Dashcam installation in Nigeria for drivers and fleets that need stronger incident visibility.",
		intro:
			"A quality dash camera system adds evidence, accountability, and peace of mind. This page is built for people searching for dashcam installation in Nigeria with a more premium deployment standard.",
		supportingText:
			"We install dash camera solutions for personal vehicles, executive protection use cases, school transport, and operational fleets.",
		keywords: ["dashcam installation nigeria", "dashboard camera nigeria", "vehicle dashcam nigeria"],
		highlights: [
			"Clean dash camera deployment for different vehicle types",
			"Useful for incident review and driver accountability",
			"Can be combined with tracking and telematics solutions"
		],
		audience: ["Private drivers", "Fleet managers", "Executive vehicle owners"],
		ctaText: "Enquire About Dashcam Installation"
	}
];
