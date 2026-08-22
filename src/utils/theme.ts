import type { ThemeConfig } from "../types/theme";

export type ColorVarName =
	| "--color-primary"
	| "--color-secondary"
	| "--color-accent"
	| "--color-background"
	| "--color-text"
	| "--color-heading"
	| "--color-link"
	| "--color-hover"
	| "--color-active"
	| "--color-error"
	| "--color-success"
	| "--color-muted";

export type ColorVars = Record<ColorVarName, string>;

export function getColorVars(data: ThemeConfig): ColorVars {
	return {
		"--color-primary": data.colors.primary,
		"--color-secondary": data.colors.secondary,
		"--color-accent": data.colors.accent,
		"--color-background": data.colors.background,
		"--color-text": data.colors.text,
		"--color-heading": data.colors.heading,
		"--color-link": data.colors.link,
		"--color-hover": data.colors.hover,
		"--color-active": data.colors.active,
		"--color-error": data.colors.error,
		"--color-success": data.colors.success,
		"--color-muted": data.colors.muted,
	};
}

export function getColorVarsCss(data: ThemeConfig): string {
	const declarations = Object.entries(getColorVars(data))
		.map(([name, value]) => `${name}: ${value};`)
		.join("");

	return `:root{${declarations}}`;
}
