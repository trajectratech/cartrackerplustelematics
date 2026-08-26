import type { APIContext } from "astro";
import { getAdminClient, getMediaUrl } from "../../../lib/supabase";
import { CSRF_FIELD, verifyCsrf } from "../../../lib/csrf";

export const prerender = false;

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_BYTES = 10 * 1024 * 1024;

function json(data: Record<string, unknown>, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
	});
}

export async function POST({ request, cookies }: APIContext) {
	const form = await request.formData().catch(() => null);

	if (!form || !verifyCsrf(cookies, form.get(CSRF_FIELD))) {
		return json({ ok: false, message: "Your session expired. Reload the page and try again." }, 403);
	}

	const file = form.get("file");
	if (!(file instanceof File) || file.size === 0) {
		return json({ ok: false, message: "No file received." }, 400);
	}
	if (!ALLOWED.has(file.type)) {
		return json({ ok: false, message: "Images must be JPEG, PNG, WebP or AVIF." }, 400);
	}
	if (file.size > MAX_BYTES) {
		return json({ ok: false, message: "That image is larger than 10 MB." }, 400);
	}

	const supabase = getAdminClient();
	if (!supabase) return json({ ok: false, message: "Storage is not configured." }, 503);

	const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
	const base = file.name
		.replace(/\.[^.]+$/, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 60);
	const path = `body/${base || "image"}-${Date.now()}.${extension}`;

	const { error } = await supabase.storage
		.from("blog-media")
		.upload(path, file, { contentType: file.type, upsert: false });

	if (error) {
		console.log(
			JSON.stringify({ scope: "admin-media", event: "upload_failed", message: error.message }),
		);
		return json({ ok: false, message: `Upload failed: ${error.message}` }, 502);
	}

	return json({ ok: true, path, url: getMediaUrl(path, { width: 1280 }) });
}
