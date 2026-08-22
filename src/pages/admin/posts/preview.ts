import type { APIContext } from "astro";
import { renderMarkdown } from "../../../lib/markdown";

export const prerender = false;

export async function POST({ request }: APIContext) {
	const body = await request.text();

	return new Response(renderMarkdown(body ?? ""), {
		headers: {
			"Content-Type": "text/html; charset=utf-8",
			"Cache-Control": "no-store",
		},
	});
}
