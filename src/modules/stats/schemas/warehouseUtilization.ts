import Type, { Static } from 'typebox';

export const allocationSchema = Type.Object({
	type: Type.Union([Type.Literal('material'), Type.Literal('product')]),
	occupied: Type.Number(),
});

export const warehouseUtilizationSchema = Type.Object({
	id: Type.Number(),
	name: Type.String(),
	capacity: Type.Number(),
	occupied: Type.Number(),
	free: Type.Number(),
	percentOccupied: Type.Number({ minimum: 0, maximum: 100 }),
	allocations: Type.Optional(Type.Array(allocationSchema)),
});

export type WarehouseUtilizationSchemaType = Static<typeof warehouseUtilizationSchema>;

export const warehouseUtilizationQueriesSchema = Type.Object({
	limit: Type.Optional(Type.Integer({ minimum: 1 })),
	offset: Type.Optional(Type.Integer({ minimum: 0 })),
	breakdown: Type.Optional(Type.Union([Type.Literal('none'), Type.Literal('type')])),
});

export type WarehouseUtilizationQueriesSchemaType = Static<
	typeof warehouseUtilizationQueriesSchema
>;
