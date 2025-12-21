import { Controller, Get, UseGuards } from '@nestjs/common';
import { TypeboxQueries } from 'src/common';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { ApiSwagger } from 'src/common/swagger';
import Type from 'typebox';
import {
	dailyMovementSchema,
	DailyMovementSchemaType,
	dailyMovementsQueriesSchema,
	DailyMovementsQueriesSchemaType,
} from './schemas/dailyMovements';
import { lowStockItemSchema, LowStockItemSchemaType } from './schemas/lowStock';
import {
	warehouseUtilizationSchema,
	WarehouseUtilizationSchemaType,
	warehouseUtilizationQueriesSchema,
	WarehouseUtilizationQueriesSchemaType,
} from './schemas/warehouseUtilization';
import { lowStockQueriesSchema, LowStockQueriesSchemaType } from './schemas/lowStock';
import { StatsService } from './stats.service';

@Controller('stats')
@UseGuards(AuthGuard)
export class StatsController {
	public constructor(private readonly statsService: StatsService) {}

	@Get('warehouse-utilization')
	@ApiSwagger({
		request: { queries: warehouseUtilizationQueriesSchema },
		response: {
			200: Type.Ref(require('./schemas/warehouseUtilization').warehouseUtilizationResponseSchema),
		},
	})
	public async getWarehouseUtilization(
		@TypeboxQueries(warehouseUtilizationQueriesSchema)
		queries: WarehouseUtilizationQueriesSchemaType
	) {
		return await this.statsService.getWarehouseUtilization(queries);
	}

	@Get('daily-movements')
	@ApiSwagger({
		request: {
			queries: dailyMovementsQueriesSchema,
		},
		response: {
			200: Type.Array(dailyMovementSchema),
		},
	})
	public async getDailyMovements(
		@TypeboxQueries(dailyMovementsQueriesSchema) queries: DailyMovementsQueriesSchemaType
	): Promise<DailyMovementSchemaType[]> {
		return await this.statsService.getDailyMovements(queries.days ?? 14);
	}

	@Get('low-stock')
	@ApiSwagger({
		request: { queries: lowStockQueriesSchema },
		response: {
			200: Type.Array(lowStockItemSchema),
		},
	})
	public async getLowStock(
		@TypeboxQueries(lowStockQueriesSchema) queries: LowStockQueriesSchemaType
	): Promise<LowStockItemSchemaType[]> {
		return await this.statsService.getLowStock(queries);
	}
}
