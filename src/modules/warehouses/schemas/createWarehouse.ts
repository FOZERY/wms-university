import Type, { Static } from 'typebox';

export const createWarehouseBodySchema = Type.Object({
	name: Type.String({ minLength: 1 }),
	address: Type.Optional(Type.String()),
	capacity: Type.Optional(Type.Integer({ minimum: 0 })),
});

export type CreateWarehouseBodySchemaType = Static<typeof createWarehouseBodySchema>;

export const createWarehouseResponseSchema = Type.Object({
	id: Type.Number(),
});

export type CreateWarehouseResponseSchemaType = Static<typeof createWarehouseResponseSchema>;
