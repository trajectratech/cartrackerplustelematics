export function formatPhoneNumber(phone: string): string {
	const digits = phone.replace(/\D/g, "");

	if (digits.length === 13 && digits.startsWith("234")) {
		return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9, 13)}`;
	}

	if (digits.length === 11 && digits.startsWith("0")) {
		return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`;
	}

	return phone;
}
