export function to32BitValidIn8Bit(value: number) {
	let seven = Math.round((value / 255) * 7);
	return Math.round((seven / 7) * 255);
}

export function to8Bit(value: number) {
	return Math.round((value / 255) * 7);
}

export function toBinary(value: number) {
	return value.toString(2).padStart(3, '0');
}