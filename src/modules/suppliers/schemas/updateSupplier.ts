import Type, { Static } from 'typebox';

export const updateSupplierBodySchema = Type.Object({
	name: Type.Optional(Type.String({ minLength: 1 })),
	inn: Type.Optional(Type.String()),
	contactPerson: Type.Optional(Type.String()),
	phone: Type.Optional(Type.String()),
	email: Type.Optional(Type.String({ format: 'email' })),
	address: Type.Optional(Type.String()),
});

export type UpdateSupplierBodySchemaType = Static<typeof updateSupplierBodySchema>;

export const updateSupplierResponseSchema = Type.Object({
	id: Type.Number(),
});

export type UpdateSupplierResponseSchemaType = Static<typeof updateSupplierResponseSchema>;
