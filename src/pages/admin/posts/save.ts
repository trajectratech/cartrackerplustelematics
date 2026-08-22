import type { APIContext } from "astro";
import { getAdminClient } from "../../../lib/supabase";
import { CSRF_FIELD, verifyCsrf } from "../../../lib/csrf";
import { estimateReadingMinutes, slugify } from "../../../lib/posts";
import { revalidateBlogPaths } from "../../../lib/revalidate";

export const prerender = false;

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function fail(redirect: APIContext["redirect"], id: string, message: string) {
	const target = id ? `/admin/posts/${id}/` : "/admin/posts/new/";
	return redirect(`${target}?error=${encodeURIComponent(message)}`, 303);
}

async function resolveSlug(
	supabase: ReturnType<typeof getAdminClient>,
	desired: string,
	currentId: string | null,
) {
	let candidate = desired;
	for (let attempt = 2; attempt < 50; attempt += 1) {
		let query = supabase!.from("posts").select("id").eq("slug", candidate).limit(1);
		if (currentId) query = query.neq("id", currentId);
		const { data } = await query;
		if (!data || data.length === 0) return candidate;
		candidate = `${desired}-${attempt}`;
	}
	return `${desired}-${Date.now()}`;
}

export async function POST({ request, cookies, redirect }: APIContext) {
	const form = await request.formData().catch(() => null);
	const id = form ? String(form.get("id") ?? "") : "";

	if (!form || !verifyCsrf(cookies, form.get(CSRF_FIELD))) {
		return fail(redirect, id, "Your session expired. Please sign in again and retry.");
	}

	const supabase = getAdminClient();
	if (!supabase) return fail(redirect, id, "Supabase is not configured.");

	const title = String(form.get("title") ?? "").trim();
	const excerpt = String(form.get("excerpt") ?? "").trim();
	const body = String(form.get("body") ?? "").trim();
	const status = String(form.get("status") ?? "draft");

	if (!title) return fail(redirect, id, "A title is required.");
	if (!excerpt) return fail(redirect, id, "An excerpt is required.");
	if (!body) return fail(redirect, id, "The post body cannot be empty.");
	if (!["draft", "published", "archived"].includes(status)) {
		return fail(redirect, id, "Unknown status.");
	}

	const requestedSlug = String(form.get("slug") ?? "").trim();
	const baseSlug = slugify(requestedSlug || title);
	if (!baseSlug) return fail(redirect, id, "Could not derive a slug. Add one manually.");
	const slug = await resolveSlug(supabase, baseSlug, id || null);

	let featuredImagePath: string | undefined;
	const upload = form.get("featured_image");
	const altText = String(form.get("featured_image_alt") ?? "").trim();

	if (upload instanceof File && upload.size > 0) {
		if (!ALLOWED_IMAGE_TYPES.has(upload.type)) {
			return fail(redirect, id, "Images must be JPEG, PNG, WebP or AVIF.");
		}
		if (upload.size > MAX_IMAGE_BYTES) {
			return fail(redirect, id, "That image is larger than 10 MB.");
		}
		if (!altText) {
			return fail(redirect, id, "Add alt text describing the image before uploading it.");
		}

		const extension = upload.name.split(".").pop()?.toLowerCase() || "jpg";
		const objectPath = `posts/${slug}-${Date.now()}.${extension}`;

		const { error: uploadError } = await supabase.storage
			.from("blog-media")
			.upload(objectPath, upload, { contentType: upload.type, upsert: false });

		if (uploadError) {
			console.log(
				JSON.stringify({ scope: "admin-posts", event: "upload_failed", message: uploadError.message }),
			);
			return fail(redirect, id, `Image upload failed: ${uploadError.message}`);
		}
		featuredImagePath = objectPath;
	}

	const publishedInput = String(form.get("published_at") ?? "").trim();
	const publishedAt = publishedInput ? new Date(publishedInput).toISOString() : null;

	const resolvedPublishedAt =
		status === "published" ? (publishedAt ?? new Date().toISOString()) : publishedAt;

	const pinOrderRaw = String(form.get("pin_order") ?? "").trim();

	const record: Record<string, unknown> = {
		title,
		slug,
		excerpt,
		body,
		status,
		published_at: resolvedPublishedAt,
		reading_minutes: estimateReadingMinutes(body),
		category_id: String(form.get("category_id") ?? "") || null,
		author_id: String(form.get("author_id") ?? "") || null,
		meta_title: String(form.get("meta_title") ?? "").trim() || null,
		meta_description: String(form.get("meta_description") ?? "").trim() || null,
		is_pinned: form.get("is_pinned") === "1",
		pin_order: pinOrderRaw ? Number.parseInt(pinOrderRaw, 10) : null,
	};

	if (featuredImagePath) {
		record.featured_image_path = featuredImagePath;
		record.featured_image_is_placeholder = false;
	}
	if (altText) record.featured_image_alt = altText;

	let savedId = id;
	let previousSlug: string | null = null;

	if (id) {
		const { data: existing } = await supabase
			.from("posts")
			.select("slug")
			.eq("id", id)
			.maybeSingle();
		previousSlug = ((existing as { slug: string } | null)?.slug as string) ?? null;

		const { error } = await supabase.from("posts").update(record).eq("id", id);
		if (error) {
			console.log(
				JSON.stringify({ scope: "admin-posts", event: "update_failed", message: error.message }),
			);
			return fail(redirect, id, `Could not save: ${error.message}`);
		}
	} else {
		const { data, error } = await supabase.from("posts").insert(record).select("id").single();
		if (error) {
			console.log(
				JSON.stringify({ scope: "admin-posts", event: "insert_failed", message: error.message }),
			);
			return fail(redirect, "", `Could not create the post: ${error.message}`);
		}
		savedId = (data as { id: string }).id;
	}

	const paths = [`/blogs/${slug}/`, "/blogs/"];
	if (previousSlug && previousSlug !== slug) paths.push(`/blogs/${previousSlug}/`);
	await revalidateBlogPaths(paths);

	return redirect(
		`/admin/posts/${savedId}/?notice=${encodeURIComponent("Post saved.")}`,
		303,
	);
}
