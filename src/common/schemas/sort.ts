import Type, { TLiteral, TObject, TOptional, TUnion } from 'typebox';

/**
 * Тип объекта сортировки для заданных полей
 */
export type SortObjectType<T extends string[]> = TObject<
	Record<T[number], TOptional<TUnion<[TLiteral<'asc'>, TLiteral<'desc'>]>>>
>;

/**
 * Тип для схемы сортировки
 */
export type SortSchemaType<T extends string[], F extends boolean> = F extends true
	? TOptional<SortObjectType<T>>
	: SortObjectType<T>;

/** 
  Создаем схему для сортировки
  @param noDefault - если true, то поле sort будет опциональным, иначе - обязательным
  @param fields - массив строк, представляющих поля, по которым можно сортировать
  @returns схема для сортировки
*/
export function createSortSchema<T extends string[], F extends boolean>(
	noDefault: F,
	fields: [...T]
): SortSchemaType<T, F> {
	const schema = Type.Object(
		fields.reduce(
			(acc, field) => {
				acc[field] = Type.Optional(Type.Union([Type.Literal('asc'), Type.Literal('desc')]));
				return acc;
			},
			{} as Record<T[number], TOptional<TUnion<[TLiteral<'asc'>, TLiteral<'desc'>]>>>
		),
		{
			additionalProperties: false,
			default: {},
			description: 'Параметры сортировки',
			example: fields.reduce(
				(acc, field) => ({
					// biome-ignore lint/performance/noAccumulatingSpread: true
					...acc,
					[field]: 'asc',
				}),
				{}
			),
			explode: true,
			style: 'deepObject',
		}
	);
	return noDefault ? Type.Optional(schema) : (schema as SortSchemaType<T, F>);
}
