import Type, { Static } from 'typebox';

export const updateWarehouseBodySchema = Type.Object({
	name: Type.Optional(Type.String({ minLength: 1 })),
	address: Type.Optional(Type.String()),
	capacity: Type.Optional(Type.Integer({ minimum: 0 })),
});

export type UpdateWarehouseBodySchemaType = Static<typeof updateWarehouseBodySchema>;

export const updateWarehouseResponseSchema = Type.Object({
	id: Type.Number(),
});

export type UpdateWarehouseResponseSchemaType = Static<typeof updateWarehouseResponseSchema>;
