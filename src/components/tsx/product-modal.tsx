import {
	createSignal,
	createEffect,
	Show,
	For,
	on,
	type Component,
} from "solid-js";

import type { Product } from "../../types/product";

interface ModalProps {
	product: Product;
	isOpen: boolean;
	onClose: () => void;
}

const ProductModal: Component<ModalProps> = ({ product, isOpen, onClose }) => {
	const [mainImage, setMainImage] = createSignal(product.imageUrl);
	const [visible, setVisible] = createSignal(false);
	let modalRef: HTMLDivElement | undefined;

	const images = product.images
		? [product.imageUrl, ...product.images]
		: [product.imageUrl];

	// Control body scroll
	createEffect(() => {
		if (isOpen) {
			const backToTopBtn = document.getElementById("back-to-top");
			if (backToTopBtn) backToTopBtn.style.display = "none";
			document.body.classList.add("overflow-hidden");
			setVisible(true);
			setTimeout(() => modalRef?.focus(), 10); // focus modal
		} else {
			setVisible(false);
			setTimeout(() => {
				document.body.classList.remove("overflow-hidden");
			}, 300);
		}
	});

	// Handle ESC key to close
	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Escape") handleClose();
	};

	// Focus trap (loop focus within modal)
	const trapFocus = (e: KeyboardEvent) => {
		if (!modalRef) return;
		const focusable = modalRef.querySelectorAll<HTMLElement>(
			'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])',
		);
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (e.key === "Tab") {
			if (e.shiftKey) {
				if (document.activeElement === first) {
					e.preventDefault();
					last.focus();
				}
			} else {
				if (document.activeElement === last) {
					e.preventDefault();
					first.focus();
				}
			}
		}
	};

	// Attach key handlers only when open
	createEffect(
		on(
			() => isOpen,
			(open) => {
				if (open) {
					window.addEventListener("keydown", handleKeyDown);
					window.addEventListener("keydown", trapFocus);
				} else {
					window.removeEventListener("keydown", handleKeyDown);
					window.removeEventListener("keydown", trapFocus);
				}
			},
		),
	);

	const handleClose = () => {
		setVisible(false);
		const backToTopBtn = document.getElementById("back-to-top");
		if (backToTopBtn) backToTopBtn.style.display = "block";
		document.body.classList.remove("overflow-hidden");
		setTimeout(() => {
			onClose();
		}, 300);
	};

	return (
		<Show when={isOpen}>
			<div
				class={`fixed inset-0 z-50 flex items-center justify-center px-2 sm:px-4 bg-[var(--color-primary)]/40 backdrop-blur-sm transition-opacity duration-300 ${
					visible()
						? "opacity-100 pointer-events-auto"
						: "opacity-0 pointer-events-none"
				}`}
			>
				<div
					ref={modalRef}
					tabindex="-1"
					role="dialog"
					aria-modal="true"
					aria-labelledby="modal-title"
					aria-describedby="modal-desc"
					class={`relative w-full max-w-4xl max-h-screen overflow-y-auto rounded-xl bg-[var(--color-background)] shadow-xl transform transition-all duration-300 ${
						visible() ? "scale-100" : "scale-95"
					} p-4 outline-none`}
				>
					{/* Close Button */}
					<button
						class="absolute top-3 right-4 text-xl font-bold text-[var(--color-primary)] hover:opacity-80 cursor-pointer"
						aria-label="Close modal"
						onClick={handleClose}
					>
						&times;
					</button>

					{/* Layout */}
					<div class="flex flex-col md:flex-row gap-4">
						{/* Left: Images */}
						<div class="w-full md:w-1/2 space-y-2">
							<img
								src={mainImage()}
								alt={product.title}
								class="w-full aspect-video object-cover rounded-md"
							/>
							<Show when={images?.length}>
								<div class="flex gap-2 overflow-x-auto">
									<For each={images}>
										{(img) => (
											<img
												src={img}
												alt="Product thumbnail"
												onClick={() => setMainImage(img)}
												class="w-12 h-12 sm:w-14 sm:h-14 rounded object-cover border-2 border-transparent hover:border-[var(--color-primary)] cursor-pointer"
											/>
										)}
									</For>
								</div>
							</Show>
						</div>

						{/* Right: Details */}
						<div class="w-full md:w-1/2 space-y-3 text-sm text-[var(--color-primary)]">
							<h2 id="modal-title" class="text-lg font-semibold">
								{product.title}
							</h2>
							<p id="modal-desc" class="text-xs opacity-80">
								{product.description}
							</p>

							<p class="text-base font-bold">
								&#8358;{product.price.toLocaleString()}
							</p>

							<div class="flex flex-wrap gap-2 text-xs opacity-90">
								<span>
									Brand: <strong>{product.brand}</strong>
								</span>
								<span>
									Category: <strong>{product.category}</strong>
								</span>
							</div>

							<Show when={product.tags?.length}>
								<div class="flex flex-wrap gap-1 text-[10px]">
									<For each={product.tags}>
										{(tag) => (
											<span class="bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-full">
												{tag}
											</span>
										)}
									</For>
								</div>
							</Show>

							<Show when={product.rating}>
								<p class="text-xs">
									⭐ {product.rating!.score} from {product.rating!.count}{" "}
									reviews
								</p>
							</Show>

							<Show when={product.reviews?.length}>
								<div class="space-y-1 text-xs">
									<h3 class="font-semibold">Top Review</h3>
									<For each={product.reviews!.slice(0, 1)}>
										{(r) => (
											<div class="border-t pt-1 border-[var(--color-primary)]/10 text-[11px]">
												<p class="font-medium">{r.name}</p>
												<p class="opacity-80">{r.comment}</p>
												<p class="text-[10px]">Rating: {r.rating}/5</p>
											</div>
										)}
									</For>
								</div>
							</Show>

							{/* Actions */}
							<div class="flex flex-col sm:flex-row gap-2 pt-2">
								<a
									href={product.actionUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="cursor-pointer flex-1 bg-[var(--color-primary)] text-[var(--color-background)] py-2 rounded-lg text-center text-sm font-semibold hover:scale-[1.02] transition"
								>
									{product.actionText || "Buy Now"}
								</a>
								<button
									onClick={handleClose}
									class="cursor-pointer flex-1 border border-[var(--color-primary)] text-[var(--color-primary)] py-2 rounded-lg text-sm font-medium hover:opacity-80"
								>
									Close
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Show>
	);
};

export default ProductModal;
