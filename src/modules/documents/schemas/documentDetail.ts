import { TNullable } from 'src/common/utils/typebox/extensions';
import Type, { Static } from 'typebox';

export const documentItemSchema = Type.Object({
	id: Type.Optional(Type.Number()),
	itemId: Type.Number(),
	quantity: Type.String({ description: 'Decimal as string' }),
	direction: Type.Optional(Type.Union([Type.Literal('in'), Type.Literal('out')])),
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
	userId: Type.String({ format: 'uuid' }),
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
