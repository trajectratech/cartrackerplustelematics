/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{astro,js,ts,jsx,tsx,mdx}"],
	theme: {
		extend: {
			colors: {
				primary: "var(--color-primary)",
				secondary: "var(--color-secondary)",
				accent: "var(--color-accent)",
				background: "var(--color-background)",
				text: "var(--color-text)",
				heading: "var(--color-heading)",
				link: "var(--color-link)",
				hover: "var(--color-hover)",
				active: "var(--color-active)",
				error: "var(--color-error)",
				success: "var(--color-success)",
				muted: "var(--color-muted)",
			},
			keyframes: {
				"fade-in-up": {
					"0%": { opacity: 0, transform: "translateY(20px)" },
					"100%": { opacity: 1, transform: "translateY(0)" },
				},
				"fade-in": {
					"0%": { opacity: 0 },
					"100%": { opacity: 1 },
				},
			},
			animation: {
				"fade-in-up": "fade-in-up 0.6s ease-out",
				"fade-in": "fade-in 1s ease-out",
			},
		},
	},
	plugins: [
		function ({ addUtilities }) {
			addUtilities({
				".text-primary": {
					color: "var(--color-primary)",
				},
				".bg-primary": {
					backgroundColor: "var(--color-primary)",
				},
				".bg-background": {
					backgroundColor: "var(--color-background)",
				},
				".border-primary": {
					borderColor: "var(--color-primary)",
				},
			});
		},
	],
};
