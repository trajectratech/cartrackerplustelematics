// src/components/ProductGallery.tsx
import { createSignal, Show, For } from "solid-js";
import type { Component } from "solid-js";
import type { Product } from "../../types/product";

interface Props {
	products: Product[];
}

const ProductGallery: Component<Props> = (props) => {
	const [selectedProduct, setSelectedProduct] = createSignal<Product | null>(
		null,
	);

	const handleProductClick = (product: Product) => {
		setSelectedProduct(product);
	};

	const closeModal = () => {
		setSelectedProduct(null);
	};

	return (
		<div>
			<section class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
				<For each={props.products}>
					{(product) => (
						<div
							class="cursor-pointer border rounded-lg p-4 hover:shadow-lg transition"
							onClick={() => handleProductClick(product)}
						>
							<h3 class="font-semibold">{product.title}</h3>
							<p class="text-sm">{product.description}</p>
						</div>
					)}
				</For>
			</section>

			<Show when={selectedProduct()}>
				<div
					class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
					onClick={closeModal}
				>
					<div
						class="bg-white max-w-md w-full p-6 rounded-lg relative"
						onClick={(e) => e.stopPropagation()}
					>
						<h2 class="text-xl font-bold">{selectedProduct()!.title}</h2>
						<p>{selectedProduct()!.description}</p>
						<button class="absolute top-2 right-2 text-sm" onClick={closeModal}>
							✕
						</button>
					</div>
				</div>
			</Show>
		</div>
	);
};

export default ProductGallery;
