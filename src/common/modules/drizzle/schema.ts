import { date, integer, numeric, pgEnum, pgTable, primaryKey, serial, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { UserRoles } from 'src/common/enums/roles';
import { ItemType } from 'src/common/enums/item-type';
import { DocumentType } from 'src/common/enums/document-type';
import { DocumentStatus } from 'src/common/enums/document-status';
import { DocumentItemDirection } from 'src/common/enums/document-item-direction';
import { idUuidV7, timestamps } from './helpers/schema.helpers';

export const roleEnum = pgEnum('role', UserRoles);

export const usersTable = pgTable('users', {
	id: idUuidV7.primaryKey(),
	role: roleEnum().$type<UserRoles>().notNull(),
	login: text().notNull().unique(),
	passwordHash: text().notNull(),
	firstname: text().notNull(),
	lastname: text().notNull(),
	middlename: text().notNull(),
	...timestamps,
});

export const suppliersTable = pgTable('suppliers', {
	id: serial().primaryKey(),
	name: text().notNull(),
	inn: text(),
	contactPerson: text(),
	phone: text(),
	email: text(),
	address: text(),
	...timestamps,
});

export const itemTypeEnum = pgEnum('item_type', ItemType);

export const itemsTable = pgTable('items', {
	id: serial().primaryKey(),
	code: text().notNull().unique(),
	name: text().notNull(),
	type: itemTypeEnum().notNull(),
	unit: text().notNull(),
	purchasePrice: numeric({ precision: 14, scale: 2 }),
	sellPrice: numeric({ precision: 14, scale: 2 }),
	minQuantity: numeric({ precision: 14, scale: 3 }).default('0').notNull(),
	description: text(),
	...timestamps,
});

export const warehousesTable = pgTable('warehouses', {
	id: serial().primaryKey(),
	name: text().notNull(),
	address: text(),
	capacity: integer(),
	...timestamps,
});

export const documentTypeEnum = pgEnum('document_type', DocumentType);
export const documentStatusEnum = pgEnum('document_status', DocumentStatus);

export const documentsTable = pgTable('documents', {
	id: serial().primaryKey(),
	number: text().notNull().unique(),
	type: documentTypeEnum().notNull(),
	status: documentStatusEnum().default('draft').notNull(),
	date: date().notNull().defaultNow(),
	userId: uuid()
		.notNull()
		.references(() => usersTable.id),
	warehouseFromId: integer().references(() => warehousesTable.id),
	warehouseToId: integer().references(() => warehousesTable.id),
	supplierId: integer().references(() => suppliersTable.id),
	comment: text(),
	printedAt: timestamp(),
	fileUrl: text(),
	...timestamps,
});

export const documentItemDirectionEnum = pgEnum('document_item_direction', DocumentItemDirection);

export const documentItemsTable = pgTable('document_items', {
	id: serial().primaryKey(),
	documentId: integer()
		.notNull()
		.references(() => documentsTable.id, { onDelete: 'cascade' }),
	itemId: integer()
		.notNull()
		.references(() => itemsTable.id),
	quantity: numeric({ precision: 14, scale: 3 }).notNull(),
	price: numeric({ precision: 14, scale: 2 }),
	direction: documentItemDirectionEnum(),
	createdAt: timestamp().defaultNow().notNull(),
});

export const stockBalancesTable = pgTable(
	'stock_balances',
	{
		itemId: integer()
			.notNull()
			.references(() => itemsTable.id, { onDelete: 'cascade' }),
		warehouseId: integer()
			.notNull()
			.references(() => warehousesTable.id),
		quantity: numeric({ precision: 14, scale: 3 }).default('0').notNull(),
		reserved: numeric({ precision: 14, scale: 3 }).default('0').notNull(),
		lastUpdated: timestamp().defaultNow().notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.itemId, table.warehouseId] }),
	})
);
