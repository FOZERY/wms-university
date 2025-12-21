import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DocumentItemDirection } from 'src/common/enums/document-item-direction';
import { DocumentStatus } from 'src/common/enums/document-status';
import { DocumentType } from 'src/common/enums/document-type';
import {
	documentItemsTable,
	documentsTable,
	itemsTable,
	suppliersTable,
	usersTable,
	warehousesTable,
} from 'src/common/modules/drizzle/schema';
import { UserSession } from 'src/common/types/user-session';
import { firstOrNull } from 'src/common/utils/result.utils';
import { StockService } from '../stock/stock.service';
import { setOrderByColumn } from 'src/common';
import { CreateDocumentBodySchemaType } from './schemas/createDocument';
import { DocumentDetailSchemaType } from './schemas/documentDetail';
import {
	DocumentListItemSchemaType,
	GetDocumentsQueriesSchemaPrivateType,
} from './schemas/getDocuments';
import { DocumentDbType, DocumentItemInsertDbType } from './types';

@Injectable()
export class DocumentsService {
	public constructor(
		private readonly db: PostgresJsDatabase,
		private readonly stockService: StockService
	) {}

	public async list(
		queries: GetDocumentsQueriesSchemaPrivateType
	): Promise<DocumentListItemSchemaType[]> {
		const { type, status, dateFrom, dateTo, supplierId, sort, limit, offset } = queries;

		const conditions = [];
		if (type) conditions.push(eq(documentsTable.type, type as DocumentType));
		if (status) conditions.push(eq(documentsTable.status, status as DocumentStatus));
		if (dateFrom) conditions.push(gte(documentsTable.date, dateFrom));
		if (dateTo) conditions.push(lte(documentsTable.date, dateTo));
		if (supplierId) conditions.push(eq(documentsTable.supplierId, supplierId));

		let query = this.db
			.select({
				id: documentsTable.id,
				number: documentsTable.number,
				type: documentsTable.type,
				status: documentsTable.status,
				date: documentsTable.date,
				warehouseFromId: documentsTable.warehouseFromId,
				warehouseToId: documentsTable.warehouseToId,
				supplierId: documentsTable.supplierId,
				userId: usersTable.id,
				userLogin: usersTable.login,
				userFirstname: usersTable.firstname,
				userLastname: usersTable.lastname,
			})
			.from(documentsTable)
			.leftJoin(usersTable, eq(documentsTable.userId, usersTable.id))
			.where(and(...conditions))
			.$dynamic();

		// Apply sorting using setOrderByColumn (falls back to date,id desc when no sort provided)
		query = setOrderByColumn(query, documentsTable.id, sort.id);
		query = setOrderByColumn(query, documentsTable.date, sort.date);
		query = setOrderByColumn(query, documentsTable.number, sort.number);
		query = setOrderByColumn(query, documentsTable.type, sort.type);
		query = setOrderByColumn(query, documentsTable.status, sort.status);

		const hasSort = sort && Object.values(sort).some((v) => v !== undefined);
		if (!hasSort) {
			query = query.orderBy(sql`${documentsTable.date} DESC, ${documentsTable.id} DESC`);
		}

		const documents = await query.offset(offset).limit(limit);

		return documents.map((doc) => ({
			id: doc.id,
			number: doc.number,
			type: doc.type,
			status: doc.status,
			date: doc.date,
			warehouseFromId: doc.warehouseFromId ?? null,
			warehouseToId: doc.warehouseToId ?? null,
			supplierId: doc.supplierId ?? null,
			author: doc.userId
				? {
						id: doc.userId,
						login: doc.userLogin || '',
						firstname: doc.userFirstname || '',
						lastname: doc.userLastname || '',
					}
				: undefined,
		}));
	}

