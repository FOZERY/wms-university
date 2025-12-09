import { Controller, Get, Post } from '@nestjs/common';
import { TypeboxBody } from 'src/common';
import { ApiSwagger } from 'src/common/swagger';
import Type, { Static } from 'typebox';

export const bodySchema = Type.Object({
	name: Type.String(),
});
export type BodySchemaType = Static<typeof bodySchema>;

@Controller('auth')
export class AuthController {
	@Post('status')
	@ApiSwagger({
		request: {
			body: bodySchema,
		},
		response: {
			201: Type.String(),
		},
	})
	public getStatus(@TypeboxBody(bodySchema) body: BodySchemaType) {
		return 'Hi';
	}
}
