import Type, { Static } from 'typebox';

export const createMaterialItemBodySchema = Type.Object({
	code: Type.String({ minLength: 1 }),
	name: Type.String({ minLength: 1 }),
	unit: Type.String({ minLength: 1 }),
	purchasePrice: Type.Optional(Type.String()),
	sellPrice: Type.Optional(Type.String()),
	minQuantity: Type.Optional(Type.String()),
	description: Type.Optional(Type.String()),
});

export const createMaterialItemResponseSchema = Type.Object({
	id: Type.Number(),
});

export type CreateMaterialItemBodySchemaType = Static<typeof createMaterialItemBodySchema>;
export type CreateMaterialItemResponseSchemaType = Static<typeof createMaterialItemResponseSchema>;
