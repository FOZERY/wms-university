import { Controller, HttpCode, Post, Res } from '@nestjs/common';
import { type Response } from 'express';
import { TypeboxBody } from 'src/common';
import { TypedConfigService } from 'src/common/modules/config/config.module';
import { AuthService } from 'src/modules/auth/auth.service';
import { loginBodySchema, type LoginBodySchemaType } from 'src/modules/auth/schemas/login';

@Controller('auth')
export class AuthController {
	public constructor(
		private readonly config: TypedConfigService,
		private readonly authService: AuthService
	) {}

	@HttpCode(201)
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
}
