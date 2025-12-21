import Type, { StaticDecode } from 'typebox';

export const loginBodySchema = Type.Object({
	login: Type.String({
		maxLength: 255,
		example: 'login',
	}),
	password: Type.String({
		minLength: 8,
		maxLength: 255,
		example: 'strongPassword',
	}),
});

export type LoginBodySchemaType = StaticDecode<typeof loginBodySchema>;
