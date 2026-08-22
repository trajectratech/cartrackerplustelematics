import { z } from "zod";

export const quoteServiceOptions = [
	"Premium Vehicle Tracking",
	"Fleet Tracking",
	"Fleet Management",
	"Corporate Vehicle Tracking",
	"Executive Vehicle Security",
	"Telematics Bundle",
	"Dashcam Installation",
	"Fuel Monitoring",
	"School & Staff Bus Tracking",
	"Speed Limiter",
] as const;

export const vehicleTypeOptions = ["Car", "SUV", "Bus", "Van", "Pickup", "Truck"] as const;

export const vehicleCountOptions = [
	"1 Vehicle",
	"2–5",
	"6–10",
	"11–20",
	"21–50",
	"51–100",
	"100+",
] as const;

const selection = <T extends readonly string[]>(values: T, label: string) =>
	z
		.string()
		.trim()
		.refine((value) => values.includes(value as T[number]), `Select a valid ${label}.`);

const quoteSchema = z.object({
	fullName: z.string().trim().min(2, "Enter your full name.").max(120, "Name is too long."),
	phoneNumber: z
		.string()
		.trim()
		.min(7, "Enter a valid phone number.")
		.max(40, "Phone number is too long.")
		.regex(/^[0-9+().\-\s]+$/, "Enter a valid phone number."),
	emailAddress: z
		.string()
		.trim()
		.email("Enter a valid email address.")
		.max(160, "Email address is too long."),
	companyName: z.string().trim().max(160, "Company name is too long.").optional().default(""),
	location: z.string().trim().min(2, "Enter your state and city.").max(160, "Location is too long."),
	serviceRequired: selection(quoteServiceOptions, "service"),
	vehicleType: selection(vehicleTypeOptions, "vehicle type"),
	numberOfVehicles: selection(vehicleCountOptions, "vehicle count"),
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
			message: "Please review the highlighted fields and try again.",
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
	const subject = `[CTPT Quote] ${payload.serviceRequired} • ${payload.fullName} • ${payload.location}`;
	const structuredPayload = JSON.stringify(payload, null, 2);

	const text = [
		"New Car Tracker Plus Telematics quote request",
		"",
		`Full Name: ${payload.fullName}`,
		`Phone Number: ${payload.phoneNumber}`,
		`Email Address: ${payload.emailAddress}`,
		`Company Name: ${payload.companyName || "Not provided"}`,
		`Location: ${payload.location}`,
		`Service Required: ${payload.serviceRequired}`,
		`Vehicle Type: ${payload.vehicleType}`,
		`Number of Vehicles: ${payload.numberOfVehicles}`,
		`Source Page: ${payload.sourcePage || "website"}`,
		`Referral Context: ${payload.referralContext || "Not provided"}`,
		`Submitted At: ${payload.submittedAt}`,
		`Client IP: ${payload.clientIp || "Unavailable"}`,
		`User Agent: ${payload.userAgent || "Unavailable"}`,
		"",
		"--- JSON PAYLOAD START ---",
		structuredPayload,
		"--- JSON PAYLOAD END ---",
	].join("\n");

	const html = `
		<h1>New Car Tracker Plus Telematics quote request</h1>
		<p>This email includes a structured JSON block for future AI workflow processing.</p>
		<dl>
			<dt><strong>Full Name</strong></dt><dd>${escapeHtml(payload.fullName)}</dd>
			<dt><strong>Phone Number</strong></dt><dd>${escapeHtml(payload.phoneNumber)}</dd>
			<dt><strong>Email Address</strong></dt><dd>${escapeHtml(payload.emailAddress)}</dd>
			<dt><strong>Company Name</strong></dt><dd>${escapeHtml(payload.companyName || "Not provided")}</dd>
			<dt><strong>Location</strong></dt><dd>${escapeHtml(payload.location)}</dd>
			<dt><strong>Service Required</strong></dt><dd>${escapeHtml(payload.serviceRequired)}</dd>
			<dt><strong>Vehicle Type</strong></dt><dd>${escapeHtml(payload.vehicleType)}</dd>
			<dt><strong>Number of Vehicles</strong></dt><dd>${escapeHtml(payload.numberOfVehicles)}</dd>
			<dt><strong>Source Page</strong></dt><dd>${escapeHtml(payload.sourcePage || "website")}</dd>
			<dt><strong>Referral Context</strong></dt><dd>${escapeHtml(payload.referralContext || "Not provided")}</dd>
			<dt><strong>Submitted At</strong></dt><dd>${escapeHtml(payload.submittedAt)}</dd>
			<dt><strong>Client IP</strong></dt><dd>${escapeHtml(payload.clientIp || "Unavailable")}</dd>
		</dl>
		<h2>Structured Payload</h2>
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
