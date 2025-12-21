import { createLimitSchema, createOffsetSchema, createSortSchema } from 'src/common';
import { DocumentStatus, DocumentType } from 'src/common/enums';
import { TNullable } from 'src/common/utils/typebox/extensions';
import Type, { Static } from 'typebox';

export const documentListItemSchema = Type.Object({
	id: Type.Number(),
	number: Type.String(),
	type: Type.Enum(DocumentType),
	status: Type.Enum(DocumentStatus),
	date: Type.String({ description: 'YYYY-MM-DD' }),
	warehouseFromId: TNullable(Type.Number()),
	warehouseToId: TNullable(Type.Number()),
	supplierId: TNullable(Type.Number()),
	author: Type.Object({
		firstname: Type.String(),
		lastname: Type.String(),
		middlename: TNullable(Type.String()),
	}),
});

export type DocumentListItemSchemaType = Static<typeof documentListItemSchema>;

export const createGetDocumentsQueriesSchema = <F extends boolean>(noDefault: F) =>
	Type.Object({
		type: Type.Optional(Type.Enum(DocumentType)),
		supplierId: Type.Optional(Type.Number()),
		warehouseId: Type.Optional(Type.Number()),
		status: Type.Optional(Type.Enum(DocumentStatus)),
		dateFrom: Type.Optional(Type.String({ description: 'YYYY-MM-DD' })),
		dateTo: Type.Optional(Type.String({ description: 'YYYY-MM-DD' })),
		// free-text search across document number and author name parts
		search: Type.Optional(Type.String({ minLength: 1 })),
		itemId: Type.Optional(Type.Number()),
		sort: createSortSchema(noDefault, ['id', 'date', 'number', 'type', 'status']),
		limit: createLimitSchema(noDefault),
		offset: createOffsetSchema(noDefault),
	});

export const getDocumentsQueriesSchema = createGetDocumentsQueriesSchema(true);
export const getDocumentsQueriesPrivateSchema = createGetDocumentsQueriesSchema(false);

export type GetDocumentsQueriesSchemaType = Static<typeof getDocumentsQueriesSchema>;
export type GetDocumentsQueriesSchemaPrivateType = Static<typeof getDocumentsQueriesPrivateSchema>;
