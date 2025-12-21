import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, exists, gte, ilike, lte, or, sql } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { setOrderByColumn } from 'src/common';
import { DocumentItemDirection } from 'src/common/enums/document-item-direction';
import { DocumentStatus } from 'src/common/enums/document-status';
import { DocumentType } from 'src/common/enums/document-type';
import {
	documentItemsTable,
	documentsTable,
	itemsTable,
	suppliersTable,
	warehousesTable,
} from 'src/common/modules/drizzle/schema';
import { UserSession } from 'src/common/types/user-session';
import { firstOrNull } from 'src/common/utils/result.utils';
import { StockService } from '../stock/stock.service';
import { CreateDocumentBodySchemaType } from './schemas/createDocument';
import { DocumentDetailSchemaType } from './schemas/documentDetail';
import {
	DocumentListItemSchemaType,
	GetDocumentsQueriesSchemaPrivateType,
} from './schemas/getDocuments';
import { DocumentDbType, DocumentItemInsertDbType } from './types';
import path from 'node:path';
import fs from 'node:fs';
import { create } from 'node:domain';
import { type } from 'node:os';
import { async } from 'rxjs';

@Injectable()
export class DocumentsService {
	public constructor(
		private readonly db: PostgresJsDatabase,
		private readonly stockService: StockService
	) {}

