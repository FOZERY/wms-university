import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { and, eq, ilike, or } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { setOrderByColumn, trimObject, UserRoles, UserSession } from 'src/common';
import { itemsTable } from 'src/common/modules/drizzle/schema';
import { firstOrNull, firstOrThrow } from 'src/common/utils/result.utils';
import { GetListQueriesSchemaPrivateType } from './schemas/getList';
import { ItemDbType, ItemInsertDbType } from './types';
import { ItemType } from 'src/common/enums/item-type';

@Injectable()
export class NomenclatureService {
	public constructor(private readonly db: PostgresJsDatabase) {}

	public async list(queries: GetListQueriesSchemaPrivateType): Promise<ItemDbType[]> {
		const { limit, offset, sort, search, type } = queries;

		let query = this.db
			.select()
			.from(itemsTable)
			.where(
				and(
					// if search provided, match either name OR code
					search
						? or(ilike(itemsTable.name, `%${search}%`), ilike(itemsTable.code, `%${search}%`))
						: undefined,
					type ? eq(itemsTable.type, type) : undefined
				)
			)
			.$dynamic();

		query = setOrderByColumn(query, itemsTable.id, sort.id);
		query = setOrderByColumn(query, itemsTable.code, sort.code);
		query = setOrderByColumn(query, itemsTable.name, sort.name);
		query = setOrderByColumn(query, itemsTable.type, sort.type);
		query = setOrderByColumn(query, itemsTable.minQuantity, sort.minQuantity);
		query = query.offset(offset).limit(limit);

		return await query;
	}

	public async getById(id: number): Promise<ItemDbType | null> {
		return await this.db
			.select()
			.from(itemsTable)
			.where(eq(itemsTable.id, id))
			.limit(1)
			.then(firstOrNull);
	}

	public async create(
		data: ItemInsertDbType,
		userSession: UserSession
	): Promise<{ id: ItemDbType['id'] }> {
		const exist = await this.db
			.select()
			.from(itemsTable)
			.where(eq(itemsTable.code, data.code))
			.then(firstOrNull);

		if (exist) {
			throw new ConflictException('Item with the same code already exists');
		}

		if (userSession.role !== UserRoles.Manager && data.type === ItemType.Product) {
			throw new ForbiddenException('Only managers can create product items');
		}

		const insert = await this.db
			.insert(itemsTable)
			.values({
				code: data.code,
				name: data.name,
				type: data.type,
				unit: data.unit,
				purchasePrice: data.purchasePrice ?? null,
				sellPrice: data.sellPrice ?? null,
				minQuantity: data.minQuantity ?? '0',
				description: data.description ?? null,
			})
			.returning({ id: itemsTable.id });

		return firstOrThrow(insert);
	}

	public async update(
		id: ItemDbType['id'],
		data: Partial<ItemInsertDbType>,
		userSession: UserSession
	): Promise<{ id: ItemDbType['id'] }> {
		// if code is provided, ensure uniqueness
		if (data.code) {
			const exist = await this.db
				.select()
				.from(itemsTable)
				.where(eq(itemsTable.code, data.code))
				.limit(1)
				.then(firstOrNull);

			if (exist && exist.id !== id) {
				throw new ConflictException('Item with the same code already exists');
			}
		}

		if (userSession.role !== UserRoles.Manager && data.type === ItemType.Product) {
			throw new ForbiddenException('Only managers can create product items');
		}

		const updated = await this.db
			.update(itemsTable)
			.set(trimObject(data))
			.where(eq(itemsTable.id, id))
			.returning({ id: itemsTable.id });

		return firstOrThrow(updated);
	}

	public async delete(id: ItemDbType['id']): Promise<void> {
		await this.db.delete(itemsTable).where(eq(itemsTable.id, id));
	}
}