	public async getById(id: number): Promise<DocumentDetailSchemaType | null> {
		const doc = await this.db
			.select()
			.from(documentsTable)
			.where(eq(documentsTable.id, id))
			.limit(1)
			.then(firstOrNull);

		if (!doc) return null;

		// Get items with expanded item info
		const items = await this.db
			.select({
				id: documentItemsTable.id,
				itemId: documentItemsTable.itemId,
				quantity: documentItemsTable.quantity,
				direction: documentItemsTable.direction,
				price: documentItemsTable.price,
				itemCode: itemsTable.code,
				itemName: itemsTable.name,
				itemUnit: itemsTable.unit,
			})
			.from(documentItemsTable)
			.innerJoin(itemsTable, eq(documentItemsTable.itemId, itemsTable.id))
			.where(eq(documentItemsTable.documentId, id));

		// Get related entities if needed
		let supplier: { id: number; name: string } | undefined;
		if (doc.supplierId) {
			const s = await this.db
				.select({ id: suppliersTable.id, name: suppliersTable.name })
				.from(suppliersTable)
				.where(eq(suppliersTable.id, doc.supplierId))
				.limit(1)
				.then(firstOrNull);
			if (s) supplier = s;
		}

		let warehouseFrom: { id: number; name: string } | undefined;
		if (doc.warehouseFromId) {
			const wh = await this.db
				.select({ id: warehousesTable.id, name: warehousesTable.name })
				.from(warehousesTable)
				.where(eq(warehousesTable.id, doc.warehouseFromId))
				.limit(1)
				.then(firstOrNull);
			if (wh) warehouseFrom = wh;
		}

		let warehouseTo: { id: number; name: string } | undefined;
		if (doc.warehouseToId) {
			const wh = await this.db
				.select({ id: warehousesTable.id, name: warehousesTable.name })
				.from(warehousesTable)
				.where(eq(warehousesTable.id, doc.warehouseToId))
				.limit(1)
				.then(firstOrNull);
			if (wh) warehouseTo = wh;
		}

		return {
			id: doc.id,
			number: doc.number,
			type: doc.type,
			status: doc.status,
			date: doc.date,
			userId: doc.userId,
			warehouseFromId: doc.warehouseFromId ?? null,
			warehouseToId: doc.warehouseToId ?? null,
			supplierId: doc.supplierId ?? null,
			comment: doc.comment ?? undefined,
			supplier,
			warehouseFrom,
			warehouseTo,
			items: items.map((item) => ({
				id: item.id,
				itemId: item.itemId,
				quantity: item.quantity,
				direction: item.direction ?? undefined,
				price: item.price ?? undefined,
				item: {
					id: item.itemId,
					code: item.itemCode,
					name: item.itemName,
					unit: item.itemUnit,
				},
			})),
		};
	}

	public async create(
		data: CreateDocumentBodySchemaType,
		userSession: UserSession
	): Promise<DocumentDetailSchemaType> {
		// Validate required fields based on document type
		this.validateDocumentData(data);

		// Generate document number
		const number = await this.generateDocumentNumber(data.type as DocumentType);

		// Create document in a transaction
		const doc = await this.db.transaction(async (tx) => {
			// Insert document
			const newDocs = await tx
				.insert(documentsTable)
				.values({
					number,
					type: data.type as DocumentType,
					status: DocumentStatus.Completed, // Auto-complete on creation
					date: data.date ?? new Date().toISOString().split('T')[0],
					userId: userSession.id,
					warehouseFromId: data.warehouseFromId ?? null,
					warehouseToId: data.warehouseToId ?? null,
					supplierId: data.supplierId ?? null,
					comment: data.comment ?? null,
				})
				.returning();

			const newDoc = newDocs[0];
			if (!newDoc) {
				throw new Error('Failed to create document');
			}

			// Insert document items
			if (data.items.length > 0) {
				await tx.insert(documentItemsTable).values(
					data.items.map((item) => ({
						documentId: newDoc.id,
						itemId: item.itemId,
						quantity: item.quantity,
						direction: item.direction as DocumentItemDirection | null,
						price: null,
					}))
				);
			}

			// Update stock based on document type
			await this.updateStockForDocument(tx, newDoc, data.items);

			return newDoc;
		});

		// Fetch and return full document detail
		const detail = await this.getById(doc.id);
		if (!detail) {
			throw new Error('Failed to retrieve created document');
		}
		return detail;
	}

	public async cancel(id: number): Promise<DocumentDetailSchemaType> {
		const doc = await this.db
			.select()
			.from(documentsTable)
			.where(eq(documentsTable.id, id))
			.limit(1)
			.then(firstOrNull);

		if (!doc) {
			throw new NotFoundException('Document not found');
		}

		if (doc.status === DocumentStatus.Cancelled) {
			throw new BadRequestException('Document is already cancelled');
		}

		// Get items before cancelling
		const items = await this.db
			.select()
			.from(documentItemsTable)
			.where(eq(documentItemsTable.documentId, id));

		// Cancel in transaction (reverse stock operations)
		await this.db.transaction(async (tx) => {
			// Update status
			await tx
				.update(documentsTable)
				.set({ status: DocumentStatus.Cancelled })
				.where(eq(documentsTable.id, id));

			// Reverse stock operations
			await this.reverseStockForDocument(tx, doc, items);
		});

		const detail = await this.getById(id);
		if (!detail) {
			throw new Error('Failed to retrieve cancelled document');
		}
		return detail;
	}

