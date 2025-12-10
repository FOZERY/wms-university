import { pgEnum, pgTable, text } from 'drizzle-orm/pg-core';
import { RolesEnum } from 'src/common/types/roles';
import { idUuidV7, timestamps } from './helpers/schema.helpers';

export const roleEnum = pgEnum('role', ['admin', 'storeManager', 'storekeeper']);

export const usersTable = pgTable('users', {
	id: idUuidV7.primaryKey(),
	role: roleEnum().$type<RolesEnum>().notNull(),
	login: text().notNull().unique(),
	passwordHash: text().notNull(),
	firstname: text().notNull(),
	lastname: text().notNull(),
	middlename: text().notNull(),
	...timestamps,
});
