import type { APIContext } from "astro";
import { getSessionClient } from "../../lib/supabase";
import { CSRF_FIELD, verifyCsrf } from "../../lib/csrf";

export const prerender = false;

export async function POST({ request, cookies, redirect }: APIContext) {
	const form = await request.formData().catch(() => null);

	if (!form || !verifyCsrf(cookies, form.get(CSRF_FIELD))) {
		return redirect("/admin/", 302);
	}

	const supabase = getSessionClient(cookies);
	await supabase?.auth.signOut();

	return redirect("/admin/login/", 302);
}
