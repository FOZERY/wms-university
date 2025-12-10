import { timestamp, uuid } from 'drizzle-orm/pg-core';
import { uuidV7 } from '../../../utils/uuid';

export const idUuidV7 = uuid().$defaultFn(() => uuidV7());

export const timestamps = {
	createdAt: timestamp().defaultNow().notNull(),
	updatedAt: timestamp()
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
};
