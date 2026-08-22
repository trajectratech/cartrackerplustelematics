/**
 * Blog-data loader — Supabase-only.
 *
 * Previously this library paired the Supabase CMS with a static 3-article
 * fallback from `src/data/articles.ts`, which made it very hard to tell if
 * the blog CMS was actually working (or if someone was reading placeholder
 * content that could never accept real comments). The user asked for
 * explicit, honest behaviour instead:
 *
 *   - Supabase configured + reachable + has rows  -> show them.
 *   - Supabase configured but query fails         -> surface an error.
 *   - Supabase unconfigured                       -> surface "blog not set up".
 *   - No posts                                    -> "blog is empty", not "here are 3 fake ones".
 *
 * Pages that need lists / a post should import from here *and* handle
 * the three `BlogFeedStatus` cases: "ok" (data), "empty", "error" (message).
 * The pages themselves are responsible for rendering the user-facing banner.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicClient } from "./supabase";

export type PostStatus = "draft" | "published" | "archived";
export type CommentStatus = "pending" | "approved" | "hidden";

export interface BlogPost {
	id: string;
	slug: string;
	title: string;
	excerpt: string;
	body: string;
	status: PostStatus;
	published_at: string | null;
	updated_at: string;
	created_at: string;
	featured_image_path: string | null;
	featured_image_alt: string | null;
	featured_image_width: number | null;
	featured_image_height: number | null;
	featured_image_is_placeholder: boolean;
	author_id: string | null;
	category_id: string | null;
	meta_title: string | null;
	meta_description: string | null;
	reading_minutes: number;
	is_pinned: boolean;
	pin_order: number | null;
	authors?: { name: string; slug: string; bio: string | null; full_name?: string; avatar_url?: string } | null;
	categories?: { name: string; slug: string } | null;
	tags?: { name: string; slug: string }[] | null;
	category_slug?: string;
}

export interface PostIndexEntry {
	slug: string;
	title: string;
	published_at: string;
	updated_at: string;
}

export interface CommentRecord {
	id: string;
	post_id: string;
	author: string | null;
	email: string | null;
	display_name: string;
	body: string;
	status: CommentStatus;
	created_at: string;
	updated_at: string;
}

export type BlogFeedStatus = "ok" | "empty" | "unconfigured" | "error";
export interface BlogFeedResult {
	status: BlogFeedStatus;
	data: BlogPost[];
	count: number;
	totalPages: number;
	errorMessage: string | null;
}
export interface BlogPostResult {
	status: BlogFeedStatus;
	post: BlogPost | null;
	adjacent: { prev: BlogPost | null; next: BlogPost | null };
	errorMessage: string | null;
}
export interface PostIndexResult {
	status: BlogFeedStatus;
	entries: PostIndexEntry[];
	errorMessage: string | null;
}
export interface AdjacentPosts {
	prev: BlogPost | null;
	next: BlogPost | null;
}

export { isSupabaseConfigured } from "./supabase";

const POST_COLUMNS = `
	id, slug, title, excerpt, body, status, published_at, updated_at, created_at,
	featured_image_path, featured_image_alt, featured_image_width, featured_image_height,
	featured_image_is_placeholder, author_id, category_id, meta_title, meta_description,
	reading_minutes, is_pinned, pin_order,
	authors ( name, slug, bio ),
	categories ( name, slug )
`;

const LIST_COLUMNS = `
	id, slug, title, excerpt, status, published_at, updated_at,
	featured_image_path, featured_image_alt, featured_image_width, featured_image_height,
	reading_minutes, is_pinned, pin_order,
	authors ( name, slug ),
	categories ( name, slug )
`;

export function formatReadingTime(minutes: number): string {
	const safe = Math.max(1, Math.round(minutes ?? 0));
	return `${safe} min read`;
}

export function slugify(input: string): string {
	return String(input ?? "")
		.toLowerCase()
		.trim()
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9\s-]/g, " ")
		.replace(/[\s_]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 80);
}

export function estimateReadingMinutes(body: string): number {
	if (!body) return 1;
	const stripped = String(body).replace(/<[^>]+>/g, " ");
	const words = stripped.trim().split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(words / 220));
}

function applyLiveFilter(query: any) {
	return query
		.eq("status", "published")
		.order("is_pinned", { ascending: false })
		.order("pin_order", { ascending: true, nullsFirst: false })
		.order("published_at", { ascending: false });
}

function attachTags<T extends BlogPost>(
	rows: T[],
	tagged: Map<string, { name: string; slug: string }[]>,
): (T & { tags: { name: string; slug: string }[] | null })[] {
	return rows.map((r) => {
		const tags = tagged.get(r.id);
		return { ...r, tags: tags && tags.length ? tags : null };
	});
}

function stripPostTagsJoin<T extends object>(row: T & {
	post_tags?: { tags: { name: string; slug: string } }[] | null;
}): T {
	const copy = { ...row };
	delete (copy as { post_tags?: unknown }).post_tags;
	return copy;
}

function safeErrorMessage(err: unknown): string {
	if (err instanceof Error && err.message.trim()) return err.message;
	return "The blog database could not be reached.";
}

/**
 * Paginated list of published posts.
 *
 *  - status === "unconfigured"  → Supabase env vars missing. Render a
 *                                  "blog CMS not connected" banner.
 *  - status === "error"         → Query failed. errorMessage has details.
 *  - status === "empty"         → Query succeeded but there are no posts.
 *  - status === "ok"            → data has the page slice.
 */
