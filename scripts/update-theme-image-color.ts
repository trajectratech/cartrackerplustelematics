import sharp from "sharp";
import chroma from "chroma-js";
import fetch from "node-fetch"; // If using Node.js < 18, install with: npm i node-fetch

export async function getDominantColorFromUrl(imageUrl: string) {
	const response = await fetch(imageUrl);
	const buffer = await response.arrayBuffer();

	const { data } = await sharp(buffer)
		.resize(1, 1)
		.raw()
		.toBuffer({ resolveWithObject: true });

	const [r, g, b] = data;
	const hex = chroma.rgb(r, g, b).hex();

	return { rgb: [r, g, b], hex };
}
