/**
 * SMTP configuration check for Car Tracker Plus Telematics contact/quote form.
 *
 *   npm run verify:mail
 */
import { existsSync, readFileSync } from "node:fs";
import { createConnection } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_PATH = resolve(ROOT, ".env");

function loadEnv() {
	const fromFile = {};
	if (existsSync(ENV_PATH)) {
		for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith("#")) continue;
			const eq = trimmed.indexOf("=");
			if (eq === -1) continue;
			fromFile[trimmed.slice(0, eq)] = trimmed.slice(eq + 1).replace(/^["']|["']$/g, "");
		}
	}
	return { ...fromFile, ...process.env };
}

function mask(value) {
	if (!value) return "(unset)";
	if (value.includes("@")) {
		const [name, domain] = value.split("@");
		return `${name.slice(0, 2)}***@${domain}`;
	}
	return `${"*".repeat(Math.min(value.length, 12))} (${value.length} chars)`;
}

function checkPort(host, port, timeout = 8000) {
	return new Promise((res) => {
		const socket = createConnection({ host, port });
		socket.setTimeout(timeout);
		socket.on("connect", () => { socket.destroy(); res("open"); });
		socket.on("timeout", () => { socket.destroy(); res("timeout"); });
		socket.on("error", (error) => { socket.destroy(); res(error.code || "error"); });
	});
}

const env = loadEnv();
const host = env.ZOHO_SMTP_HOST?.trim() || "smtp.zoho.com";
const port = Number.parseInt(env.ZOHO_SMTP_PORT?.trim() || "587", 10);
const user = env.ZOHO_SMTP_USER?.trim();
const pass = env.ZOHO_SMTP_PASSWORD?.trim();
const to = env.ZOHO_MAIL_TO?.trim();
const from = env.ZOHO_MAIL_FROM?.trim() || user;

console.log("\nCar Tracker Plus Telematics Quote form mail check\n" + "=".repeat(50));
console.log(`  host      ${host}`);
console.log(`  port      ${port} (${port === 465 ? "implicit TLS" : "STARTTLS"})`);
console.log(`  user      ${mask(user)}`);
console.log(`  password  ${mask(pass)}`);
console.log(`  from      ${mask(from)}`);
console.log(`  to        ${mask(to)}`);

const missing = [
	["ZOHO_SMTP_USER", user],
	["ZOHO_SMTP_PASSWORD", pass],
	["ZOHO_MAIL_TO", to],
	["ZOHO_MAIL_FROM", from],
].filter(([, value]) => !value).map(([name]) => name);

if (missing.length > 0) {
	console.error(`\nFAIL: missing required variables: ${missing.join(", ")}`);
	console.error("Set them in .env locally, and in the hosting provider's environment for production.\n");
	process.exit(1);
}

console.log("\nChecking port reachability...");
const reachable = await checkPort(host, port);
console.log(`  ${host}:${port} -> ${reachable}`);

if (reachable !== "open") {
	const alternative = port === 465 ? 587 : 465;
	const altState = await checkPort(host, alternative);
	console.log(`  ${host}:${alternative} -> ${altState}`);
	console.error(`\nFAIL: cannot reach ${host} on port ${port}.`);
	if (altState === "open") {
		console.error(`Port ${alternative} IS reachable from here. Set ZOHO_SMTP_PORT=${alternative} and re-run.`);
	} else {
		console.error("Neither port is reachable. This network is blocking outbound SMTP; try another connection.");
	}
	console.error("");
	process.exit(1);
}

console.log("\nAuthenticating...");
const transporter = nodemailer.createTransport({
	host,
	port,
	secure: port === 465,
	requireTLS: port !== 465,
	auth: { user, pass },
	connectionTimeout: 15_000,
	greetingTimeout: 15_000,
});

try {
	await transporter.verify();
	console.log("\nPASS: SMTP authentication succeeded. The Car Tracker Plus Telematics quote form can deliver mail.\n");
	process.exit(0);
} catch (error) {
	console.error("\nFAIL: SMTP authentication failed.");
	console.error(`  code          ${error.code || "(none)"}`);
	console.error(`  responseCode  ${error.responseCode || "(none)"}`);
	console.error(`  response      ${(error.response || error.message || "").slice(0, 200)}`);

	if (error.code === "EAUTH" || error.responseCode === 535) {
		console.error([
			"",
			"Most likely cause: Zoho rejects a normal account password over SMTP when",
			"two-factor authentication is enabled.",
			"",
			"  1. Zoho Mail > My Account > Security > App Passwords",
			"  2. Generate an app password for 'Car Tracker Plus Telematics website'",
			"  3. Put it in ZOHO_SMTP_PASSWORD (locally and in the hosting environment)",
			"",
			"Also confirm the account's datacenter. A .eu / .in / .com.au Zoho account will",
			"never authenticate against smtp.zoho.com -- use that region's host instead",
			"(smtp.zoho.eu, smtp.zoho.in, smtp.zoho.com.au).",
		].join("\n"));
	}
	console.error("");
	process.exit(1);
}
