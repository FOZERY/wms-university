import { eq, ilike } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { setOrderByColumn } from 'src/common';
import { suppliersTable } from 'src/common/modules/drizzle/schema';
import { firstOrNull } from 'src/common/utils/result.utils';
import { GetListQueriesSchemaPrivateType } from './schemas/getList';

export class SuppliersService {
	public constructor(private readonly db: PostgresJsDatabase) {}

	public async list(queries: GetListQueriesSchemaPrivateType) {
		const { limit, offset, sort, name } = queries;
		// Build query
		let query = this.db.select().from(suppliersTable).$dynamic();

		// Filter by name if provided
		if (name) {
			query = query.where(ilike(suppliersTable.name, `%${name}%`));
		}

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
}
