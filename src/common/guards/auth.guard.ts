import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { type Request } from 'express';
import Redis from 'ioredis';

@Injectable()
export class AuthGuard implements CanActivate {
	public constructor(private readonly redis: Redis) {}

	public async canActivate(context: ExecutionContext): Promise<boolean> {
		const req = context.switchToHttp().getRequest<Request>();

		const cookies = req.cookies || {};
		const sessionId = cookies.sessionId;

		if (!sessionId) {
			throw new UnauthorizedException('Missing session');
		}

		const sessionKey = `user_session:${sessionId}`;
		const sessionJson = await this.redis.get(sessionKey);

		if (!sessionJson) {
			throw new UnauthorizedException('Invalid or expired session');
		}

		try {
			const session = JSON.parse(sessionJson);
			// Attach session to request for downstream handlers/guards
			req.userSession = session;
			return true;
		} catch (err) {
			throw new UnauthorizedException('Invalid session data', { cause: err });
		}
	}
}