export async function getLivePosts(
	clientArg?: SupabaseClient | null,
	opts: { page?: number; perPage?: number } = {},
): Promise<BlogFeedResult> {
	const client = clientArg ?? getPublicClient();
	if (!client) {
		return {
			status: "unconfigured",
			data: [],
			count: 0,
			totalPages: 1,
			errorMessage:
				"Car Tracker Plus Telematics blog is not connected yet. Please configure Supabase credentials to enable the blog CMS.",
		};
	}
	const page = Math.max(1, opts.page ?? 1);
	const perPage = Math.max(1, Math.min(50, opts.perPage ?? 9));
	try {
		const base = applyLiveFilter(
			client.from("posts").select(
				LIST_COLUMNS + ", post_tags ( tags ( name, slug ) )",
				{ count: "exact" },
			),
		);
		const listResult = await base.range((page - 1) * perPage, page * perPage - 1);
		if (listResult.error) {
			return {
				status: "error",
				data: [],
				count: 0,
				totalPages: 1,
				errorMessage: listResult.error.message || "Unable to load blog posts right now.",
			};
		}
		const rows = (listResult.data ?? []) as unknown as (BlogPost & {
			post_tags?: { tags: { name: string; slug: string } }[] | null;
		})[];
		const tagged = new Map<string, { name: string; slug: string }[]>();
		for (const row of rows) {
			const tags = (row.post_tags ?? []).filter((x) => x?.tags).map((x) => x.tags);
			if (tags.length) tagged.set(row.id, tags);
		}
		const clean = rows.map((r) => stripPostTagsJoin(r) as BlogPost);
		const data = attachTags(clean, tagged);
		const count = listResult.count ?? data.length;
		if (!count) {
			return { status: "empty", data: [], count: 0, totalPages: 1, errorMessage: null };
		}
		return {
			status: "ok",
			data,
			count,
			totalPages: Math.max(1, Math.ceil(count / perPage)),
			errorMessage: null,
		};
	} catch (err) {
		return {
			status: "error",
			data: [],
			count: 0,
			totalPages: 1,
			errorMessage: safeErrorMessage(err),
		};
	}
}

/**
 * Index-only list (cheap) used for build-time sitemap, prev/next, RSS.
 */
export async function getLivePostIndex(clientArg?: SupabaseClient | null): Promise<PostIndexResult> {
	const client = clientArg ?? getPublicClient();
	if (!client) {
		return {
			status: "unconfigured",
			entries: [],
			errorMessage: "Blog CMS is not configured. Please set up Supabase credentials.",
		};
	}
	try {
		const result = await applyLiveFilter(
			client.from("posts").select("slug, title, published_at, updated_at", { count: "exact" }),
		);
		if (result.error) {
			return {
				status: "error",
				entries: [],
				errorMessage: result.error.message || "Unable to build the blog index.",
			};
		}
		const entries = (result.data ?? []) as PostIndexEntry[];
		if (!entries.length) return { status: "empty", entries: [], errorMessage: null };
		return { status: "ok", entries, errorMessage: null };
	} catch (err) {
		return {
			status: "error",
			entries: [],
			errorMessage: safeErrorMessage(err),
		};
	}
}

