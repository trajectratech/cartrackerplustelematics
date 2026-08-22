import { createServerClient, createBrowserClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const PUBLIC_SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const PUBLIC_SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;

export function isSupabaseConfigured() {
	return Boolean(PUBLIC_SUPABASE_URL && PUBLIC_SUPABASE_ANON_KEY);
}

export function isAdminConfigured() {
	return Boolean(isSupabaseConfigured() && SUPABASE_SERVICE_ROLE_KEY);
}

export function getPublicClient(): SupabaseClient | null {
	if (!isSupabaseConfigured()) return null;
	return createClient(PUBLIC_SUPABASE_URL!, PUBLIC_SUPABASE_ANON_KEY!, {
		auth: { persistSession: false, autoRefreshToken: false },
	});
}

export function getAdminClient(): SupabaseClient | null {
	if (!isAdminConfigured()) return null;
	return createClient(PUBLIC_SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
		auth: { persistSession: false, autoRefreshToken: false },
	});
}

export function getSessionClient(
	cookies: {
		get(name: string): { value: string } | undefined;
		set(name: string, value: string, options?: CookieOptions): void;
		delete(name: string, options?: CookieOptions): void;
	},
): SupabaseClient | null {
	if (!isSupabaseConfigured()) return null;

	return createServerClient(PUBLIC_SUPABASE_URL!, PUBLIC_SUPABASE_ANON_KEY!, {
		cookies: {
			get: (name) => cookies.get(name)?.value,
			set: (name, value, options) =>
				cookies.set(name, value, {
					...options,
					path: "/",
					httpOnly: true,
					secure: import.meta.env.PROD,
					sameSite: "lax",
				}),
			remove: (name, options) => cookies.delete(name, { ...options, path: "/" }),
		},
	});
}

export function getClientSideClient() {
	if (!isSupabaseConfigured()) return null;
	return createBrowserClient(PUBLIC_SUPABASE_URL!, PUBLIC_SUPABASE_ANON_KEY!);
}

export function getMediaUrl(
	path: string | null | undefined,
	options?: { width?: number; quality?: number },
) {
	if (!path || !PUBLIC_SUPABASE_URL) return null;
	if (path.startsWith("/") || path.startsWith("http")) return path;

	const base = PUBLIC_SUPABASE_URL.replace(/\/$/, "");
	if (!options?.width) {
		return `${base}/storage/v1/object/public/blog-media/${path}`;
	}

	const params = new URLSearchParams({
		width: String(options.width),
		quality: String(options.quality ?? 75),
		resize: "contain",
	});
	return `${base}/storage/v1/render/image/public/blog-media/${path}?${params}`;
}

export const IMAGE_WIDTHS = [320, 480, 640, 960, 1280, 1600] as const;

export function getMediaSrcSet(path: string | null | undefined) {
	if (!path) return undefined;
	if (path.startsWith("/") || path.startsWith("http")) return undefined;
	return IMAGE_WIDTHS.map((width) => `${getMediaUrl(path, { width })} ${width}w`).join(", ");
}
