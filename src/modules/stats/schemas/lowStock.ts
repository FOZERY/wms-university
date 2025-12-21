import Type, { Static } from 'typebox';

export const lowStockItemSchema = Type.Object({
	id: Type.Number(),
	name: Type.String(),
	current: Type.Number({ description: 'Current quantity across all warehouses' }),
	min: Type.Number({ description: 'Minimum quantity threshold' }),
});

export type LowStockItemSchemaType = Static<typeof lowStockItemSchema>;
