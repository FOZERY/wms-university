import { ItemType } from 'src/common/enums/item-type';
import Type, { Static } from 'typebox';

export const updateItemBodySchema = Type.Partial(
	Type.Object({
		code: Type.String({ minLength: 1 }),
		name: Type.String({ minLength: 1 }),
		type: Type.Enum(ItemType),
		unit: Type.String({ minLength: 1 }),
		purchasePrice: Type.Optional(Type.String()),
		sellPrice: Type.Optional(Type.String()),
		minQuantity: Type.Optional(Type.String()),
		description: Type.Optional(Type.String()),
	})
);

export const updateItemResponseSchema = Type.Object({
	id: Type.Integer(),
});

export type UpdateItemBodySchemaType = Static<typeof updateItemBodySchema>;
export type UpdateItemResponseSchemaType = Static<typeof updateItemResponseSchema>;
