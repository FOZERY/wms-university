import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { itemsTable } from 'src/common/modules/drizzle/schema';

export type ItemDbType = InferSelectModel<typeof itemsTable>;
export type ItemInsertDbType = InferInsertModel<typeof itemsTable>;
export type ItemUpdateDbType = Partial<ItemInsertDbType>;
