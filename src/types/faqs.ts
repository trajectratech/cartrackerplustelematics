export type FAQ = {
	question: string;
	answer: string;
};

export type FAQsSection = {
	heading: string;
	faqs: FAQ[];
};
