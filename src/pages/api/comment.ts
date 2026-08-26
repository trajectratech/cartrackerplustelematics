import type { APIContext } from "astro";
import { z } from "zod";
import { isAdminConfigured, isSupabaseConfigured, getAdminClient, getPublicClient } from "../../lib/supabase";
import { CSRF_FIELD, verifyCsrf } from "../../lib/csrf";

export const prerender = false;

const schema = z.object({
	postId: z.string().min(1, "Unknown post."),
	displayName: z
		.string()
		.trim()
		.min(2, "Enter a display name.")
		.max(60, "That display name is too long."),
	body: z
		.string()
		.trim()
		.min(2, "Write a comment.")
		.max(4000, "That comment is too long."),
});

const RATE_WINDOW_MINUTES = 10;
const RATE_MAX_COMMENTS = 3;

async function hashIp(ip: string | null) {
	if (!ip) return null;
	const salt = import.meta.env.COMMENT_IP_SALT || "Car Tracker Plus Telematics-default-salt";
	const bytes = new TextEncoder().encode(`${salt}:${ip}`);
	const digest = await crypto.subtle.digest("SHA-256", bytes);
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function backTo(redirect: APIContext["redirect"], slug: string, state: string) {
	return redirect(`/blogs/${slug}/?comment=${state}#comments-heading`, 303);
}

export async function POST({ request, cookies, clientAddress, redirect }: APIContext) {
	const form = await request.formData().catch(() => null);
	const slug = form ? String(form.get("postSlug") ?? "") : "";

	if (!form || !slug) return redirect("/blogs/", 303);

	if (!verifyCsrf(cookies, form.get(CSRF_FIELD))) {
		return backTo(redirect, slug, "invalid");
	}

	const honeypot = String(form.get("website") ?? "");
	const startedAt = Number.parseInt(String(form.get("formStartedAt") ?? ""), 10);
	const elapsedMs = Number.isFinite(startedAt) ? Date.now() - startedAt : null;

	if (honeypot || (elapsedMs !== null && elapsedMs < 3000)) {
		console.log(JSON.stringify({ scope: "comment", event: "spam_discarded", slug }));
		return backTo(redirect, slug, "received");
	}

	const parsed = schema.safeParse({
		postId: String(form.get("postId") ?? ""),
		displayName: String(form.get("displayName") ?? ""),
		body: String(form.get("body") ?? ""),
	});

	if (!parsed.success) {
		return backTo(redirect, slug, "invalid");
	}

	if (!isSupabaseConfigured()) {
		return backTo(redirect, slug, "received");
	}

	const publicClient = getPublicClient();
	if (!publicClient) return backTo(redirect, slug, "error");

	const { data: post } = await publicClient
		.from("posts")
		.select("id")
		.eq("id", parsed.data.postId)
		.maybeSingle();

	if (!post) return backTo(redirect, slug, "invalid");

	const admin = getAdminClient();
	if (!admin || !isAdminConfigured()) return backTo(redirect, slug, "error");

	const ipHash = await hashIp(clientAddress || request.headers.get("x-forwarded-for"));

	if (ipHash) {
		const since = new Date(Date.now() - RATE_WINDOW_MINUTES * 60_000).toISOString();
		const { count } = await admin
			.from("comments")
			.select("id", { count: "exact", head: true })
			.eq("ip_hash", ipHash)
			.gte("created_at", since);

		if ((count ?? 0) >= RATE_MAX_COMMENTS) {
			console.log(JSON.stringify({ scope: "comment", event: "rate_limited", slug }));
			return backTo(redirect, slug, "throttled");
		}
	}

	const { error } = await admin.from("comments").insert({
		post_id: parsed.data.postId,
		display_name: parsed.data.displayName,
		body: parsed.data.body,
		status: "pending",
		ip_hash: ipHash,
		user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
	});

	if (error) {
		console.log(
			JSON.stringify({ scope: "comment", event: "insert_failed", slug, message: error.message }),
		);
		return backTo(redirect, slug, "error");
	}

	console.log(JSON.stringify({ scope: "comment", event: "received", slug }));
	return backTo(redirect, slug, "received");
}
