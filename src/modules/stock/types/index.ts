import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { stockBalancesTable } from 'src/common/modules/drizzle/schema';

export type StockBalanceDbType = InferSelectModel<typeof stockBalancesTable>;
export type StockBalanceInsertDbType = InferInsertModel<typeof stockBalancesTable>;
