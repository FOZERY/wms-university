import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { documentsTable, documentItemsTable } from 'src/common/modules/drizzle/schema';

export type DocumentDbType = InferSelectModel<typeof documentsTable>;
export type DocumentInsertDbType = InferInsertModel<typeof documentsTable>;

export type DocumentItemDbType = InferSelectModel<typeof documentItemsTable>;
export type DocumentItemInsertDbType = InferInsertModel<typeof documentItemsTable>;
