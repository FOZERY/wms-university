import Type, { TArray, TInteger, TObject, TOptional } from 'typebox';

export type LimitSchemaType<F extends boolean> = F extends true ? TOptional<TInteger> : TInteger;

export type OffsetSchemaType<F extends boolean> = F extends true ? TOptional<TInteger> : TInteger;

export type PaginatedResultSchemaType<T extends TArray> = TObject<{
	data: T;
	total: TInteger;
}>;

/**
 * Создает схему для лимита
 * @param noDefault - если true, то поле limit будет опциональным, иначе - обязательным
 * @param params - параметры для настройки лимита
 * @returns схема для лимита
 */
export function createLimitSchema<F extends boolean>(
	noDefault: F,
	params?: {
		defaultLimit?: number;
		maxLimit?: number;
		minLimit?: number;
	}
): LimitSchemaType<F> {
	/* Устанавливаем значения по умолчанию и проверяем корректность */
	const minLimit = Math.max(params?.minLimit ?? 1, 1);
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	const defaultLimit = Math.max(params?.defaultLimit ?? 10, minLimit);
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	const maxLimit = Math.max(params?.maxLimit ?? 100, defaultLimit);

	const schema = Type.Integer({
		default: defaultLimit,
		description: 'Количество элементов на странице',
		example: defaultLimit,
		maximum: maxLimit,
		minimum: minLimit,
	});

	return noDefault ? Type.Optional(schema) : (schema as LimitSchemaType<F>);
}

/**
 * Создает схему для сдвига offset
 * @param noDefault - если true, то поле offset будет опциональным, иначе - обязательным
 * @returns схема для сдвига
 */
export function createOffsetSchema<F extends boolean>(noDefault: F): OffsetSchemaType<F> {
	const schema = Type.Integer({
		default: 0,
		description: 'Сдвиг',
		example: 0,
		minimum: 0,
	});
	return noDefault ? Type.Optional(schema) : (schema as OffsetSchemaType<F>);
}

/**
 * Создает схему для результата пагинации
 * @param dataSchema - схема для данных
 * @returns схема для результата пагинации
 */
export function createPaginatedResultSchema<T extends TArray>(
	dataSchema: T
): PaginatedResultSchemaType<T> {
	return Type.Object({
		data: dataSchema,
		total: Type.Integer({
			description: 'Общее количество элементов',
			example: 100,
		}),
	});
}
