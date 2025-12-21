import { ConflictException, Injectable } from '@nestjs/common';
import { eq, ilike, or } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { setOrderByColumn, trimObject } from 'src/common';
import { warehousesTable, stockBalancesTable, itemsTable } from 'src/common/modules/drizzle/schema';
import { firstOrNull, firstOrThrow } from 'src/common/utils/result.utils';
import { GetListQueriesSchemaPrivateType } from './schemas/getList';
import { WarehouseDbType, WarehouseInsertDbType } from './types';
// cleaned accidental imports

@Injectable()
export class WarehousesService {
	public constructor(private readonly db: PostgresJsDatabase) {}

	public async list(queries: GetListQueriesSchemaPrivateType): Promise<WarehouseDbType[]> {
		const { limit, offset, sort, search } = queries;

		let query = this.db.select().from(warehousesTable).$dynamic();

		// free-text search across name and address
		if (search) {
			query = query.where(
				or(
					ilike(warehousesTable.name, `%${search}%`),
					ilike(warehousesTable.address, `%${search}%`)
				)
			);
		}

		query = setOrderByColumn(query, warehousesTable.id, sort.id);
		query = setOrderByColumn(query, warehousesTable.name, sort.name);

		return await query.offset(offset).limit(limit);
	}

	public async getById(id: number): Promise<WarehouseDbType | null> {
		const wh = await this.db
			.select()
			.from(warehousesTable)
			.where(eq(warehousesTable.id, id))
			.limit(1)
			.then(firstOrNull);

		if (!wh) return null;

		// Get stock balances for this warehouse (only quantity needed)
		const balances = await this.db
			.select({ itemId: stockBalancesTable.itemId, quantity: stockBalancesTable.quantity })
			.from(stockBalancesTable)
			.where(eq(stockBalancesTable.warehouseId, id));

		// Sum quantities (quantities may be strings)
		let totalQuantity = 0;
		for (const b of balances) {
			const qNum =
				typeof b.quantity === 'string' ? parseFloat(b.quantity) : Number(b.quantity ?? 0);
			totalQuantity += isNaN(qNum) ? 0 : qNum;
		}

		const totalItems = totalQuantity;

		// occupancy percent = (totalItems / capacity) * 100
		const capacityValue = wh.capacity ?? null;
		const occupancy =
			capacityValue && capacityValue > 0 ? Math.round((totalItems / capacityValue) * 100) : null;

		(wh as any).stats = {
			totalItems,
			occupancy,
		};

		return wh;
	}

	public async create(data: WarehouseInsertDbType): Promise<{ id: WarehouseDbType['id'] }> {
		// Check if warehouse with same name exists
		const exist = await this.db
			.select()
			.from(warehousesTable)
			.where(eq(warehousesTable.name, data.name))
			.then(firstOrNull);

		if (exist) {
			throw new ConflictException('Warehouse with the same name already exists');
		}

		const insert = await this.db
			.insert(warehousesTable)
			.values({
				name: data.name,
				address: data.address ?? null,
				capacity: data.capacity ?? null,
			})
			.returning({ id: warehousesTable.id });

		return firstOrThrow(insert);
	}

	public async update(
		id: WarehouseDbType['id'],
		data: Partial<WarehouseInsertDbType>
	): Promise<{ id: WarehouseDbType['id'] }> {
		// If name is provided, ensure uniqueness
		if (data.name) {
			const exist = await this.db
				.select()
				.from(warehousesTable)
				.where(eq(warehousesTable.name, data.name))
				.limit(1)
				.then(firstOrNull);

			if (exist && exist.id !== id) {
				throw new ConflictException('Warehouse with the same name already exists');
			}
		}

		const updated = await this.db
			.update(warehousesTable)
			.set(trimObject(data))
			.where(eq(warehousesTable.id, id))
			.returning({ id: warehousesTable.id });

		return firstOrThrow(updated);
	}

	public async delete(id: WarehouseDbType['id']): Promise<void> {
		await this.db.delete(warehousesTable).where(eq(warehousesTable.id, id));
	}
}
