import Type, { Static } from 'typebox';

export const warehouseUtilizationSchema = Type.Object({
	id: Type.Number(),
	name: Type.String(),
	capacity: Type.Number(),
	currentCount: Type.Number(),
});

export type WarehouseUtilizationSchemaType = Static<typeof warehouseUtilizationSchema>;
