import Type, { Static } from 'typebox';

export const stockBalanceSchema = Type.Object({
	warehouseId: Type.Number(),
	warehouseName: Type.String(),
	itemId: Type.Number(),
	itemName: Type.String(),
	quantity: Type.String({ description: 'Decimal as string' }),
	reserved: Type.String({ description: 'Decimal as string' }),
	available: Type.String({ description: 'Decimal as string' }),
});

export type StockBalanceSchemaType = Static<typeof stockBalanceSchema>;