	public async list(
		queries: GetDocumentsQueriesSchemaPrivateType
	): Promise<DocumentListItemSchemaType[]> {
		const { type, status, dateFrom, dateTo, supplierId, itemId, search, sort, limit, offset } =
			queries;

		const conditions = [];
		if (type) conditions.push(eq(documentsTable.type, type as DocumentType));
		if (status) conditions.push(eq(documentsTable.status, status as DocumentStatus));
		if (dateFrom) conditions.push(gte(documentsTable.date, dateFrom));
		if (dateTo) conditions.push(lte(documentsTable.date, dateTo));
		if (supplierId) conditions.push(eq(documentsTable.supplierId, supplierId));

		if (search) {
			// search by document number OR any part of author's name stored in documents.userData JSONB
			conditions.push(
				or(
					ilike(documentsTable.number, `%${search}%`),
					ilike(sql`${documentsTable.userData} ->> 'firstname'`, `%${search}%`),
					ilike(sql`${documentsTable.userData} ->> 'lastname'`, `%${search}%`),
					ilike(sql`${documentsTable.userData} ->> 'middlename'`, `%${search}%`)
				)
			);
		}
		// If itemId provided, restrict to documents that contain this item
		if (itemId) {
			const sub = this.db
				.select()
				.from(documentItemsTable)
				.where(
					and(
						eq(documentItemsTable.documentId, documentsTable.id),
						eq(documentItemsTable.itemId, itemId)
					)
				);

			conditions.push(exists(sub));
		}

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
				userData: documentsTable.userData,
			})
			.from(documentsTable)
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
			author: doc.userData,
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
			author: doc.userData,
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
					userData: {
						firstname: userSession.firstname,
						lastname: userSession.lastname,
						middlename: userSession.middlename ?? null,
					},
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

	public async generatePdfBuffer(
		id: number
	): Promise<{ buffer: Buffer; filename: string; mime: string }> {
		const detail = await this.getById(id);
		if (!detail) {
			throw new NotFoundException('Document not found');
		}

		// Lazy-require pdfkit to avoid top-level import issues
		const PDFDocument = require('pdfkit');
		// Увеличенный отступ для печати
		const doc = new PDFDocument({ size: 'A4', margin: 80 });
		// Подключаем шрифт с поддержкой кириллицы — предпочитаем Roboto, затем DejaVu
		const candidatePaths = [
			// Roboto candidates
			path.resolve(__dirname, '../../assets/fonts/Roboto-Regular.ttf'),
			path.resolve(process.cwd(), 'src/assets/fonts/Roboto-Regular.ttf'),
			path.resolve(process.cwd(), 'dist/assets/fonts/Roboto-Regular.ttf'),
			// DejaVu fallback
			path.resolve(__dirname, '../../assets/fonts/DejaVuSans.ttf'),
			path.resolve(process.cwd(), 'src/assets/fonts/DejaVuSans.ttf'),
			path.resolve(process.cwd(), 'dist/assets/fonts/DejaVuSans.ttf'),
		];
		const fontPath = candidatePaths.find((p) => fs.existsSync(p));
		if (!fontPath) {
			throw new Error(`No supported font found. Checked: ${candidatePaths.join(', ')}`);
		}
		const fontName = /roboto/i.test(path.basename(fontPath)) ? 'roboto' : 'dejavu';
		doc.registerFont(fontName, fontPath);
		doc.font(fontName);

		const chunks: Buffer[] = [];
		doc.on('data', (chunk: Buffer) => chunks.push(chunk));
		const endPromise = new Promise<void>((resolve) => doc.on('end', () => resolve()));

		// Мапперы для русских названий
		function mapDocumentTypeToRu(type?: string) {
			if (!type) return '-';
			if (type === 'incoming') return 'Приходный ордер';
			if (type === 'transfer') return 'Перемещение';
			if (type === 'production') return 'Производство';
			return String(type);
		}
		function mapDocumentStatusToRu(status?: string) {
			if (!status) return '-';
			if (status === 'draft') return 'Черновик';
			if (status === 'completed') return 'Проведён';
			if (status === 'cancelled') return 'Отменён';
			return String(status);
		}

		// Header
		doc.fontSize(22).text(`Документ № ${detail.number}`, { align: 'center' });
		doc.moveDown(1.5);

		// Основной блок информации (больше шрифт и небольшой межстрочный интервал)
		doc.fontSize(14).text(`Дата: ${detail.date}`, { lineGap: 4 });
		doc.text(`Тип: ${mapDocumentTypeToRu(detail.type)}`, { lineGap: 4 });
		doc.text(`Статус: ${mapDocumentStatusToRu(detail.status)}`, { lineGap: 4 });
		if (detail.supplier) doc.text(`Поставщик: ${detail.supplier.name}`);
		if (detail.warehouseFrom) doc.text(`Со склада: ${detail.warehouseFrom.name}`);
		if (detail.warehouseTo) doc.text(`На склад: ${detail.warehouseTo.name}`);
		if (detail.comment) {
			doc.moveDown(1);
			doc.text(`Комментарий: ${detail.comment}`, { lineGap: 6 });
		}

		doc.moveDown(1);
		doc.fontSize(16).text('Позиции:', { underline: true });
		doc.moveDown(0.5);

		// Render positions as a simple list (one block per item). Simpler and more robust than table drawing.
		const pageMargins = (doc.page && (doc.page.margins as any)) || {
			left: 80,
			right: 80,
			top: 80,
			bottom: 80,
		};

		const maxY = () => doc.page.height - (pageMargins.bottom ?? 80) - 40;

		for (const item of detail.items) {
			// Ensure there is space for the item block, otherwise add a new page and reprint header
			const estimatedBlockHeight = 36; // two lines + small gap
			if (doc.y + estimatedBlockHeight > maxY()) {
				doc.addPage();
				doc.moveDown(0.5);
				doc.fontSize(16).text('Позиции:', { underline: true });
				doc.moveDown(0.5);
			}

			const code = String(item.item.code ?? item.itemId);
			const name = String(item.item.name ?? '');
			const qty = String(item.quantity);
			const unit = String(item.item.unit ?? '');

			const left = pageMargins.left ?? 80;
			const usableWidth = doc.page.width - (pageMargins.left ?? 80) - (pageMargins.right ?? 80);

			// Draw name on the left and quantity right-aligned on the same line.
			const lineY = doc.y;
			doc
				.fontSize(12)
				.fillColor('black')
				.text(`- ${code} — ${name}`, left, lineY, {
					width: Math.max(usableWidth - 140, 100),
					ellipsis: true,
				});
			doc.fontSize(12).fillColor('black').text(`Кол-во: ${qty} ${unit}`, left, lineY, {
				width: usableWidth,
				align: 'right',
			});
			doc.moveDown(0.8);
		}

		// Finalize PDF
		doc.end();
		await endPromise;

		const buffer = Buffer.concat(chunks);
		// Очистить номер документа для имени файла (только латиница, цифры, дефис, подчёркивание)
		const safeNumber = String(detail.number).replace(/[^a-zA-Z0-9-_]/g, '_');
		const filename = `document-${safeNumber}.pdf`;
		return { buffer, filename, mime: 'application/pdf' };
	}
}
