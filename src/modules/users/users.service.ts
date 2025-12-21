import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { usersTable } from '../../common/modules/drizzle/schema';
import { firstOrNull } from '../../common/utils/result.utils';

@Injectable()
export class UsersService {
	public constructor(private readonly db: PostgresJsDatabase) {}

	public async getUserByLogin(login: string) {
		return await this.db
			.select()
			.from(usersTable)
			.where(eq(usersTable.login, login))
			.limit(1)
			.then(firstOrNull);
	}
}
