export const toCents = (value: string): number => {
	const [whole, decimal = ""] = value.split(".");

	const paddedDecimal = decimal.padEnd(2, "0").slice(0, 2);

	return Number(whole) * 100 + Number(paddedDecimal);
};

export const fromCents = (cents: number): string => {
	return (cents / 100).toFixed(2);
};
