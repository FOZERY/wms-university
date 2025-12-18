import { BadRequestException } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { itemsTable, stockBalancesTable, warehousesTable } from 'src/common/modules/drizzle/schema';
import { firstOrNull } from 'src/common/utils/result.utils';
import { StockBalanceSchemaType } from './schemas/stockBalance';

export class StockService {
	public constructor(private readonly db: PostgresJsDatabase) {}

	public async getBalance(warehouseId?: number): Promise<StockBalanceSchemaType[]> {
		let query = this.db
			.select({
				warehouseId: stockBalancesTable.warehouseId,
				warehouseName: warehousesTable.name,
				itemId: stockBalancesTable.itemId,
				itemName: itemsTable.name,
				quantity: stockBalancesTable.quantity,
				reserved: stockBalancesTable.reserved,
				// Calculate available as quantity - reserved
				available: sql<string>`${stockBalancesTable.quantity} - ${stockBalancesTable.reserved}`,
			})
			.from(stockBalancesTable)
			.innerJoin(warehousesTable, eq(stockBalancesTable.warehouseId, warehousesTable.id))
			.innerJoin(itemsTable, eq(stockBalancesTable.itemId, itemsTable.id))
			.$dynamic();

		if (warehouseId) {
			query = query.where(eq(stockBalancesTable.warehouseId, warehouseId));
		}

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
