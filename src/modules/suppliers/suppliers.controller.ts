import { Controller, Get, NotFoundException, UseGuards } from '@nestjs/common';
import { TypeboxParams, TypeboxQueries } from 'src/common';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { ApiSwagger } from 'src/common/swagger';
import Type from 'typebox';
import { getByIdParamsSchema, GetByIdParamsSchemaType } from './schemas/getById';
import { getListQueriesSchema, GetListQueriesSchemaPrivateType } from './schemas/getList';
import { supplierSchema, SupplierSchemaType } from './schemas/supplier';
import { SuppliersService } from './suppliers.service';
import { mapDbSupplierToResponse } from './utils/mapper';

@Controller('suppliers')
@UseGuards(AuthGuard)
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
}
