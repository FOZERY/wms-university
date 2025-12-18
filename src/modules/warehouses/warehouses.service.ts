import { ConflictException } from '@nestjs/common';
import { eq, ilike } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { setOrderByColumn, trimObject } from 'src/common';
import { warehousesTable } from 'src/common/modules/drizzle/schema';
import { firstOrNull, firstOrThrow } from 'src/common/utils/result.utils';
import { GetListQueriesSchemaPrivateType } from './schemas/getList';
import { WarehouseDbType, WarehouseInsertDbType } from './types';

export class WarehousesService {
	public constructor(private readonly db: PostgresJsDatabase) {}

	public async list(queries: GetListQueriesSchemaPrivateType): Promise<WarehouseDbType[]> {
		const { limit, offset, sort, name } = queries;

		let query = this.db.select().from(warehousesTable).$dynamic();

		if (name) {
			query = query.where(ilike(warehousesTable.name, `%${name}%`));
		}

		query = setOrderByColumn(query, warehousesTable.id, sort.id);
		query = setOrderByColumn(query, warehousesTable.name, sort.name);

		return await query.offset(offset).limit(limit);
	}

	public async getById(id: number): Promise<WarehouseDbType | null> {
		return await this.db
			.select()
			.from(warehousesTable)
			.where(eq(warehousesTable.id, id))
			.limit(1)
			.then(firstOrNull);
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
