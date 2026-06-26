export const supportedFonts = [
	"Inter",
	"Roboto",
	"Open Sans",
	"Lato",
	"Montserrat",
	"Poppins",
	"Playfair Display",
	"Merriweather",
	"Source Sans Pro",
	"Raleway",
	"Nunito",
	"Ubuntu",
	"Rubik",
	"Work Sans",
	"Fira Sans",
	"DM Sans",
	"Cabin",
	"Asap",
	"Titillium Web",
];

export const availableFonts: Record<string, number[]> = {
	Roboto: [100, 300, 400, 500, 700, 900],
	Poppins: [100, 200, 300, 400, 500, 600, 700, 800, 900],
	Inter: [100, 200, 300, 400, 500, 600, 700, 800, 900],
	"Open Sans": [300, 400, 600, 700, 800],
	Lato: [100, 300, 400, 700, 900],
	Montserrat: [100, 200, 300, 400, 500, 600, 700, 800, 900],
	"Playfair Display": [400, 500, 600, 700, 800, 900],
	Merriweather: [300, 400, 700, 900],
	"Source Sans Pro": [200, 300, 400, 600, 700, 900],
	Raleway: [100, 200, 300, 400, 500, 600, 700, 800, 900],
	Nunito: [200, 300, 400, 600, 700, 800, 900],
	Ubuntu: [300, 400, 500, 700],
	Rubik: [300, 400, 500, 700, 900],
	"Work Sans": [100, 200, 300, 400, 500, 600, 700, 800, 900],
	"Fira Sans": [100, 300, 400, 500, 700, 800, 900],
	"DM Sans": [400, 500, 700],
	Cabin: [400, 500, 600, 700],
	Asap: [400, 500, 600, 700],
	"Titillium Web": [200, 300, 400, 600, 700, 900],
};

export function getFontFamily(font: string): string {
	const defaultFont = "Inter";
	return supportedFonts.includes(font) ? font : defaultFont;
}
