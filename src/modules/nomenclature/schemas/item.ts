import { TNullable } from 'src/common/utils/typebox/extensions';
import Type, { Static } from 'typebox';
import { ItemType } from 'src/common/enums/item-type';

export const itemSchema = Type.Object({
	id: Type.Number(),
	code: Type.String(),
	name: Type.String(),
	type: Type.Enum(ItemType),
	unit: Type.String(),
	purchasePrice: TNullable(Type.String()),
	sellPrice: TNullable(Type.String()),
	minQuantity: Type.String(),
	description: TNullable(Type.String()),
	createdAt: Type.Integer({ description: 'Epoch ms timestamp' }),
	updatedAt: Type.Integer({ description: 'Epoch ms timestamp' }),
});

export type ItemSchemaType = Static<typeof itemSchema>;
