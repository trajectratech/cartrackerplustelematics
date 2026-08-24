import type { APIContext } from "astro";
import { getQuoteEmailParts, validateQuoteSubmission } from "../../utils/quote";
import { createTransport, explainMailError, getMailConfig } from "../../utils/mail";

export const prerender = false;

const WHATSAPP_FALLBACK = "You can also reach us on WhatsApp for a faster reply.";

function json(data: Record<string, unknown>, init?: ResponseInit) {
	return new Response(JSON.stringify(data), {
		...init,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			...(init?.headers ?? {}),
		},
	});
}

function newRequestId() {
	return Math.random().toString(36).slice(2, 10);
}

function log(requestId: string, event: string, detail: Record<string, unknown> = {}) {
	console.log(JSON.stringify({ scope: "quote", requestId, event, ...detail }));
}

export async function POST({ request, clientAddress }: APIContext) {
	const requestId = newRequestId();
	const startedAt = Date.now();

	let rawInput: Record<string, unknown> = {};
	try {
		const contentType = request.headers.get("content-type") || "";
		if (contentType.includes("application/json")) {
			rawInput = (await request.json()) as Record<string, unknown>;
		} else {
			const formData = await request.formData();
			rawInput = Object.fromEntries(formData.entries());
		}
	} catch (error) {
		log(requestId, "body_parse_failed", { message: (error as Error)?.message });
		return json(
			{
				ok: false,
				requestId,
				message: "We could not read your submission. Please refresh the page and try again.",
			},
			{ status: 400 },
		);
	}

	const validation = validateQuoteSubmission(rawInput, {
		clientIp: clientAddress || request.headers.get("x-forwarded-for"),
		userAgent: request.headers.get("user-agent"),
	});

	if (!validation.ok) {
		log(requestId, "validation_failed", { fields: Object.keys(validation.fieldErrors) });
		return json(
			{
				ok: false,
				requestId,
				message: validation.message,
				errors: validation.fieldErrors,
			},
			{ status: 400 },
		);
	}

	if (validation.isSpamLike) {
		log(requestId, "spam_discarded");
		return json({
			ok: true,
			requestId,
			message: "Thanks, your quote request has been received.",
		});
	}

	const mailConfig = getMailConfig();

	if (!mailConfig.ok) {
		log(requestId, "mail_not_configured", { missing: mailConfig.missing });
		return json(
			{
				ok: false,
				requestId,
				reason: "not_configured",
				message: `Online quote delivery is temporarily unavailable. ${WHATSAPP_FALLBACK}`,
			},
			{ status: 503 },
		);
	}

	const email = getQuoteEmailParts(validation.data);

	try {
		const transporter = createTransport(mailConfig.config);

		await transporter.sendMail({
			from: mailConfig.config.from,
			to: mailConfig.config.to,
			cc: mailConfig.config.cc,
			bcc: mailConfig.config.bcc,
			replyTo: validation.data.emailAddress,
			subject: email.subject,
			text: email.text,
			html: email.html,
			headers: {
				"X-Car Tracker Plus Telematics-Lead-Type": "quote-request",
				"X-Car Tracker Plus Telematics-Service": validation.data.serviceRequired,
				"X-Car Tracker Plus Telematics-Vehicle-Type": validation.data.vehicleType,
				"X-Car Tracker Plus Telematics-Source-Page": validation.data.sourcePage,
			},
		});

		log(requestId, "sent", {
			ms: Date.now() - startedAt,
			service: validation.data.serviceRequired,
			sourcePage: validation.data.sourcePage,
		});

		return json({
			ok: true,
			requestId,
			message:
				"Thanks, your quote request has been sent. Our team will reach out shortly. You can also continue on WhatsApp if you need a faster reply.",
		});
	} catch (error) {
		const err = error as { code?: string; responseCode?: number };
		log(requestId, "send_failed", {
			ms: Date.now() - startedAt,
			code: err?.code,
			responseCode: err?.responseCode,
			diagnosis: explainMailError(error),
		});

		return json(
			{
				ok: false,
				requestId,
				reason: "delivery_failed",
				message: `Your details reached us but the confirmation email could not be delivered just now. ${WHATSAPP_FALLBACK} Reference: ${requestId}`,
			},
			{ status: 502 },
		);
	}
}

export function GET() {
	return json(
		{ ok: false, message: "This endpoint accepts POST submissions only." },
		{ status: 405, headers: { Allow: "POST" } },
	);
}
