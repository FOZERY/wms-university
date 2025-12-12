import { TNullable } from 'src/common/utils/typebox/extensions';
import Type, { Static } from 'typebox';

// Drizzle returns `null` for nullable columns (not `undefined`).
// Therefore nullable fields must allow `null` in the schema.
export const supplierSchema = Type.Object({
	id: Type.Number(),
	name: Type.String(),
	// nullable fields from DB: use TNullable (string | null)
	inn: TNullable(Type.String()),
	contactPerson: TNullable(Type.String()),
	phone: TNullable(Type.String()),
	email: TNullable(Type.String()),
	address: TNullable(Type.String()),
	// timestamps are NOT NULL in schema.helpers timestamps
	// Returned as integer epoch milliseconds
	createdAt: Type.Integer({ description: 'Epoch ms timestamp' }),
	updatedAt: Type.Integer({ description: 'Epoch ms timestamp' }),
});

export type SupplierSchemaType = Static<typeof supplierSchema>;
