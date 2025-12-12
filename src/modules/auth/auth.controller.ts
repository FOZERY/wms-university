import { Controller, Get, HttpCode, Post, Res, UseGuards } from '@nestjs/common';
import { type Response } from 'express';
import { TypeboxBody } from 'src/common';
import {
	CurrentUserSession,
	SessionIdDecorator,
} from 'src/common/decorators/user-session.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { TypedConfigService } from 'src/common/modules/config/config.module';
import { ApiSwagger } from 'src/common/swagger';
import { type UserSession } from 'src/common/types/user-session';
import { AuthService } from './auth.service';
import { loginBodySchema, type LoginBodySchemaType } from './schemas/login';
import { getMeResultSchema, GetMeResultSchemaType } from './schemas/me';

@Controller('auth')
export class AuthController {
	public constructor(
		private readonly config: TypedConfigService,
		private readonly authService: AuthService
	) {}

	@HttpCode(201)
	@ApiSwagger({
		request: {
			body: loginBodySchema,
		},
	})
	@Post('login')
	public async login(
		@TypeboxBody(loginBodySchema) body: LoginBodySchemaType,
		@Res({ passthrough: true }) res: Response
	): Promise<void> {
		const { sessionId } = await this.authService.login(body);

		res.cookie('sessionId', sessionId, {
			maxAge: this.config.get('SESSION_MAX_AGE'),
			httpOnly: true,
			secure: false,
			sameSite: 'strict',
		});
	}

	@HttpCode(200)
	@Post('logout')
	@UseGuards(AuthGuard)
	public async logout(
		@SessionIdDecorator() sessionId: string,
		@Res({ passthrough: true }) res: Response
	): Promise<void> {
		await this.authService.logout(sessionId);

		res.clearCookie('sessionId');
	}

	@HttpCode(200)
	@Get('me')
	@UseGuards(AuthGuard)
	@ApiSwagger({
		response: {
			200: getMeResultSchema,
		},
	})
	public async me(@CurrentUserSession() userSession: UserSession): Promise<GetMeResultSchemaType> {
		return userSession;
	}
}
