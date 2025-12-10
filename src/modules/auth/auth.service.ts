import { UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { InferSelectModel } from 'drizzle-orm';
import Redis from 'ioredis';
import { LoginBodySchemaType } from './schemas/login';
import { uuidV4 } from '../../common/utils/uuid';
import { usersTable } from '../../common/modules/drizzle/schema';
import { UsersService } from '../users/users.service';

export class AuthService {
	public constructor(
		private readonly usersService: UsersService,
		private readonly redis: Redis
	) {}

	public async login(data: LoginBodySchemaType): Promise<{ sessionId: string }> {
		const existingUser = await this.usersService.getUserByLogin(data.login);

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
