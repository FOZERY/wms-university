export function firstOrNull<T>(arr: T[]): T | null {
	return arr[0] ?? null;
}

export function firstOrThrow<T>(arr: T[]): T {
	if (!arr[0]) {
		throw new Error('Array is empty');
	}
	return arr[0];
}

export function assertDefined<T>(value: T | undefined, message?: string): asserts value is T {
	if (value === undefined) {
		throw new Error(message || 'Value should be defined');
	}
}
