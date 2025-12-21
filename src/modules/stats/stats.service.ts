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
import { LowStockItemSchemaType, LowStockQueriesSchemaType } from './schemas/lowStock';
import {
	WarehouseUtilizationSchemaType,
	WarehouseUtilizationQueriesSchemaType,
} from './schemas/warehouseUtilization';
import { Injectable } from '@nestjs/common';

@Injectable()
export class StatsService {
	public constructor(private readonly db: PostgresJsDatabase) {}

	public async getWarehouseUtilization(queries?: WarehouseUtilizationQueriesSchemaType): Promise<{
		overall: WarehouseUtilizationSchemaType[];
		summary: WarehouseUtilizationSchemaType[];
	}> {
		const { limit, offset, breakdown } = queries ?? {};

		// Sum occupied quantity per warehouse
		let q = this.db
			.select({
				id: warehousesTable.id,
				name: warehousesTable.name,
				capacity: warehousesTable.capacity,
				occupied: sql<number>`COALESCE(SUM(CAST(${stockBalancesTable.quantity} AS NUMERIC)), 0)`,
			})
			.from(warehousesTable)
			.leftJoin(stockBalancesTable, sql`${warehousesTable.id} = ${stockBalancesTable.warehouseId}`)
			.groupBy(warehousesTable.id, warehousesTable.name, warehousesTable.capacity)
			.$dynamic();

		if (typeof offset === 'number') q = q.offset(offset);
		if (typeof limit === 'number') q = q.limit(limit);

		const rows = await q;

		const mapped = rows.map((r) => {
			const cap = r.capacity ?? 0;
			const occupied = Number(r.occupied) || 0;
			const free = cap - occupied;
			const percent = cap > 0 ? (occupied / cap) * 100 : 0;
			return {
				id: r.id,
				name: r.name,
				capacity: cap,
				occupied,
				free,
				percentOccupied: Math.max(0, Math.min(100, Number(percent))),
				allocations: undefined as any,
			} as WarehouseUtilizationSchemaType;
		});

		// If breakdown requested, fetch allocations per warehouse by item type
		if (breakdown === 'type') {
			const allocs = await this.db
				.select({
					warehouseId: stockBalancesTable.warehouseId,
					type: itemsTable.type,
					occupied: sql<number>`COALESCE(SUM(CAST(${stockBalancesTable.quantity} AS NUMERIC)),0)`,
				})
				.from(stockBalancesTable)
				.innerJoin(itemsTable, sql`${stockBalancesTable.itemId} = ${itemsTable.id}`)
				.groupBy(stockBalancesTable.warehouseId, itemsTable.type);

			const map = new Map<number, Array<{ type: 'material' | 'product'; occupied: number }>>();
			for (const a of allocs) {
				const arr = map.get(a.warehouseId) ?? [];
				const t = String(a.type) as 'material' | 'product';
				arr.push({ type: t, occupied: Number(a.occupied) || 0 });
				map.set(a.warehouseId, arr);
			}

			for (const m of mapped) {
				m.allocations = map.get(m.id) ?? undefined;
			}
		}

		// Return both overall and summary arrays (both include all warehouses)
		return {
			overall: mapped,
			summary: mapped,
		};
	}

	public async getDailyMovements(days: number = 14): Promise<DailyMovementSchemaType[]> {
		// Calculate date range
		const endDate = new Date();
		const startDate = new Date();
		// include endDate in the range: startDate = endDate - (days - 1)
		startDate.setDate(startDate.getDate() - (days - 1));

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

	public async getLowStock(queries?: LowStockQueriesSchemaType): Promise<LowStockItemSchemaType[]> {
		const { limit, warehouseId, onlyBelow } = queries ?? {};

		// Build base selection: sum quantities (optionally by warehouse)
		const totalExpr = warehouseId
			? sql<string>`COALESCE(SUM(CAST(CASE WHEN ${stockBalancesTable.warehouseId} = ${warehouseId} THEN ${stockBalancesTable.quantity} ELSE 0 END AS NUMERIC)), '0')`
			: sql<string>`COALESCE(SUM(CAST(${stockBalancesTable.quantity} AS NUMERIC)), '0')`;

		let q = this.db
			.select({
				id: itemsTable.id,
				name: itemsTable.name,
				unit: itemsTable.unit,
				minQuantity: itemsTable.minQuantity,
				totalQuantity: totalExpr,
			})
			.from(itemsTable)
			.leftJoin(stockBalancesTable, sql`${itemsTable.id} = ${stockBalancesTable.itemId}`)
			.groupBy(itemsTable.id, itemsTable.name, itemsTable.unit, itemsTable.minQuantity)
			.$dynamic();

		if (onlyBelow !== false) {
			q = q.having(
				sql`COALESCE(SUM(CAST(${stockBalancesTable.quantity} AS NUMERIC)), 0) < CAST(${itemsTable.minQuantity} AS NUMERIC)`
			);
		}

		if (typeof limit === 'number') q = q.limit(limit);

		const rows = await q;

		return rows.map((r) => ({
			id: r.id,
			name: r.name,
			current: parseFloat(String(r.totalQuantity)) || 0,
			min: parseFloat(String(r.minQuantity)) || 0,
			unit: r.unit ?? undefined,
			warehouseId: warehouseId ?? undefined,
		}));
	}
}
