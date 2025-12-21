import { ConflictException, Injectable } from '@nestjs/common';
import { eq, ilike, or } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { setOrderByColumn, trimObject } from 'src/common';
import { suppliersTable } from 'src/common/modules/drizzle/schema';
import { firstOrNull, firstOrThrow } from 'src/common/utils/result.utils';
import { GetListQueriesSchemaPrivateType } from './schemas/getList';
import { SupplierDbType, SupplierInsertDbType } from './types';

@Injectable()
export class SuppliersService {
	public constructor(private readonly db: PostgresJsDatabase) {}

	public async list(queries: GetListQueriesSchemaPrivateType) {
		const { limit, offset, sort, search } = queries;
		// Build query
		let query = this.db.select().from(suppliersTable).$dynamic();

		// Build filters: name + free-text search across multiple columns
		query = query.where(
			search
				? or(
						ilike(suppliersTable.name, `%${search}%`),
						ilike(suppliersTable.inn, `%${search}%`),
						ilike(suppliersTable.phone, `%${search}%`),
						ilike(suppliersTable.email, `%${search}%`)
					)
				: undefined
		);

		// Apply sorting
		query = setOrderByColumn(query, suppliersTable.id, sort.id);
		query = setOrderByColumn(query, suppliersTable.name, sort.name);
		query = setOrderByColumn(query, suppliersTable.inn, sort.inn);

		return await query.offset(offset).limit(limit);
	}

	public async getById(id: number) {
		return await this.db
			.select()
			.from(suppliersTable)
			.where(eq(suppliersTable.id, id))
			.limit(1)
			.then(firstOrNull);
	}

	public async create(data: SupplierInsertDbType): Promise<{ id: SupplierDbType['id'] }> {
		// Check if supplier with same name exists
		const exist = await this.db
			.select()
			.from(suppliersTable)
			.where(eq(suppliersTable.name, data.name))
			.then(firstOrNull);

		if (exist) {
			throw new ConflictException('Supplier with the same name already exists');
		}

		const insert = await this.db
			.insert(suppliersTable)
			.values({
				name: data.name,
				inn: data.inn ?? null,
				contactPerson: data.contactPerson ?? null,
				phone: data.phone ?? null,
				email: data.email ?? null,
				address: data.address ?? null,
			})
			.returning({ id: suppliersTable.id });

		return firstOrThrow(insert);
	}

	public async update(
		id: SupplierDbType['id'],
		data: Partial<SupplierInsertDbType>
	): Promise<{ id: SupplierDbType['id'] }> {
		// If name is provided, ensure uniqueness
		if (data.name) {
			const exist = await this.db
				.select()
				.from(suppliersTable)
				.where(eq(suppliersTable.name, data.name))
				.limit(1)
				.then(firstOrNull);

			if (exist && exist.id !== id) {
				throw new ConflictException('Supplier with the same name already exists');
			}
		}

		const updated = await this.db
			.update(suppliersTable)
			.set(trimObject(data))
			.where(eq(suppliersTable.id, id))
			.returning({ id: suppliersTable.id });

		return firstOrThrow(updated);
	}

	public async delete(id: SupplierDbType['id']): Promise<void> {
		await this.db.delete(suppliersTable).where(eq(suppliersTable.id, id));
	}
}
