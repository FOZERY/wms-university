import { ItemType } from 'src/common/enums/item-type';
import Type, { Static } from 'typebox';

export const createItemBodySchema = Type.Object({
	code: Type.String({ minLength: 1 }),
	name: Type.String({ minLength: 1 }),
	unit: Type.String({ minLength: 1 }),
	type: Type.Enum(ItemType),
	purchasePrice: Type.Optional(Type.String()),
	sellPrice: Type.Optional(Type.String()),
	minQuantity: Type.Optional(Type.String()),
	description: Type.Optional(Type.String()),
});

export const createItemResponseSchema = Type.Object({
	id: Type.Number(),
});

export type CreateItemBodySchemaType = Static<typeof createItemBodySchema>;
export type CreateItemResponseSchemaType = Static<typeof createItemResponseSchema>;
