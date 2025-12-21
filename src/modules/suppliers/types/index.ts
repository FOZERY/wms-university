import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { suppliersTable } from 'src/common/modules/drizzle/schema';

export type SupplierDbType = InferSelectModel<typeof suppliersTable>;
export type SupplierInsertDbType = InferInsertModel<typeof suppliersTable>;
