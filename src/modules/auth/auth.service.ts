import { UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { eq, InferSelectModel } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import Redis from 'ioredis';
import { usersTable } from 'src/common/modules/drizzle/schema';
import { firstOrNull } from 'src/common/utils/result.utils';
import { uuidV4 } from 'src/common/utils/uuid';
import { type LoginBodySchemaType } from './schemas/login';

export class AuthService {
	constructor(
		private readonly db: PostgresJsDatabase,
		private readonly redis: Redis
	) {}

	public async login(data: LoginBodySchemaType): Promise<{ sessionId: string }> {
		const existingUser = await this.db
			.select()
			.from(usersTable)
			.where(eq(usersTable.login, data.login))
			.limit(1)
			.then(firstOrNull);

		if (!existingUser) {
			throw new UnauthorizedException('Invalid login or password');
		}

		const isSamePassword = await bcrypt.compare(data.password, existingUser.passwordHash);

		if (!isSamePassword) {
			throw new UnauthorizedException('Invalid login or password');
		}

		const sessionId = await this.createUserSession({
			id: existingUser.id,
			login: existingUser.login,
			firstname: existingUser.firstname,
			lastname: existingUser.lastname,
			middlename: existingUser.middlename,
			role: existingUser.role,
		});

		return { sessionId };
	}

	private async createUserSession(
		data: Omit<InferSelectModel<typeof usersTable>, 'passwordHash' | 'createdAt' | 'updatedAt'>
	): Promise<string> {
		const sessionId = uuidV4();
		const sessionKey = `user_session:${sessionId}`;
		await this.redis.set(sessionKey, JSON.stringify(data), 'EX', 3600); // 1 hour TTL
		return sessionId;
	}
}
