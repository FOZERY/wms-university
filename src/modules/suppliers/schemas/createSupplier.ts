import Type, { Static } from 'typebox';

export const createSupplierBodySchema = Type.Object({
	name: Type.String({ minLength: 1 }),
	inn: Type.Optional(Type.String()),
	contactPerson: Type.Optional(Type.String()),
	phone: Type.Optional(Type.String()),
	email: Type.Optional(Type.String({ format: 'email' })),
	address: Type.Optional(Type.String()),
});

export type CreateSupplierBodySchemaType = Static<typeof createSupplierBodySchema>;

export const createSupplierResponseSchema = Type.Object({
	id: Type.Number(),
});

export type CreateSupplierResponseSchemaType = Static<typeof createSupplierResponseSchema>;
