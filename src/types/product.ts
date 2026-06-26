export type Product = {
	id: string;
	title: string;
	description: string;
	brand?: string;
	category?: string;
	price: number;
	imageUrl: string;
	images?: string[]; // Optional: extra product images or 360° gallery
	rating?: {
		score: number;
		count: number;
	};
	reviews?: {
		name: string;
		comment: string;
		rating: number;
	}[];
	actionText: string;
	actionUrl: string;
	tags?: string[]; // Optional: for filtering (e.g. "audio", "accessories")
	sortKey?: {
		priceValue?: number; // For numeric price-based sorting
		ratingScore?: number; // For sorting by score
		popularityRank?: number; // For custom sort logic
	};
};
