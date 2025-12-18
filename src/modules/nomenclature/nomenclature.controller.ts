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
import {
	CurrentUserSession,
	TypeboxBody,
	TypeboxParams,
	TypeboxQueries,
	UserSession,
} from 'src/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from 'src/common/enums/roles';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ApiSwagger } from 'src/common/swagger';
import Type from 'typebox';
import { NomenclatureService } from './nomenclature.service';
import {
	createItemBodySchema,
	CreateItemBodySchemaType,
	createItemResponseSchema,
	CreateItemResponseSchemaType,
} from './schemas/createProductionItem';
import { getByIdParamsSchema, GetByIdParamsSchemaType } from './schemas/getById';
import { getListQueriesSchema, GetListQueriesSchemaPrivateType } from './schemas/getList';
import { itemSchema, ItemSchemaType } from './schemas/item';
import {
	updateItemBodySchema,
	UpdateItemBodySchemaType,
	UpdateItemResponseSchemaType,
} from './schemas/updateItem';
import { mapDbItemToResponse } from './utils/mapper';

@Controller('nomenclature')
@UseGuards(AuthGuard, RolesGuard)
export class NomenclatureController {
	public constructor(private readonly nomenclatureService: NomenclatureService) {}

	@Get()
	@ApiSwagger({
		request: {
			queries: getListQueriesSchema,
		},
		response: {
			200: Type.Array(itemSchema),
		},
	})
	public async list(
		@TypeboxQueries(getListQueriesSchema) queries: GetListQueriesSchemaPrivateType
	): Promise<ItemSchemaType[]> {
		return (await this.nomenclatureService.list(queries)).map(mapDbItemToResponse);
	}

	@Get(':id')
	@ApiSwagger({
		request: {
			params: getByIdParamsSchema,
		},
		response: {
			200: itemSchema,
		},
	})
	public async getById(
		@TypeboxParams(getByIdParamsSchema) params: GetByIdParamsSchemaType
	): Promise<ItemSchemaType> {
		const item = await this.nomenclatureService.getById(params.id);
		if (!item) {
			throw new NotFoundException('Item not found');
		}
		return mapDbItemToResponse(item);
	}

	@Post()
	@ApiSwagger({
		request: {
			body: createItemBodySchema,
		},
		response: {
			201: createItemResponseSchema,
		},
	})
	public async createProductItem(
		@TypeboxBody(createItemBodySchema) body: CreateItemBodySchemaType,
		@CurrentUserSession() userSession: UserSession
	): Promise<CreateItemResponseSchemaType> {
		const created = await this.nomenclatureService.create(body, userSession);
		return created;
	}

	@Patch(':id')
	@Roles(UserRoles.Manager)
	@ApiSwagger({
		request: {
			params: getByIdParamsSchema,
			body: updateItemBodySchema,
		},
		response: {
			200: itemSchema,
		},
	})
	public async patch(
		@TypeboxParams(getByIdParamsSchema) params: GetByIdParamsSchemaType,
		@TypeboxBody(updateItemBodySchema) body: UpdateItemBodySchemaType,
		@CurrentUserSession() userSession: UserSession
	): Promise<UpdateItemResponseSchemaType> {
		const updated = await this.nomenclatureService.update(params.id, body, userSession);

		return updated;
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
		const item = await this.nomenclatureService.getById(params.id);
		if (!item) {
			throw new NotFoundException('Item not found');
		}
		await this.nomenclatureService.delete(params.id);
	}
}
