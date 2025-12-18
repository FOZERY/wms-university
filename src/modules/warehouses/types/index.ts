import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { warehousesTable } from 'src/common/modules/drizzle/schema';

export type WarehouseDbType = InferSelectModel<typeof warehousesTable>;
export type WarehouseInsertDbType = InferInsertModel<typeof warehousesTable>;
