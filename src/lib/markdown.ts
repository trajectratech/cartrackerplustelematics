function escapeHtml(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function renderInline(text: string) {
	return (
		text
			.replace(/`([^`]+)`/g, "<code>$1</code>")
			.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
			.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
			.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (match, alt, src) => {
				if (!/^(https?:\/\/|\/)/i.test(src)) return alt;
				return `<img src="${src}" alt="${alt}" loading="lazy" decoding="async" class="mt-6 w-full rounded-[1.2rem]" />`;
			})
			.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label, href) => {
				const safe = /^(https?:\/\/|mailto:|\/)/i.test(href);
				if (!safe) return label;
				const isExternal = /^https?:\/\//i.test(href);
				const rel = isExternal ? ' target="_blank" rel="noopener noreferrer"' : "";
				return `<a href="${href}"${rel}>${label}</a>`;
			})
	);
}

const HEADING_CLASS: Record<number, string> = {
	2: "mt-10 text-2xl font-bold tracking-[-0.04em] text-[var(--color-heading)]",
	3: "mt-8 text-xl font-bold tracking-[-0.03em] text-[var(--color-heading)]",
	4: "mt-6 text-lg font-semibold text-[var(--color-heading)]",
};

export function renderMarkdown(markdown: string): string {
	const source = escapeHtml(markdown.replace(/\r\n/g, "\n"));
	const lines = source.split("\n");
	const html: string[] = [];

	let paragraph: string[] = [];
	let listItems: string[] = [];
	let listType: "ul" | "ol" | null = null;
	let quote: string[] = [];

	const flushParagraph = () => {
		if (paragraph.length === 0) return;
		html.push(
			`<p class="mt-5 text-base leading-8 text-[var(--color-text-muted)]">${renderInline(paragraph.join(" "))}</p>`,
		);
		paragraph = [];
	};

	const flushList = () => {
		if (listItems.length === 0 || !listType) return;
		const cls = listType === "ul" ? "check-list mt-6" : "mt-6 grid list-decimal gap-3 pl-6";
		const itemCls = listType === "ul" ? "list-check" : "text-base leading-8 text-[var(--color-text-muted)]";
		html.push(
			`<${listType} class="${cls}">${listItems.map((item) => `<li class="${itemCls}">${renderInline(item)}</li>`).join("")}</${listType}>`,
		);
		listItems = [];
		listType = null;
	};

	const flushQuote = () => {
		if (quote.length === 0) return;
		html.push(
			`<blockquote class="mt-6 border-l-4 pl-5 text-base italic leading-8 text-[var(--color-text-muted)]" style="border-color: var(--color-primary);">${renderInline(quote.join(" "))}</blockquote>`,
		);
		quote = [];
	};

	const flushAll = () => {
		flushParagraph();
		flushList();
		flushQuote();
	};

	for (const line of lines) {
		const trimmed = line.trim();

		if (!trimmed) {
			flushAll();
			continue;
		}

		const heading = trimmed.match(/^(#{2,4})\s+(.*)$/);
		if (heading) {
			flushAll();
			const level = heading[1].length;
			html.push(
				`<h${level} class="${HEADING_CLASS[level]}">${renderInline(heading[2])}</h${level}>`,
			);
			continue;
		}

		const bullet = trimmed.match(/^[-*]\s+(.*)$/);
		if (bullet) {
			flushParagraph();
			flushQuote();
			if (listType && listType !== "ul") flushList();
			listType = "ul";
			listItems.push(bullet[1]);
			continue;
		}

		const numbered = trimmed.match(/^\d+\.\s+(.*)$/);
		if (numbered) {
			flushParagraph();
			flushQuote();
			if (listType && listType !== "ol") flushList();
			listType = "ol";
			listItems.push(numbered[1]);
			continue;
		}

		const quoted = trimmed.match(/^>\s?(.*)$/);
		if (quoted) {
			flushParagraph();
			flushList();
			quote.push(quoted[1]);
			continue;
		}

		flushList();
		flushQuote();
		paragraph.push(trimmed);
	}

	flushAll();
	return html.join("\n");
}

export function renderCommentBody(body: string): string {
	return escapeHtml(body).replace(/\n/g, "<br />");
}
