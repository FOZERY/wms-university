import { Controller, Get, NotFoundException, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUserSession, TypeboxBody, TypeboxParams, TypeboxQueries, UserSession } from 'src/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from 'src/common/enums/roles';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ApiSwagger } from 'src/common/swagger';
import Type from 'typebox';
import { DocumentsService } from './documents.service';
import {
	createDocumentBodySchema,
	CreateDocumentBodySchemaType,
} from './schemas/createDocument';
import { documentDetailSchema, DocumentDetailSchemaType } from './schemas/documentDetail';
import { getByIdParamsSchema, GetByIdParamsSchemaType } from './schemas/getById';
import {
	documentListItemSchema,
	DocumentListItemSchemaType,
	getDocumentsQueriesSchema,
	GetDocumentsQueriesSchemaType,
} from './schemas/getDocuments';

@Controller('documents')
@UseGuards(AuthGuard, RolesGuard)
export class DocumentsController {
	public constructor(private readonly documentsService: DocumentsService) {}

	@Get()
	@ApiSwagger({
		request: {
			queries: getDocumentsQueriesSchema,
		},
		response: {
			200: Type.Array(documentListItemSchema),
		},
	})
	public async list(
		@TypeboxQueries(getDocumentsQueriesSchema) queries: GetDocumentsQueriesSchemaType,
		@CurrentUserSession() userSession: UserSession
	): Promise<DocumentListItemSchemaType[]> {
		return await this.documentsService.list(queries, userSession);
	}

	@Get(':id')
	@ApiSwagger({
		request: {
			params: getByIdParamsSchema,
		},
		response: {
			200: documentDetailSchema,
		},
	})
	public async getById(
		@TypeboxParams(getByIdParamsSchema) params: GetByIdParamsSchemaType
	): Promise<DocumentDetailSchemaType> {
		const document = await this.documentsService.getById(params.id);
		if (!document) {
			throw new NotFoundException('Document not found');
		}
		return document;
	}

	@Post()
	@ApiSwagger({
		request: {
			body: createDocumentBodySchema,
		},
		response: {
			201: documentDetailSchema,
		},
	})
	public async create(
		@TypeboxBody(createDocumentBodySchema) body: CreateDocumentBodySchemaType,
		@CurrentUserSession() userSession: UserSession
	): Promise<DocumentDetailSchemaType> {
		return await this.documentsService.create(body, userSession);
	}

	@Patch(':id/cancel')
	@Roles(UserRoles.Manager)
	@ApiSwagger({
		request: {
			params: getByIdParamsSchema,
		},
		response: {
			200: documentDetailSchema,
		},
	})
	public async cancel(
		@TypeboxParams(getByIdParamsSchema) params: GetByIdParamsSchemaType
	): Promise<DocumentDetailSchemaType> {
		return await this.documentsService.cancel(params.id);
	}
}
