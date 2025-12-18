import Type, { Static } from 'typebox';

function createGetStockQueriesSchema<F extends boolean>(noDefault: F) {
	return Type.Object({
		warehouseId: Type.Optional(Type.Integer()),
	});
}

export const getStockQueriesSchema = createGetStockQueriesSchema(true);

export type GetStockQueriesSchemaType = Static<typeof getStockQueriesSchema>;
export type GetStockQueriesSchemaPrivateType = Static<
	ReturnType<typeof createGetStockQueriesSchema<false>>
>;
