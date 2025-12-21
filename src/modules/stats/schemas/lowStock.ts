import Type, { Static } from 'typebox';

export const lowStockItemSchema = Type.Object({
	id: Type.Number(),
	name: Type.String(),
	current: Type.Number({ description: 'Current quantity across all warehouses' }),
	min: Type.Number({ description: 'Minimum quantity threshold' }),
	unit: Type.Optional(Type.String()),
	warehouseId: Type.Optional(Type.Integer()),
});

export type LowStockItemSchemaType = Static<typeof lowStockItemSchema>;

export const lowStockQueriesSchema = Type.Object({
	limit: Type.Optional(Type.Integer({ minimum: 1 })),
	warehouseId: Type.Optional(Type.Integer()),
	onlyBelow: Type.Optional(Type.Boolean({ default: true })),
});

export type LowStockQueriesSchemaType = Static<typeof lowStockQueriesSchema>;
