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
} from './schemas/warehouseUtilization';
import { StatsService } from './stats.service';

@Controller('stats')
@UseGuards(AuthGuard)
export class StatsController {
	public constructor(private readonly statsService: StatsService) {}

	@Get('warehouse-utilization')
	@ApiSwagger({
		response: {
			200: Type.Array(warehouseUtilizationSchema),
		},
	})
	public async getWarehouseUtilization(): Promise<WarehouseUtilizationSchemaType[]> {
		return await this.statsService.getWarehouseUtilization();
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
		response: {
			200: Type.Array(lowStockItemSchema),
		},
	})
	public async getLowStock(): Promise<LowStockItemSchemaType[]> {
		return await this.statsService.getLowStock();
	}
}
