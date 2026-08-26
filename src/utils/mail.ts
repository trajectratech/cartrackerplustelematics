import nodemailer from "nodemailer";
import {
	ZOHO_MAIL_BCC,
	ZOHO_MAIL_CC,
	ZOHO_MAIL_FROM,
	ZOHO_MAIL_TO,
	ZOHO_SMTP_HOST,
	ZOHO_SMTP_PASSWORD,
	ZOHO_SMTP_PORT,
	ZOHO_SMTP_USER,
} from "astro:env/server";

export type MailConfig = {
	host: string;
	port: number;
	secure: boolean;
	requireTLS: boolean;
	user: string;
	pass: string;
	to: string;
	from: string;
	cc?: string;
	bcc?: string;
};

const DEFAULT_PORT = 587;
const DEFAULT_HOST = "smtp.zoho.com";

export type MailConfigResult =
	| { ok: true; config: MailConfig }
	| { ok: false; missing: string[] };

export function getMailConfig(): MailConfigResult {
	const user = ZOHO_SMTP_USER?.trim();
	const pass = ZOHO_SMTP_PASSWORD?.trim();
	const to = ZOHO_MAIL_TO?.trim();
	const from = ZOHO_MAIL_FROM?.trim() || user;

	const missing: string[] = [];
	if (!user) missing.push("ZOHO_SMTP_USER");
	if (!pass) missing.push("ZOHO_SMTP_PASSWORD");
	if (!to) missing.push("ZOHO_MAIL_TO");
	if (!from) missing.push("ZOHO_MAIL_FROM");

	if (missing.length > 0 || !user || !pass || !to || !from) {
		return { ok: false, missing };
	}

	const port = Number.parseInt(ZOHO_SMTP_PORT?.trim() || String(DEFAULT_PORT), 10);
	const resolvedPort = Number.isFinite(port) ? port : DEFAULT_PORT;

	return {
		ok: true,
		config: {
			host: ZOHO_SMTP_HOST?.trim() || DEFAULT_HOST,
			port: resolvedPort,
			secure: resolvedPort === 465,
			requireTLS: resolvedPort !== 465,
			user,
			pass,
			to,
			from,
			cc: ZOHO_MAIL_CC?.trim() || undefined,
			bcc: ZOHO_MAIL_BCC?.trim() || undefined,
		},
	};
}

export function createTransport(config: MailConfig) {
	return nodemailer.createTransport({
		host: config.host,
		port: config.port,
		secure: config.secure,
		requireTLS: config.requireTLS,
		auth: { user: config.user, pass: config.pass },
		connectionTimeout: 15_000,
		greetingTimeout: 15_000,
		socketTimeout: 20_000,
	});
}

export function explainMailError(error: unknown): string {
	const err = error as { code?: string; responseCode?: number; message?: string };
	const code = err?.code;
	const responseCode = err?.responseCode;

	if (code === "EAUTH" || responseCode === 535) {
		return [
			"SMTP rejected the credentials (535 Authentication Failed).",
			"Zoho refuses a normal account password over SMTP when two-factor auth is enabled -- generate an",
			"app-specific password (Zoho Mail > My Account > Security > App Passwords) and set ZOHO_SMTP_PASSWORD to it.",
			"Also confirm the account's datacenter: a .eu / .in / .com.au account will not authenticate against smtp.zoho.com.",
		].join(" ");
	}
	if (code === "ETIMEDOUT" || code === "ESOCKET" || code === "ECONNECTION") {
		return [
			`Could not reach the SMTP server (${code}).`,
			"The port is most likely blocked outbound on this network.",
			"Port 465 is commonly blocked; try ZOHO_SMTP_PORT=587, which uses STARTTLS.",
		].join(" ");
	}
	if (code === "EENVELOPE") {
		return "The server rejected the sender or recipient address. ZOHO_MAIL_FROM must be an address the authenticated Zoho account is allowed to send as.";
	}
	return err?.message || "Unknown mail transport error.";
}