async function fetchAdjacentPosts(
	client: SupabaseClient,
	slug: string,
	index: PostIndexResult,
): Promise<AdjacentPosts> {
	const current = index.entries.findIndex((e) => e.slug === slug);
	const slugs: string[] = [];
	if (current > 0) slugs.push(index.entries[current - 1].slug);
	if (current >= 0 && current < index.entries.length - 1) slugs.push(index.entries[current + 1].slug);
	if (!slugs.length) return { prev: null, next: null };
	try {
		const res = await client
			.from("posts")
			.select(LIST_COLUMNS + ", post_tags ( tags ( name, slug ) )")
			.eq("status", "published")
			.in("slug", slugs);
		if (res.error || !res.data?.length) return { prev: null, next: null };
		const rows = (res.data ?? []) as unknown as (BlogPost & {
			post_tags?: { tags: { name: string; slug: string } }[] | null;
		})[];
		const tagged = new Map<string, { name: string; slug: string }[]>();
		for (const row of rows) {
			const tags = (row.post_tags ?? []).filter((x) => x?.tags).map((x) => x.tags);
			if (tags.length) tagged.set(row.id, tags);
		}
		const clean = rows.map((r) => stripPostTagsJoin(r) as BlogPost);
		const withTags = attachTags(clean, tagged);
		const bySlug = new Map(withTags.map((p) => [p.slug, p]));
		return {
			prev: current > 0 ? bySlug.get(index.entries[current - 1].slug) ?? null : null,
			next: current >= 0 && current < index.entries.length - 1
				? bySlug.get(index.entries[current + 1].slug) ?? null
				: null,
		};
	} catch {
		return { prev: null, next: null };
	}
}

/**
 * Single published post by slug, plus previous/next from the live index.
 *
 *  - "unconfigured"  → no Supabase client. Do NOT fake a post.
 *  - "error"         → DB call failed. Show error.
 *  - "empty"         → No published post with this slug. Caller should 404.
 *  - "ok"            → post populated (+ adjacent where available).
 */
export async function getLivePostBySlug(
	slug: string,
	clientArg?: SupabaseClient | null,
): Promise<BlogPostResult> {
	const client = clientArg ?? getPublicClient();
	if (!client) {
		return {
			status: "unconfigured",
			post: null,
			adjacent: { prev: null, next: null },
			errorMessage:
				"Blog CMS is not configured. Please set up Supabase credentials to publish articles.",
		};
	}
	try {
		const [postResult, indexResult] = await Promise.all([
			client
				.from("posts")
				.select(POST_COLUMNS + ", post_tags ( tags ( name, slug ) )")
				.eq("slug", slug)
				.eq("status", "published")
				.maybeSingle(),
			getLivePostIndex(client),
		]);
		if (postResult.error) {
			return {
				status: "error",
				post: null,
				adjacent: { prev: null, next: null },
				errorMessage: postResult.error.message || "Unable to load this article.",
			};
		}
		const row = postResult.data as
			| (BlogPost & { post_tags?: { tags: { name: string; slug: string } }[] | null })
			| null;
		if (!row) {
			return {
				status: "empty",
				post: null,
				adjacent: { prev: null, next: null },
				errorMessage: null,
			};
		}
		const tags = (row.post_tags ?? []).filter((x) => x?.tags).map((x) => x.tags);
		const clean = stripPostTagsJoin(row) as BlogPost;
		const post = { ...clean, tags: tags.length ? tags : null };
		const adjacent = indexResult.status === "ok"
			? await fetchAdjacentPosts(client, slug, indexResult)
			: { prev: null, next: null };
		return { status: "ok", post, adjacent, errorMessage: null };
	} catch (err) {
		return {
			status: "error",
			post: null,
			adjacent: { prev: null, next: null },
			errorMessage: safeErrorMessage(err),
		};
	}
}

/**
 * Related posts = the 3 most recent published posts in the same category,
 * excluding the provided post id. Falls back to 3 most-recent overall when
 * the post has no category.
 */
