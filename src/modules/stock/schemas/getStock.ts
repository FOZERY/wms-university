import { createLimitSchema, createOffsetSchema, createSortSchema } from 'src/common';
import { ItemType } from 'src/common/enums/item-type';
import Type, { Static } from 'typebox';

function createGetStockQueriesSchema<F extends boolean>(_noDefault: F) {
	return Type.Object({
		warehouseId: Type.Optional(Type.Integer()),
		itemId: Type.Optional(Type.Integer()),
		sort: createSortSchema(_noDefault, [
			'warehouseName',
			'itemName',
			'quantity',
			'reserved',
			'available',
		]),
		itemType: Type.Optional(Type.Enum(ItemType)),
		search: Type.Optional(Type.String({ minLength: 1 })),
		offset: createOffsetSchema(_noDefault),
		limit: createLimitSchema(_noDefault),
	});
}

export const getStockQueriesSchema = createGetStockQueriesSchema(true);

export type GetStockQueriesSchemaType = Static<typeof getStockQueriesSchema>;
export type GetStockQueriesSchemaPrivateType = Static<
	ReturnType<typeof createGetStockQueriesSchema<false>>
>;
