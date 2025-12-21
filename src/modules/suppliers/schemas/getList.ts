import { createLimitSchema, createOffsetSchema } from 'src/common/schemas/pagination';
import { createSortSchema } from 'src/common/schemas/sort';
import Type, { Static } from 'typebox';

function createGetListQueriesSchema<F extends boolean>(noDefault: F) {
	return Type.Object({
		limit: createLimitSchema(noDefault),
		offset: createOffsetSchema(noDefault),
		sort: createSortSchema(noDefault, ['id', 'name', 'inn', 'phone', 'email']),
		// free-text search across several fields
		search: Type.Optional(Type.String({ minLength: 1 })),
	});
}

export const getListQueriesSchema = createGetListQueriesSchema(true);

export type GetListQueriesSchemaType = Static<typeof getListQueriesSchema>;
export type GetListQueriesSchemaPrivateType = Static<
	ReturnType<typeof createGetListQueriesSchema<false>>
>;
