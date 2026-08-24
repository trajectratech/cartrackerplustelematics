import { z } from "zod";

export const quoteServiceOptions = [
	"High-End Vehicle GPS Tracking",
	"Fleet Location Monitoring",
	"Fleet Operations Oversight",
	"Company Fleet Vehicle Tracking",
	"Luxury Vehicle Anti-Theft",
	"Complete Telematics Package",
	"Dashboard Camera Setup",
	"Fuel Usage Tracking",
	"School Bus & Staff Transport Monitoring",
	"Speed Restriction Device",
] as const;

export const vehicleTypeOptions = ["Sedan", "SUV", "Minibus", "Van", "Pickup Truck", "Heavy Truck"] as const;

export const vehicleCountOptions = [
	"Single Vehicle",
	"2 to 5",
	"6 to 10",
	"11 to 20",
	"21 to 50",
	"51 to 100",
	"Over 100",
] as const;

const selection = <T extends readonly string[]>(values: T, label: string) =>
	z
		.string()
		.trim()
		.refine((value) => values.includes(value as T[number]), `Please choose a valid ${label}.`);

const quoteSchema = z.object({
	fullName: z.string().trim().min(2, "Please provide your full name.").max(120, "Full name exceeds character limit."),
	phoneNumber: z
		.string()
		.trim()
		.min(7, "Please enter a working phone number.")
		.max(40, "Phone number exceeds character limit.")
		.regex(/^[0-9+().\-\s]+$/, "Please enter a properly formatted phone number."),
	emailAddress: z
		.string()
		.trim()
		.email("Please provide a valid email address.")
		.max(160, "Email address exceeds character limit."),
	companyName: z.string().trim().max(160, "Company name exceeds character limit.").optional().default(""),
	location: z.string().trim().min(2, "Please specify your state and city.").max(160, "Location exceeds character limit."),
	serviceRequired: selection(quoteServiceOptions, "service"),
	vehicleType: selection(vehicleTypeOptions, "vehicle category"),
	numberOfVehicles: selection(vehicleCountOptions, "fleet size bracket"),
	sourcePage: z.string().trim().max(240).optional().default("website"),
	website: z.string().trim().max(240).optional().default(""),
	formStartedAt: z.string().trim().optional().default(""),
	referralContext: z.string().trim().max(240).optional().default(""),
});

export type QuoteSubmission = z.infer<typeof quoteSchema> & {
	submittedAt: string;
	clientIp?: string | null;
	userAgent?: string | null;
};

type ValidationResult =
	| {
			ok: true;
			data: QuoteSubmission;
			isSpamLike: boolean;
	  }
	| {
			ok: false;
			fieldErrors: Record<string, string>;
			message: string;
	  };

function getFieldErrors(error: z.ZodError) {
	const next: Record<string, string> = {};

	for (const issue of error.issues) {
		const key = issue.path[0];
		if (typeof key === "string" && !next[key]) {
			next[key] = issue.message;
		}
	}

	return next;
}

function getElapsedSeconds(formStartedAt: string) {
	const parsed = Number.parseInt(formStartedAt, 10);
	if (!Number.isFinite(parsed) || parsed <= 0) return null;
	return Math.floor((Date.now() - parsed) / 1000);
}

export function validateQuoteSubmission(
	input: Record<string, unknown>,
	metadata?: { clientIp?: string | null; userAgent?: string | null },
): ValidationResult {
	const parsed = quoteSchema.safeParse(input);

	if (!parsed.success) {
		return {
			ok: false,
			fieldErrors: getFieldErrors(parsed.error),
			message: "Kindly check the flagged entries and submit again.",
		};
	}

	const elapsedSeconds = getElapsedSeconds(parsed.data.formStartedAt);
	const isSpamLike =
		Boolean(parsed.data.website) ||
		(elapsedSeconds !== null && elapsedSeconds < 3) ||
		(elapsedSeconds !== null && elapsedSeconds > 60 * 60 * 24);

	return {
		ok: true,
		isSpamLike,
		data: {
			...parsed.data,
			submittedAt: new Date().toISOString(),
			clientIp: metadata?.clientIp ?? null,
			userAgent: metadata?.userAgent ?? null,
		},
	};
}

export function getQuoteEmailParts(payload: QuoteSubmission) {
	const subject = `[CTPT Estimate] ${payload.serviceRequired} • ${payload.fullName} • ${payload.location}`;
	const structuredPayload = JSON.stringify(payload, null, 2);

	const text = [
		"Incoming estimate request from Car Tracker Plus Telematics website",
		"",
		`Customer Name: ${payload.fullName}`,
		`Contact Phone: ${payload.phoneNumber}`,
		`Email: ${payload.emailAddress}`,
		`Business Name: ${payload.companyName || "Not supplied"}`,
		`Service Area: ${payload.location}`,
		`Requested Service: ${payload.serviceRequired}`,
		`Vehicle Category: ${payload.vehicleType}`,
		`Fleet Size: ${payload.numberOfVehicles}`,
		`Origin Page: ${payload.sourcePage || "website"}`,
		`Referral Note: ${payload.referralContext || "Not supplied"}`,
		`Timestamp: ${payload.submittedAt}`,
		`Visitor IP: ${payload.clientIp || "Not captured"}`,
		`Browser Info: ${payload.userAgent || "Not captured"}`,
		"",
		"--- JSON PAYLOAD START ---",
		structuredPayload,
		"--- JSON PAYLOAD END ---",
	].join("\n");

	const html = `
		<h1>Incoming estimate request from Car Tracker Plus Telematics website</h1>
		<p>This message contains a structured JSON block for upcoming automated workflow handling.</p>
		<dl>
			<dt><strong>Customer Name</strong></dt><dd>${escapeHtml(payload.fullName)}</dd>
			<dt><strong>Contact Phone</strong></dt><dd>${escapeHtml(payload.phoneNumber)}</dd>
			<dt><strong>Email</strong></dt><dd>${escapeHtml(payload.emailAddress)}</dd>
			<dt><strong>Business Name</strong></dt><dd>${escapeHtml(payload.companyName || "Not supplied")}</dd>
			<dt><strong>Service Area</strong></dt><dd>${escapeHtml(payload.location)}</dd>
			<dt><strong>Requested Service</strong></dt><dd>${escapeHtml(payload.serviceRequired)}</dd>
			<dt><strong>Vehicle Category</strong></dt><dd>${escapeHtml(payload.vehicleType)}</dd>
			<dt><strong>Fleet Size</strong></dt><dd>${escapeHtml(payload.numberOfVehicles)}</dd>
			<dt><strong>Origin Page</strong></dt><dd>${escapeHtml(payload.sourcePage || "website")}</dd>
			<dt><strong>Referral Note</strong></dt><dd>${escapeHtml(payload.referralContext || "Not supplied")}</dd>
			<dt><strong>Timestamp</strong></dt><dd>${escapeHtml(payload.submittedAt)}</dd>
			<dt><strong>Visitor IP</strong></dt><dd>${escapeHtml(payload.clientIp || "Not captured")}</dd>
		</dl>
		<h2>Structured Data Payload</h2>
		<pre>${escapeHtml(structuredPayload)}</pre>
	`;

	return { subject, text, html };
}

function escapeHtml(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}
