const VERCEL_BYPASS_TOKEN = import.meta.env.VERCEL_BYPASS_TOKEN as string | undefined;
const PUBLIC_SITE_URL = import.meta.env.PUBLIC_SITE_URL as string | undefined;

export async function revalidateBlogPaths(paths: string[]): Promise<void> {
	if (!VERCEL_BYPASS_TOKEN || !PUBLIC_SITE_URL) return;

	const origin = PUBLIC_SITE_URL.replace(/\/$/, "");
	const unique = [...new Set(paths)];

	await Promise.all(
		unique.map(async (path) => {
			try {
				await fetch(`${origin}${path}`, {
					method: "HEAD",
					headers: { "x-prerender-revalidate": VERCEL_BYPASS_TOKEN },
				});
			} catch (error) {
				console.log(
					JSON.stringify({
						scope: "revalidate",
						event: "failed",
						path,
						message: (error as Error)?.message,
					}),
				);
			}
		}),
	);
}
