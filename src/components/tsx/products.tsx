import type { JSX } from "solid-js";
import { createSignal, createMemo, For, Show } from "solid-js";
import { Motion } from "solid-motionone";

import ProductCard from "./product-card";
import ProductModal from "./product-modal";
import type { Product } from "../../types/product";

interface Props {
	products: Product[];
	heading: string;
}

type SortOption = "priceAsc" | "priceDesc" | "ratingAsc" | "ratingDesc";

export default function Products({ products, heading }: Props): JSX.Element {
	const [searchQuery, setSearchQuery] = createSignal("");
	const [sortOption, setSortOption] = createSignal<SortOption>("priceAsc");
	const [selectedTags, setSelectedTags] = createSignal<string[]>([]);
	const [selectedProduct, setSelectedProduct] = createSignal<Product | null>(
		null,
	);

	const allTags = Array.from(new Set(products.flatMap((p) => p.tags || [])));

	const filteredProducts = createMemo(() => {
		let _products = [...(products || [])];

		// Search filter
		if (searchQuery()) {
			const query = searchQuery().toLowerCase();
			_products = products.filter(
				(p) =>
					p.title.toLowerCase().includes(query) ||
					p.description?.toLowerCase().includes(query),
			);
		}

		// Tag filter
		if (selectedTags().length > 0) {
			_products = products.filter((p) =>
				p.tags?.some((tag) => selectedTags().includes(tag)),
			);
		}

		// Sorting
		_products.sort((a, b) => {
			switch (sortOption()) {
				case "priceAsc":
					return a.price - b.price;
				case "priceDesc":
					return b.price - a.price;
				case "ratingAsc":
					return (a.rating?.score ?? 0) - (b.rating?.score ?? 0);
				case "ratingDesc":
					return (b.rating?.score ?? 0) - (a.rating?.score ?? 0);
			}
		});

		return _products;
	});

	const toggleTag = (tag: string) => {
		const current = selectedTags();
		setSelectedTags(
			current.includes(tag)
				? current.filter((t) => t !== tag)
				: [...current, tag],
		);
	};

	return (
		<main class="px-4 py-6 md:px-8 lg:px-16 scrolling-section">
			{heading && (
				<h2 class="text-4xl sm:text-5xl font-extrabold text-center mb-8 text-[var(--color-heading)]">
					{heading}
				</h2>
			)}

			<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div class="flex flex-col sm:flex-row sm:items-center gap-3">
					<input
						type="text"
						placeholder="Search products..."
						value={searchQuery()}
						onInput={(e) => setSearchQuery(e.currentTarget.value)}
						class="px-4 py-2 rounded border border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] w-full sm:w-auto"
					/>

					<div class="flex flex-col gap-1">
						<label class="text-sm font-medium text-gray-600">Sort by</label>
						<select
							value={sortOption()}
							onChange={(e) =>
								setSortOption(e.currentTarget.value as SortOption)
							}
							class="px-4 py-2 rounded-lg border border-[var(--color-primary)] bg-white text-sm text-gray-700 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] hover:border-[var(--color-primary)]"
						>
							<option value="priceAsc">Price: Low to High</option>
							<option value="priceDesc">Price: High to Low</option>
							<option value="ratingAsc">Rating: Low to High</option>
							<option value="ratingDesc">Rating: High to Low</option>
						</select>
					</div>
				</div>
			</div>

			<div class="my-4">
				<Show when={allTags.length > 0}>
					<div class="flex flex-wrap gap-2">
						<For each={allTags}>
							{(tag) => (
								<button
									onClick={() => toggleTag(tag)}
									class={`cursor-pointer px-3 py-1 rounded-full border text-sm hover:bg-[var(--color-primary)] hover:text-[var(--color-background)] ${
										selectedTags().includes(tag)
											? "bg-[var(--color-primary)] text-[var(--color-background)]"
											: "border[var(--color-primary)] text-[var(--color-primary)]"
									}`}
								>
									{tag}
								</button>
							)}
						</For>
					</div>
				</Show>
			</div>

			<Show
				when={filteredProducts().length > 0}
				fallback={<p class="text-center text-gray-500">No products found.</p>}
			>
				<Motion.section
					initial={{ opacity: 0, x: -30 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.6 }}
					class="
					flex gap-4 overflow-x-auto px-2 py-4 scroll-smooth scroll-px-4 
					snap-x snap-mandatory 
					scrollbar-thin scrollbar-thumb-[#999]/50 scrollbar-track-transparent
					sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 
					sm:overflow-x-visible
					"
				>
					<For each={filteredProducts()}>
						{(product) => (
							<Motion.div
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6 }}
								class="flex-shrink-0 w-[80%] snap-start sm:w-auto"
							>
								<ProductCard
									product={product}
									onClick={() => setSelectedProduct(product)}
								/>
							</Motion.div>
						)}
					</For>
				</Motion.section>
			</Show>

			{selectedProduct() && (
				<ProductModal
					isOpen={!!selectedProduct()}
					product={selectedProduct() as Product}
					onClose={() => setSelectedProduct(null)}
				/>
			)}
		</main>
	);
}
