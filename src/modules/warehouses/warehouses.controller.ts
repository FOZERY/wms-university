import {
	Controller,
	Delete,
	Get,
	HttpCode,
	NotFoundException,
	Patch,
	Post,
	UseGuards,
} from '@nestjs/common';
import { TypeboxBody, TypeboxParams, TypeboxQueries } from 'src/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from 'src/common/enums/roles';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ApiSwagger } from 'src/common/swagger';
import Type from 'typebox';
import {
	createWarehouseBodySchema,
	CreateWarehouseBodySchemaType,
	createWarehouseResponseSchema,
	CreateWarehouseResponseSchemaType,
} from './schemas/createWarehouse';
import { getByIdParamsSchema, GetByIdParamsSchemaType } from './schemas/getById';
import { getListQueriesSchema, GetListQueriesSchemaPrivateType } from './schemas/getList';
import {
	updateWarehouseBodySchema,
	UpdateWarehouseBodySchemaType,
	UpdateWarehouseResponseSchemaType,
} from './schemas/updateWarehouse';
import { warehouseSchema, WarehouseSchemaType } from './schemas/warehouse';
import { WarehousesService } from './warehouses.service';
import { mapDbWarehouseToResponse } from './utils/mapper';

@Controller('warehouses')
@UseGuards(AuthGuard, RolesGuard)
export class WarehousesController {
	public constructor(private readonly warehousesService: WarehousesService) {}

	@Get()
	@ApiSwagger({
		request: {
			queries: getListQueriesSchema,
		},
		response: {
			200: Type.Array(warehouseSchema),
		},
	})
	public async list(
		@TypeboxQueries(getListQueriesSchema) queries: GetListQueriesSchemaPrivateType
	): Promise<WarehouseSchemaType[]> {
		return (await this.warehousesService.list(queries)).map(mapDbWarehouseToResponse);
	}

	@Get(':id')
	@ApiSwagger({
		request: {
			params: getByIdParamsSchema,
		},
		response: {
			200: warehouseSchema,
		},
	})
	public async getById(
		@TypeboxParams(getByIdParamsSchema) params: GetByIdParamsSchemaType
	): Promise<WarehouseSchemaType> {
		const warehouse = await this.warehousesService.getById(params.id);
		if (!warehouse) {
			throw new NotFoundException('Warehouse not found');
		}
		return mapDbWarehouseToResponse(warehouse);
	}

	@Post()
	@Roles(UserRoles.Manager)
	@ApiSwagger({
		request: {
			body: createWarehouseBodySchema,
		},
		response: {
			201: createWarehouseResponseSchema,
		},
	})
	public async create(
		@TypeboxBody(createWarehouseBodySchema) body: CreateWarehouseBodySchemaType
	): Promise<CreateWarehouseResponseSchemaType> {
		return await this.warehousesService.create(body);
	}

	@Patch(':id')
	@Roles(UserRoles.Manager)
	@ApiSwagger({
		request: {
			params: getByIdParamsSchema,
			body: updateWarehouseBodySchema,
		},
		response: {
			200: warehouseSchema,
		},
	})
	public async patch(
		@TypeboxParams(getByIdParamsSchema) params: GetByIdParamsSchemaType,
		@TypeboxBody(updateWarehouseBodySchema) body: UpdateWarehouseBodySchemaType
	): Promise<UpdateWarehouseResponseSchemaType> {
		return await this.warehousesService.update(params.id, body);
	}

	@Delete(':id')
	@Roles(UserRoles.Manager)
	@HttpCode(204)
	@ApiSwagger({
		request: {
			params: getByIdParamsSchema,
		},
		response: {
			204: Type.Void(),
		},
	})
	public async delete(
		@TypeboxParams(getByIdParamsSchema) params: GetByIdParamsSchemaType
	): Promise<void> {
		const warehouse = await this.warehousesService.getById(params.id);
		if (!warehouse) {
			throw new NotFoundException('Warehouse not found');
		}
		await this.warehousesService.delete(params.id);
	}
}
