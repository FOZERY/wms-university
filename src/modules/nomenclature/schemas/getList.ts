import { createLimitSchema, createOffsetSchema } from 'src/common/schemas/pagination';
import { createSortSchema } from 'src/common/schemas/sort';
import Type, { Static } from 'typebox';
import { ItemType } from 'src/common/enums/item-type';

function createGetListQueriesSchema<F extends boolean>(noDefault: F) {
	return Type.Object({
		limit: createLimitSchema(noDefault),
		offset: createOffsetSchema(noDefault),
		sort: createSortSchema(noDefault, ['id', 'code', 'name', 'type']),
		// free-text search across code and name
		search: Type.Optional(Type.String({ minLength: 1 })),
		type: Type.Optional(Type.Enum(ItemType)),
	});
}

export const getListQueriesSchema = createGetListQueriesSchema(true);

export type GetListQueriesSchemaType = Static<typeof getListQueriesSchema>;
export type GetListQueriesSchemaPrivateType = Static<
	ReturnType<typeof createGetListQueriesSchema<false>>
>;
