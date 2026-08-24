import type { AstroCookies } from "astro";

const COOKIE_NAME = "Car Tracker Plus Telematics_csrf";
const FIELD_NAME = "_csrf";

export { FIELD_NAME as CSRF_FIELD };

function randomToken() {
	return crypto.randomUUID().replaceAll("-", "");
}

export function ensureCsrfToken(cookies: AstroCookies): string {
	const existing = cookies.get(COOKIE_NAME)?.value;
	if (existing) return existing;

	const token = randomToken();
	cookies.set(COOKIE_NAME, token, {
		path: "/",
		httpOnly: true,
		secure: import.meta.env.PROD,
		sameSite: "lax",
	});
	return token;
}

function safeEqual(a: string, b: string) {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return diff === 0;
}

export function verifyCsrf(cookies: AstroCookies, submitted: unknown): boolean {
	const expected = cookies.get(COOKIE_NAME)?.value;
	if (!expected || typeof submitted !== "string" || !submitted) return false;
	return safeEqual(expected, submitted);
}
