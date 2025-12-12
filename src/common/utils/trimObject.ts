/**
 * Очищает объект от undefined (+null) значений
 * - без рекурсивного прохода по свойствам объекта
 */
export function trimObject<T extends object>(data: T, trimNull?: boolean): T {
	return Object.entries(data).reduce((memo, [key, value]) => {
		if (value === undefined) return memo;

		if (trimNull && value === null) return memo;

		// biome-ignore lint/performance/noAccumulatingSpread: need
		Object.assign(memo, { [key]: value });

		return memo;
	}, {}) as T;
}
