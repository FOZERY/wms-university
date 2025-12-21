import { Static } from 'typebox';

// Swagger expects a schema object for binary responses.
export const getDocumentPdfResponseSchema = {
	type: 'string',
	format: 'binary',
	description: 'PDF file for the document',
};

export type GetDocumentPdfResponseSchemaType = Buffer;
