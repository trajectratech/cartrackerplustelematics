import type { APIContext } from "astro";
import { getAdminClient } from "../../../lib/supabase";
import { CSRF_FIELD, verifyCsrf } from "../../../lib/csrf";
import { revalidateBlogPaths } from "../../../lib/revalidate";

export const prerender = false;

type Action = "publish" | "unpublish" | "archive" | "restore" | "pin" | "unpin" | "delete";

function back(redirect: APIContext["redirect"], notice: string) {
	return redirect(`/admin/posts/?notice=${encodeURIComponent(notice)}`, 303);
}

export async function POST({ request, cookies, redirect }: APIContext) {
	const form = await request.formData().catch(() => null);

	if (!form || !verifyCsrf(cookies, form.get(CSRF_FIELD))) {
		return back(redirect, "That action expired. Please try again.");
	}

	const id = String(form.get("id") ?? "");
	const action = String(form.get("action") ?? "") as Action;
	if (!id) return back(redirect, "Missing post id.");

	const supabase = getAdminClient();
	if (!supabase) return back(redirect, "Supabase is not configured.");

	const { data: post } = await supabase
		.from("posts")
		.select("id, slug, status, published_at, pin_order")
		.eq("id", id)
		.maybeSingle();

	if (!post) return back(redirect, "That post no longer exists.");

	let patch: Record<string, unknown> | null = null;
	let notice = "";

	switch (action) {
		case "publish":
			patch = {
				status: "published",
				published_at: (post as { published_at: string | null }).published_at ?? new Date().toISOString(),
			};
			notice = "Post published.";
			break;

		case "unpublish":
			patch = { status: "draft" };
			notice = "Post moved back to draft.";
			break;

		case "archive":
			patch = { status: "archived" };
			notice = "Post archived.";
			break;

		case "restore":
			patch = { status: "draft" };
			notice = "Post restored as a draft.";
			break;

		case "pin": {
			const { data: last } = await supabase
				.from("posts")
				.select("pin_order")
				.eq("is_pinned", true)
				.order("pin_order", { ascending: false, nullsFirst: false })
				.limit(1)
				.maybeSingle();

			patch = { is_pinned: true, pin_order: (((last as { pin_order: number | null } | null)?.pin_order as number | null) ?? 0) + 1 };
			notice = "Post pinned.";
			break;
		}

		case "unpin":
			patch = { is_pinned: false, pin_order: null };
			notice = "Post unpinned.";
			break;

		case "delete": {
			await supabase.from("posts").delete().eq("id", id);
			await revalidateBlogPaths([`/blogs/${(post as { slug: string }).slug}/`, "/blogs/"]);
			return back(redirect, "Post deleted.");
		}

		default:
			return back(redirect, "Unknown action.");
	}

	const { error } = await supabase.from("posts").update(patch).eq("id", id);
	if (error) {
		console.log(JSON.stringify({ scope: "admin-posts", event: "action_failed", action, id }));
		return back(redirect, `Could not ${action} the post.`);
	}

	await revalidateBlogPaths([`/blogs/${(post as { slug: string }).slug}/`, "/blogs/"]);

	return back(redirect, notice);
}
