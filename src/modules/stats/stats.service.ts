import { sql } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DocumentStatus } from 'src/common/enums/document-status';
import { DocumentType } from 'src/common/enums/document-type';
import {
	documentsTable,
	itemsTable,
	stockBalancesTable,
	warehousesTable,
} from 'src/common/modules/drizzle/schema';
import { DailyMovementSchemaType } from './schemas/dailyMovements';
import { LowStockItemSchemaType } from './schemas/lowStock';
import { WarehouseUtilizationSchemaType } from './schemas/warehouseUtilization';

export class StatsService {
	public constructor(private readonly db: PostgresJsDatabase) {}

	public async getWarehouseUtilization(): Promise<WarehouseUtilizationSchemaType[]> {
		// Get count of unique items per warehouse
		const results = await this.db
			.select({
				id: warehousesTable.id,
				name: warehousesTable.name,
				capacity: warehousesTable.capacity,
				currentCount: sql<number>`COUNT(DISTINCT ${stockBalancesTable.itemId})`,
			})
			.from(warehousesTable)
			.leftJoin(
				stockBalancesTable,
				sql`${warehousesTable.id} = ${stockBalancesTable.warehouseId} AND ${stockBalancesTable.quantity} > 0`
			)
			.groupBy(warehousesTable.id, warehousesTable.name, warehousesTable.capacity);

		return results.map((r) => ({
			id: r.id,
			name: r.name,
			capacity: r.capacity ?? 0,
			currentCount: Number(r.currentCount) || 0,
		}));
	}

	public async getDailyMovements(days: number = 14): Promise<DailyMovementSchemaType[]> {
		// Calculate date range
		const endDate = new Date();
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		// Get document counts grouped by date and type
		const results = await this.db
			.select({
				date: sql<string>`DATE(${documentsTable.date})`,
				type: documentsTable.type,
				count: sql<number>`COUNT(*)`,
			})
			.from(documentsTable)
			.where(
				sql`${documentsTable.date} >= ${startDate.toISOString().split('T')[0]} 
          AND ${documentsTable.date} <= ${endDate.toISOString().split('T')[0]}
          AND ${documentsTable.status} = ${DocumentStatus.Completed}`
			)
			.groupBy(sql`DATE(${documentsTable.date})`, documentsTable.type);

		// Group by date and create the structure
		const dailyData = new Map<string, DailyMovementSchemaType>();

		// Initialize all dates with zero counts
		for (let i = 0; i < days; i++) {
			const date = new Date(startDate);
			date.setDate(date.getDate() + i);
			const dateStr = date.toISOString().split('T')[0] || '';
			if (dateStr) {
				dailyData.set(dateStr, {
					date: dateStr,
					incoming: 0,
					transfer: 0,
					production: 0,
				});
			}
		}

		// Fill in actual counts
		for (const result of results) {
			const existing = dailyData.get(result.date);
			if (existing) {
				const count = Number(result.count) || 0;
				if (result.type === DocumentType.Incoming) {
					existing.incoming = count;
				} else if (result.type === DocumentType.Transfer) {
					existing.transfer = count;
				} else if (result.type === DocumentType.Production) {
					existing.production = count;
				}
			}
		}

		return Array.from(dailyData.values()).sort((a, b) => a.date.localeCompare(b.date));
	}

	public async getLowStock(): Promise<LowStockItemSchemaType[]> {
		// Get items where total quantity across all warehouses is below minimum
		const results = await this.db
			.select({
				id: itemsTable.id,
				name: itemsTable.name,
				minQuantity: itemsTable.minQuantity,
				totalQuantity: sql<string>`COALESCE(SUM(${stockBalancesTable.quantity}), '0')`,
			})
			.from(itemsTable)
			.leftJoin(stockBalancesTable, sql`${itemsTable.id} = ${stockBalancesTable.itemId}`)
			.groupBy(itemsTable.id, itemsTable.name, itemsTable.minQuantity)
			.having(
				sql`COALESCE(SUM(CAST(${stockBalancesTable.quantity} AS NUMERIC)), 0) < CAST(${itemsTable.minQuantity} AS NUMERIC)`
			);

		return results.map((r) => ({
			id: r.id,
			name: r.name,
			current: parseFloat(r.totalQuantity) || 0,
			min: parseFloat(r.minQuantity) || 0,
		}));
	}
}