	private validateDocumentData(data: CreateDocumentBodySchemaType): void {
		if (data.type === 'incoming') {
			if (!data.supplierId) {
				throw new BadRequestException('Supplier is required for incoming documents');
			}
			if (!data.warehouseToId) {
				throw new BadRequestException('Warehouse To is required for incoming documents');
			}
		} else if (data.type === 'transfer') {
			if (!data.warehouseFromId || !data.warehouseToId) {
				throw new BadRequestException('Both warehouses are required for transfer documents');
			}
		} else if (data.type === 'production') {
			if (!data.warehouseFromId || !data.warehouseToId) {
				throw new BadRequestException('Both warehouses are required for production documents');
			}
			// Validate that items have direction
			for (const item of data.items) {
				if (!item.direction) {
					throw new BadRequestException(
						'Direction is required for all items in production documents'
					);
				}
			}
		}

		if (data.items.length === 0) {
			throw new BadRequestException('At least one item is required');
		}
	}

	private async generateDocumentNumber(type: DocumentType): Promise<string> {
		const prefix =
			type === DocumentType.Incoming ? 'ПР' : type === DocumentType.Transfer ? 'РС' : 'ПД';

		// Get last document number of this type
		const lastDoc = await this.db
			.select({ number: documentsTable.number })
			.from(documentsTable)
			.where(eq(documentsTable.type, type))
			.orderBy(sql`${documentsTable.id} DESC`)
			.limit(1)
			.then(firstOrNull);

		let nextNumber = 1;
		if (lastDoc && lastDoc.number) {
			const match = lastDoc.number.match(/(\d+)$/);
			if (match && match[1]) {
				nextNumber = parseInt(match[1], 10) + 1;
			}
		}

		return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
	}

	private async updateStockForDocument(
		tx: any,
		doc: DocumentDbType,
		items: Array<{ itemId: number; quantity: string; direction?: 'in' | 'out' }>
	): Promise<void> {
		if (doc.type === DocumentType.Incoming) {
			// Add to warehouse_to
			for (const item of items) {
				if (doc.warehouseToId) {
					await this.stockService.updateStockFromDocument(
						doc.warehouseToId,
						item.itemId,
						item.quantity,
						'add'
					);
				}
			}
		} else if (doc.type === DocumentType.Transfer) {
			// Subtract from warehouse_from, add to warehouse_to
			for (const item of items) {
				if (doc.warehouseFromId) {
					await this.stockService.updateStockFromDocument(
						doc.warehouseFromId,
						item.itemId,
						item.quantity,
						'subtract'
					);
				}
				if (doc.warehouseToId) {
					await this.stockService.updateStockFromDocument(
						doc.warehouseToId,
						item.itemId,
						item.quantity,
						'add'
					);
				}
			}
		} else if (doc.type === DocumentType.Production) {
			// Process based on direction
			for (const item of items) {
				if (item.direction === DocumentItemDirection.Out && doc.warehouseFromId) {
					// Subtract materials
					await this.stockService.updateStockFromDocument(
						doc.warehouseFromId,
						item.itemId,
						item.quantity,
						'subtract'
					);
				} else if (item.direction === DocumentItemDirection.In && doc.warehouseToId) {
					// Add products
					await this.stockService.updateStockFromDocument(
						doc.warehouseToId,
						item.itemId,
						item.quantity,
						'add'
					);
				}
			}
		}
	}

	private async reverseStockForDocument(
		tx: any,
		doc: DocumentDbType,
		items: DocumentItemInsertDbType[]
	): Promise<void> {
		if (doc.type === DocumentType.Incoming) {
			// Subtract from warehouse_to
			for (const item of items) {
				if (doc.warehouseToId) {
					await this.stockService.updateStockFromDocument(
						doc.warehouseToId,
						item.itemId,
						item.quantity,
						'subtract'
					);
				}
			}
		} else if (doc.type === DocumentType.Transfer) {
			// Add back to warehouse_from, subtract from warehouse_to
			for (const item of items) {
				if (doc.warehouseFromId) {
					await this.stockService.updateStockFromDocument(
						doc.warehouseFromId,
						item.itemId,
						item.quantity,
						'add'
					);
				}
				if (doc.warehouseToId) {
					await this.stockService.updateStockFromDocument(
						doc.warehouseToId,
						item.itemId,
						item.quantity,
						'subtract'
					);
				}
			}
		} else if (doc.type === DocumentType.Production) {
			// Reverse based on direction
			for (const item of items) {
				if (item.direction === DocumentItemDirection.Out && doc.warehouseFromId) {
					// Add back materials
					await this.stockService.updateStockFromDocument(
						doc.warehouseFromId,
						item.itemId,
						item.quantity,
						'add'
					);
				} else if (item.direction === DocumentItemDirection.In && doc.warehouseToId) {
					// Subtract products
					await this.stockService.updateStockFromDocument(
						doc.warehouseToId,
						item.itemId,
						item.quantity,
						'subtract'
					);
				}
			}
		}
	}
}
