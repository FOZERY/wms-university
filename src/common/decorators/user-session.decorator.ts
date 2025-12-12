import {
	createParamDecorator,
	ExecutionContext,
	InternalServerErrorException,
} from '@nestjs/common';
import { Request } from 'express';
import { UserSession } from '../types/user-session';

export const CurrentUserSession = createParamDecorator(
	(_data: unknown, ctx: ExecutionContext): UserSession => {
		const request = ctx.switchToHttp().getRequest<Request>();

		if (!request.userSession) {
			throw new InternalServerErrorException('User session not found in request');
		}

		return request.userSession;
	}
);

export const SessionIdDecorator = createParamDecorator(
	(_data: unknown, ctx: ExecutionContext): string => {
		const request = ctx.switchToHttp().getRequest<Request>();
		const sessionId = request.cookies.sessionId;

		if (!sessionId) {
			throw new InternalServerErrorException('Session ID not found in cookies');
		}

		return sessionId;
	}
);
