import { TNullable } from 'src/common/utils/typebox/extensions';
import Type, { Static } from 'typebox';

export const warehouseSchema = Type.Object({
	id: Type.Number(),
	name: Type.String(),
	address: TNullable(Type.String()),
	capacity: TNullable(Type.Integer()),
	createdAt: Type.Integer({ description: 'Epoch ms timestamp' }),
	updatedAt: Type.Integer({ description: 'Epoch ms timestamp' }),
});

export type WarehouseSchemaType = Static<typeof warehouseSchema>;
