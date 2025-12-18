import Type, { Static } from 'typebox';

export const adjustStockBodySchema = Type.Object({
	warehouseId: Type.Integer(),
	itemId: Type.Integer(),
	quantity: Type.String({ description: 'Decimal as string' }),
	type: Type.Union([Type.Literal('increase'), Type.Literal('decrease')]),
	reason: Type.String({ minLength: 1 }),
});

export type AdjustStockBodySchemaType = Static<typeof adjustStockBodySchema>;
