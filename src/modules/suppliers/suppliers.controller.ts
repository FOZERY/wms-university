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
	createSupplierBodySchema,
	CreateSupplierBodySchemaType,
	createSupplierResponseSchema,
	CreateSupplierResponseSchemaType,
} from './schemas/createSupplier';
import { getByIdParamsSchema, GetByIdParamsSchemaType } from './schemas/getById';
import { getListQueriesSchema, GetListQueriesSchemaPrivateType } from './schemas/getList';
import { supplierSchema, SupplierSchemaType } from './schemas/supplier';
import {
	updateSupplierBodySchema,
	UpdateSupplierBodySchemaType,
	UpdateSupplierResponseSchemaType,
} from './schemas/updateSupplier';
import { SuppliersService } from './suppliers.service';
import { mapDbSupplierToResponse } from './utils/mapper';

@Controller('suppliers')
@UseGuards(AuthGuard, RolesGuard)
export class SuppliersController {
	public constructor(private readonly suppliersService: SuppliersService) {}

	@Get()
	@ApiSwagger({
		request: {
			queries: getListQueriesSchema,
		},
		response: {
			200: Type.Array(supplierSchema),
		},
	})
	public async list(
		@TypeboxQueries(getListQueriesSchema) queries: GetListQueriesSchemaPrivateType
	): Promise<SupplierSchemaType[]> {
		return (await this.suppliersService.list(queries)).map(mapDbSupplierToResponse);
	}

	@Get(':id')
	@ApiSwagger({
		request: {
			params: getByIdParamsSchema,
		},
		response: {
			200: supplierSchema,
		},
	})
	public async getById(
		@TypeboxParams(getByIdParamsSchema) params: GetByIdParamsSchemaType
	): Promise<SupplierSchemaType> {
		const supplier = await this.suppliersService.getById(params.id);
		if (!supplier) {
			throw new NotFoundException('Supplier not found');
		}
		return mapDbSupplierToResponse(supplier);
	}

	@Post()
	@Roles(UserRoles.Manager)
	@ApiSwagger({
		request: {
			body: createSupplierBodySchema,
		},
		response: {
			201: createSupplierResponseSchema,
		},
	})
	public async create(
		@TypeboxBody(createSupplierBodySchema) body: CreateSupplierBodySchemaType
	): Promise<CreateSupplierResponseSchemaType> {
		return await this.suppliersService.create(body);
	}

	@Patch(':id')
	@Roles(UserRoles.Manager)
	@ApiSwagger({
		request: {
			params: getByIdParamsSchema,
			body: updateSupplierBodySchema,
		},
		response: {
			200: supplierSchema,
		},
	})
	public async patch(
		@TypeboxParams(getByIdParamsSchema) params: GetByIdParamsSchemaType,
		@TypeboxBody(updateSupplierBodySchema) body: UpdateSupplierBodySchemaType
	): Promise<UpdateSupplierResponseSchemaType> {
		return await this.suppliersService.update(params.id, body);
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
		const supplier = await this.suppliersService.getById(params.id);
		if (!supplier) {
			throw new NotFoundException('Supplier not found');
		}
		await this.suppliersService.delete(params.id);
	}
}
