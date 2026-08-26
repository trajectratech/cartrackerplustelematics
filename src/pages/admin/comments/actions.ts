import type { APIContext } from "astro";
import { getAdminClient } from "../../../lib/supabase";
import { CSRF_FIELD, verifyCsrf } from "../../../lib/csrf";
import { revalidateBlogPaths } from "../../../lib/revalidate";

export const prerender = false;

export async function POST({ request, cookies, redirect }: APIContext) {
	const form = await request.formData().catch(() => null);

	const back = (notice: string, status = "pending") =>
		redirect(`/admin/comments/?status=${status}&notice=${encodeURIComponent(notice)}`, 303);

	if (!form || !verifyCsrf(cookies, form.get(CSRF_FIELD))) {
		return back("That action expired. Please try again.");
	}

	const id = String(form.get("id") ?? "");
	const action = String(form.get("action") ?? "");
	if (!id) return back("Missing comment id.");

	const supabase = getAdminClient();
	if (!supabase) return back("Supabase is not configured.");

	const { data: comment } = await supabase
		.from("comments")
		.select("id, posts ( slug )")
		.eq("id", id)
		.maybeSingle();

	const slug = ((comment as { posts: { slug: string } | null } | null)?.posts as { slug: string } | null)?.slug;
	const revalidate = () => (slug ? revalidateBlogPaths([`/blogs/${slug}/`]) : Promise.resolve());

	switch (action) {
		case "approve": {
			const body = String(form.get("body") ?? "").trim();
			const patch: Record<string, unknown> = { status: "approved" };
			if (body) patch.body = body;

			await supabase.from("comments").update(patch).eq("id", id);
			await revalidate();
			return back("Comment approved and now visible.");
		}

		case "hide":
			await supabase.from("comments").update({ status: "hidden" }).eq("id", id);
			await revalidate();
			return back("Comment hidden.");

		case "save": {
			const body = String(form.get("body") ?? "").trim();
			if (!body) return back("A comment cannot be empty.");
			await supabase.from("comments").update({ body }).eq("id", id);
			await revalidate();
			return back("Comment updated.");
		}

		case "delete":
			await supabase.from("comments").delete().eq("id", id);
			await revalidate();
			return back("Comment deleted.");

		default:
			return back("Unknown action.");
	}
}
