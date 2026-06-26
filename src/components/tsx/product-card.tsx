import type { JSX } from "solid-js";
import type { Product } from "../types/product";

interface ProductCardProps {
	product: Product;
	onClick: () => void;
}

export default function ProductCard({
	product,
	onClick,
}: ProductCardProps): JSX.Element {
	const { title, price, imageUrl, actionText } = product;

	return (
		<div
			class="card cursor-pointer bg-[var(--color-background)] rounded-2xl border border-[var(--color-primary)]/10 shadow-md hover:shadow-xl transition duration-300 overflow-hidden group"
			onClick={onClick}
		>
			<img
				src={imageUrl}
				alt={title}
				class="w-full h-48 sm:h-56 object-cover transition-transform duration-300 group-hover:scale-105"
				loading="lazy"
			/>

			<div class="p-4 flex flex-col gap-2 sm:gap-3">
				<h3 class="text-base sm:text-lg font-semibold text-[var(--color-primary)] line-clamp-2">
					{title}
				</h3>

				<p class="text-lg sm:text-xl font-bold text-[var(--color-primary)]">
					₦{price.toLocaleString()}
				</p>

				<button
					class="w-full mt-1 sm:mt-2 bg-[var(--color-primary)] text-[var(--color-background)] py-2 px-4 rounded-xl text-sm font-semibold tracking-wide hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 transition cursor-pointer"
					type="button"
				>
					{actionText}
				</button>
			</div>
		</div>
	);
}
