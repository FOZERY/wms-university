import { DocumentItemDirection, DocumentType } from 'src/common/enums';
import Type, { Static } from 'typebox';

const documentItemInputSchema = Type.Object({
	itemId: Type.Integer(),
	quantity: Type.String({ description: 'Decimal as string' }),
	direction: Type.Optional(Type.Enum(DocumentItemDirection)),
});

export const createDocumentBodySchema = Type.Object({
	type: Type.Enum(DocumentType),
	date: Type.Optional(Type.String({ description: 'YYYY-MM-DD' })),
	warehouseFromId: Type.Optional(Type.Integer()),
	warehouseToId: Type.Optional(Type.Integer()),
	supplierId: Type.Optional(Type.Integer()),
	comment: Type.Optional(Type.String()),
	items: Type.Array(documentItemInputSchema),
});

export type CreateDocumentBodySchemaType = Static<typeof createDocumentBodySchema>;
