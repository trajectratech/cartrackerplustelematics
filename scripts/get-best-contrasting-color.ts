import chroma from "chroma-js";

export function getBestContrastingColor(
	baseColor: string,
	themeColors: Record<string, string>,
) {
	let bestContrast = 0;
	let bestColorName = "";
	let bestColorValue = "";

	for (const [name, value] of Object.entries(themeColors)) {
		const contrast = chroma.contrast(baseColor, value);
		if (contrast > bestContrast) {
			bestContrast = contrast;
			bestColorName = name;
			bestColorValue = value;
		}
	}

	return {
		name: bestColorName,
		value: bestColorValue,
		contrast: bestContrast,
	};
}

export function getBestTextColorForImage(imageColorHex: string) {
	const luminance = chroma(imageColorHex).luminance(); // 0 (black) to 1 (white)

	// You can adjust the threshold as needed
	return luminance > 0.5 ? "#000000" : "#FFFFFF";
}
