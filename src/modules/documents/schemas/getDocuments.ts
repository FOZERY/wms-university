import { TNullable } from 'src/common/utils/typebox/extensions';
import Type, { Static } from 'typebox';

export const documentListItemSchema = Type.Object({
	id: Type.Number(),
	number: Type.String(),
	type: Type.Union([
		Type.Literal('incoming'),
		Type.Literal('transfer'),
		Type.Literal('production'),
	]),
	status: Type.Union([
		Type.Literal('draft'),
		Type.Literal('completed'),
		Type.Literal('cancelled'),
	]),
	date: Type.String({ description: 'YYYY-MM-DD' }),
	warehouseFromId: TNullable(Type.Number()),
	warehouseToId: TNullable(Type.Number()),
	supplierId: TNullable(Type.Number()),
	author: Type.Optional(
		Type.Object({
			id: Type.String({ format: 'uuid' }),
			login: Type.String(),
			firstname: Type.String(),
			lastname: Type.String(),
		})
	),
});

export type DocumentListItemSchemaType = Static<typeof documentListItemSchema>;

export const getDocumentsQueriesSchema = Type.Object({
	type: Type.Optional(
		Type.Union([Type.Literal('incoming'), Type.Literal('transfer'), Type.Literal('production')])
	),
	status: Type.Optional(
		Type.Union([Type.Literal('draft'), Type.Literal('completed'), Type.Literal('cancelled')])
	),
	dateFrom: Type.Optional(Type.String({ description: 'YYYY-MM-DD' })),
	dateTo: Type.Optional(Type.String({ description: 'YYYY-MM-DD' })),
});

export type GetDocumentsQueriesSchemaType = Static<typeof getDocumentsQueriesSchema>;
