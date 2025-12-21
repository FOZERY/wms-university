import { Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { TypeboxBody, TypeboxQueries } from 'src/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from 'src/common/enums/roles';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ApiSwagger } from 'src/common/swagger';
import Type from 'typebox';
import { adjustStockBodySchema, AdjustStockBodySchemaType } from './schemas/adjustStock';
import { getStockQueriesSchema, GetStockQueriesSchemaPrivateType } from './schemas/getStock';
import { stockBalanceSchema, StockBalanceSchemaType } from './schemas/stockBalance';
import { StockService } from './stock.service';

@Controller('stock')
@UseGuards(AuthGuard, RolesGuard)
export class StockController {
	public constructor(private readonly stockService: StockService) {}

	@Get()
	@ApiSwagger({
		request: {
			queries: getStockQueriesSchema,
		},
		response: {
			200: Type.Array(stockBalanceSchema),
		},
	})
	public async getBalance(
		@TypeboxQueries(getStockQueriesSchema) queries: GetStockQueriesSchemaPrivateType
	): Promise<StockBalanceSchemaType[]> {
		return await this.stockService.getBalance(queries);
	}

	@Post('adjust')
	@Roles(UserRoles.Manager)
	@HttpCode(204)
	@ApiSwagger({
		request: {
			body: adjustStockBodySchema,
		},
		response: {
			204: Type.Void(),
		},
	})
	public async adjustStock(
		@TypeboxBody(adjustStockBodySchema) body: AdjustStockBodySchemaType
	): Promise<void> {
		await this.stockService.adjustStock(body.warehouseId, body.itemId, body.quantity, body.type);
	}
}
