// components/LottiePlayer.tsx
import { onCleanup, onMount } from "solid-js";
import { createSignal } from "solid-js";
import lottie from "lottie-web";

interface Props {
	path: string;
}

export default function LottiePlayer(props: Props) {
	let containerRef: HTMLDivElement | undefined;

	onMount(() => {
		const anim = lottie.loadAnimation({
			container: containerRef!,
			renderer: "svg",
			loop: true,
			autoplay: true,
			path: props.path,
		});

		onCleanup(() => anim.destroy());
	});

	return (
		<div
			class="w-full h-full max-w-md mx-auto"
			ref={(el) => (containerRef = el)}
		/>
	);
}
