import { BadRequestException, Injectable } from '@nestjs/common';
import { asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { setOrderByColumn } from 'src/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { itemsTable, stockBalancesTable, warehousesTable } from 'src/common/modules/drizzle/schema';
import { firstOrNull } from 'src/common/utils/result.utils';
import { GetStockQueriesSchemaPrivateType } from './schemas/getStock';
import { StockBalanceSchemaType } from './schemas/stockBalance';

@Injectable()
export class StockService {
	public constructor(private readonly db: PostgresJsDatabase) {}

	public async getBalance(
		queries: GetStockQueriesSchemaPrivateType
	): Promise<StockBalanceSchemaType[]> {
		const { warehouseId, itemType, search, sort, offset, limit } = queries;
		const availableExpr = sql<string>`${stockBalancesTable.quantity} - ${stockBalancesTable.reserved}`;

		let query = this.db
			.select({
				warehouseId: stockBalancesTable.warehouseId,
				warehouseName: warehousesTable.name,
				itemId: stockBalancesTable.itemId,
				itemName: itemsTable.name,
				quantity: stockBalancesTable.quantity,
				reserved: stockBalancesTable.reserved,
				// Calculate available as quantity - reserved
				available: availableExpr,
			})
			.from(stockBalancesTable)
			.innerJoin(warehousesTable, eq(stockBalancesTable.warehouseId, warehousesTable.id))
			.innerJoin(itemsTable, eq(stockBalancesTable.itemId, itemsTable.id))
			.$dynamic();

		// Filters
		if (warehouseId) {
			query = query.where(eq(stockBalancesTable.warehouseId, warehouseId));
		}

		if (itemType) {
			query = query.where(eq(itemsTable.type, itemType));
		}

		if (search) {
			query = query.where(
				or(ilike(warehousesTable.name, `%${search}%`), ilike(itemsTable.name, `%${search}%`))
			);
		}

		// Apply sorting for real table columns using helper
		query = setOrderByColumn(query, warehousesTable.name, sort?.warehouseName);
		query = setOrderByColumn(query, itemsTable.name, sort?.itemName);
		query = setOrderByColumn(query, stockBalancesTable.quantity, sort?.quantity);
		query = setOrderByColumn(query, stockBalancesTable.reserved, sort?.reserved);

		// 'available' is a derived SQL expression, handle explicitly
		if (sort?.available) {
			query = query.orderBy(sort.available === 'desc' ? desc(availableExpr) : asc(availableExpr));
		}

		if (offset) query = query.offset(offset);
		if (limit) query = query.limit(limit);

		return await query;
	}

	public async adjustStock(
		warehouseId: number,
		itemId: number,
		quantity: string,
		type: 'increase' | 'decrease'
	): Promise<void> {
		// Get current balance or create if not exists
		const current = await this.db
			.select()
			.from(stockBalancesTable)
			.where(
				sql`${stockBalancesTable.warehouseId} = ${warehouseId} AND ${stockBalancesTable.itemId} = ${itemId}`
			)
			.limit(1)
			.then(firstOrNull);

		const quantityNum = parseFloat(quantity);
		if (Number.isNaN(quantityNum) || quantityNum <= 0) {
			throw new BadRequestException('Quantity must be a positive number');
		}

		if (current) {
			// Update existing balance
			const currentQty = parseFloat(current.quantity);
			const newQty = type === 'increase' ? currentQty + quantityNum : currentQty - quantityNum;

			if (newQty < 0) {
				throw new BadRequestException('Insufficient stock for decrease operation');
			}

			await this.db
				.update(stockBalancesTable)
				.set({
					quantity: newQty.toString(),
					lastUpdated: new Date(),
				})
				.where(
					sql`${stockBalancesTable.warehouseId} = ${warehouseId} AND ${stockBalancesTable.itemId} = ${itemId}`
				);
		} else {
			// Create new balance (only for increase)
			if (type === 'decrease') {
				throw new BadRequestException('Cannot decrease stock that does not exist');
			}

			await this.db.insert(stockBalancesTable).values({
				warehouseId,
				itemId,
				quantity: quantity,
				reserved: '0',
			});
		}
	}

	// Helper method to update stock when documents are processed
	public async updateStockFromDocument(
		warehouseId: number,
		itemId: number,
		quantity: string,
		operation: 'add' | 'subtract'
	): Promise<void> {
		const current = await this.db
			.select()
			.from(stockBalancesTable)
			.where(
				sql`${stockBalancesTable.warehouseId} = ${warehouseId} AND ${stockBalancesTable.itemId} = ${itemId}`
			)
			.limit(1)
			.then(firstOrNull);

		const quantityNum = parseFloat(quantity);

		if (current) {
			const currentQty = parseFloat(current.quantity);
			const newQty = operation === 'add' ? currentQty + quantityNum : currentQty - quantityNum;

			if (newQty < 0) {
				throw new BadRequestException('Insufficient stock');
			}

			await this.db
				.update(stockBalancesTable)
				.set({
					quantity: newQty.toString(),
					lastUpdated: new Date(),
				})
				.where(
					sql`${stockBalancesTable.warehouseId} = ${warehouseId} AND ${stockBalancesTable.itemId} = ${itemId}`
				);
		} else {
			if (operation === 'subtract') {
				throw new BadRequestException('Cannot subtract from non-existent stock');
			}

			await this.db.insert(stockBalancesTable).values({
				warehouseId,
				itemId,
				quantity: quantity,
				reserved: '0',
			});
		}
	}
}
