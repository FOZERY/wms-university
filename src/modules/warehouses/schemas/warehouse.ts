import { TNullable } from 'src/common/utils/typebox/extensions';
import Type, { Static } from 'typebox';
import { documentListItemSchema } from 'src/modules/documents/schemas/getDocuments';

export const warehouseSchema = Type.Object({
	id: Type.Number(),
	name: Type.String(),
	address: TNullable(Type.String()),
	capacity: TNullable(Type.Integer()),
	createdAt: Type.Integer({ description: 'Epoch ms timestamp' }),
	updatedAt: Type.Integer({ description: 'Epoch ms timestamp' }),

	// aggregated stats for UI
	stats: Type.Optional(
		Type.Object({
			// total number of items on warehouse (sum of quantities)
			totalItems: Type.Number(),
			// occupancy percent: (totalItems / capacity) * 100
			occupancy: Type.Optional(Type.Number()),
		})
	),
});

export type WarehouseSchemaType = Static<typeof warehouseSchema>;
