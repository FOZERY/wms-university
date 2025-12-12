import { numeric, pgEnum, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { UserRoles } from 'src/common/enums/roles';
import { ItemType } from 'src/common/enums/item-type';
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
