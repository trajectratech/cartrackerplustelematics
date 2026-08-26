import { defineMiddleware } from "astro:middleware";
import { getSessionClient, isSupabaseConfigured } from "./lib/supabase";

const ADMIN_PREFIX = "/admin";
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/login/", "/admin/callback", "/admin/callback/"];

const STATIC_FILE_EXT = /\.(?:png|jpe?g|gif|webp|avif|svg|ico|css|js|mjs|ts|map|json|woff2?|ttf|eot|txt|xml|html|pdf)$/i;

export const onRequest = defineMiddleware(async (context, next) => {
	const { pathname } = context.url;

	// trailingSlash: "always" — redirect any directory-ish URL that is missing
	// the trailing slash (e.g. /admin → /admin/) before routing runs, otherwise
	// Astro renders a generic "Do you want to go to /admin/ instead?" help page.
	// Static files with extensions are left alone.
	if (!pathname.endsWith("/") && !STATIC_FILE_EXT.test(pathname)) {
		const target = pathname + "/" + context.url.search + context.url.hash;
		return context.redirect(target, 308);
	}

	if (!pathname.startsWith(ADMIN_PREFIX)) {
		return next();
	}

	if (!isSupabaseConfigured()) {
		return new Response(
			"The admin area is not configured. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY.",
			{ status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } },
		);
	}

	const supabase = getSessionClient(context.cookies);
	let user = null;
	try {
		const { data } = await supabase!.auth.getUser();
		user = data?.user ?? null;
	} catch {
		user = null;
	}

	context.locals.user = user;
	context.locals.supabase = supabase ?? null;

	const isPublicAdminPath = PUBLIC_ADMIN_PATHS.includes(pathname);

	if (!user && !isPublicAdminPath) {
		const redirectTo = encodeURIComponent(pathname + context.url.search);
		return context.redirect(`/admin/login/?next=${redirectTo}`, 302);
	}

	if (user && (pathname === "/admin/login" || pathname === "/admin/login/")) {
		return context.redirect("/admin/", 302);
	}

	const response = await next();

	response.headers.set("X-Robots-Tag", "noindex, nofollow");
	response.headers.set("Cache-Control", "private, no-store");
	return response;
});
