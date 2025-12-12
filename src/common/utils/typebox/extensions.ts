import Type, { TNull, TSchema, TUnion } from 'typebox';

// eslint-disable-next-line @typescript-eslint/naming-convention
export function TNullable<T extends TSchema>(T: T): TUnion<[T, TNull]> {
	return Type.Union([T, Type.Null()]);
}
