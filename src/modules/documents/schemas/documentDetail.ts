import { DocumentItemDirection, DocumentStatus, DocumentType } from 'src/common/enums';
import { TNullable } from 'src/common/utils/typebox/extensions';
import Type, { Static } from 'typebox';

export const documentItemSchema = Type.Object({
	id: Type.Optional(Type.Number()),
	itemId: Type.Number(),
	quantity: Type.String({ description: 'Decimal as string' }),
	direction: Type.Optional(Type.Enum(DocumentItemDirection)),
	price: Type.Optional(Type.String({ description: 'Decimal as string' })),
	item: Type.Object({
		id: Type.Number(),
		code: Type.String(),
		name: Type.String(),
		unit: Type.String(),
	}),
});

export type DocumentItemSchemaType = Static<typeof documentItemSchema>;

export const documentDetailSchema = Type.Object({
	id: Type.Number(),
	number: Type.String(),
	type: Type.Enum(DocumentType),
	status: Type.Enum(DocumentStatus),
	date: Type.String({ description: 'YYYY-MM-DD' }),
	author: Type.Object({
		firstname: Type.String(),
		lastname: Type.String(),
		middlename: TNullable(Type.String()),
	}),
	warehouseFromId: TNullable(Type.Number()),
	warehouseToId: TNullable(Type.Number()),
	supplierId: TNullable(Type.Number()),
	comment: Type.Optional(Type.String()),
	supplier: Type.Optional(
		Type.Object({
			id: Type.Number(),
			name: Type.String(),
		})
	),
	warehouseFrom: Type.Optional(
		Type.Object({
			id: Type.Number(),
			name: Type.String(),
		})
	),
	warehouseTo: Type.Optional(
		Type.Object({
			id: Type.Number(),
			name: Type.String(),
		})
	),
	items: Type.Array(documentItemSchema),
});

export type DocumentDetailSchemaType = Static<typeof documentDetailSchema>;