export async function getRelatedPosts(
	postId: string,
	categoryId?: string | null,
	clientArg?: SupabaseClient | null,
): Promise<BlogPost[]> {
	const client = clientArg ?? getPublicClient();
	if (!client) return [];
	try {
		let query = client
			.from("posts")
			.select(LIST_COLUMNS + ", post_tags ( tags ( name, slug ) )")
			.eq("status", "published")
			.neq("id", postId)
			.order("published_at", { ascending: false })
			.limit(3);
		if (categoryId) query = query.eq("category_id", categoryId);
		const res = await query;
		if (res.error || !res.data?.length) return [];
		const rows = (res.data ?? []) as unknown as (BlogPost & {
			post_tags?: { tags: { name: string; slug: string } }[] | null;
		})[];
		const tagged = new Map<string, { name: string; slug: string }[]>();
		for (const row of rows) {
			const tags = (row.post_tags ?? []).filter((x) => x?.tags).map((x) => x.tags);
			if (tags.length) tagged.set(row.id, tags);
		}
		const clean = rows.map((r) => stripPostTagsJoin(r) as BlogPost);
		return attachTags(clean, tagged);
	} catch {
		return [];
	}
}

/**
 * Comments that have been explicitly approved. Pending / hidden comments are
 * never returned to the public renderer, even if the DB has them. Returns
 * an empty array when Supabase is unconfigured or the table is missing — we
 * never show phantom comments.
 */
export async function getApprovedComments(
	postId: string,
	clientArg?: SupabaseClient | null,
): Promise<Pick<CommentRecord, "id" | "display_name" | "body" | "created_at">[]> {
	const client = clientArg ?? getPublicClient();
	if (!client) return [];
	try {
		const res = await client
			.from("comments")
			.select("id, display_name, body, created_at")
			.eq("post_id", postId)
			.eq("status", "approved")
			.order("created_at", { ascending: true });
		if (res.error || !res.data?.length) return [];
		return res.data as Pick<CommentRecord, "id" | "display_name" | "body" | "created_at">[];
	} catch {
		return [];
	}
}

/**
 * Full-text-ish search across title / excerpt / body using Postgres ilike.
 * Good enough for 10–500 blog posts; add a pg_search index later if you
 * need more. Returns an envelope with the same status semantics as the
 * list loader — "empty" here means "no matches for this query".
 */
export async function searchLivePosts(
	query: string,
	clientArg?: SupabaseClient | null,
): Promise<BlogFeedResult> {
	const client = clientArg ?? getPublicClient();
	if (!client) {
		return {
			status: "unconfigured",
			data: [],
			count: 0,
			totalPages: 1,
			errorMessage:
				"Blog CMS is not configured. Search is unavailable until Supabase is connected.",
		};
	}
	const q = query.trim();
	if (!q) return { status: "ok", data: [], count: 0, totalPages: 1, errorMessage: null };
	try {
		const needle = `%${q}%`;
		const raw = await client
			.from("posts")
			.select(LIST_COLUMNS + ", post_tags ( tags ( name, slug ) )", { count: "exact" })
			.eq("status", "published")
			.or(`title.ilike.${needle},excerpt.ilike.${needle},body.ilike.${needle}`)
			.order("published_at", { ascending: false })
			.limit(48);
		if (raw.error) {
			return {
				status: "error",
				data: [],
				count: 0,
				totalPages: 1,
				errorMessage: raw.error.message || "Unable to run the blog search.",
			};
		}
		const rows = (raw.data ?? []) as unknown as (BlogPost & {
			post_tags?: { tags: { name: string; slug: string } }[] | null;
		})[];
		const tagged = new Map<string, { name: string; slug: string }[]>();
		for (const row of rows) {
			const tags = (row.post_tags ?? []).filter((x) => x?.tags).map((x) => x.tags);
			if (tags.length) tagged.set(row.id, tags);
		}
		const clean = rows.map((r) => stripPostTagsJoin(r) as BlogPost);
		const data = attachTags(clean, tagged);
		const count = raw.count ?? data.length;
		if (!count) return { status: "empty", data: [], count: 0, totalPages: 1, errorMessage: null };
		return {
			status: "ok",
			data,
			count,
			totalPages: 1,
			errorMessage: null,
		};
	} catch (err) {
		return {
			status: "error",
			data: [],
			count: 0,
			totalPages: 1,
			errorMessage: safeErrorMessage(err),
		};
	}
}

/* -------------------------------------------------------------------------- */
/*   Intentionally removed: getAllArticles / getArticleBySlug /              */
/*   getFeaturedArticles.                                                     */
/*                                                                            */
/*   The hard-coded 3-article fallback was deleted so the site does NOT       */
/*   pretend to have a working blog when Supabase is unreachable, empty,     */
/*   or unconfigured.                                                         */
/* -------------------------------------------------------------------------- */
