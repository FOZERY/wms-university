import Type, { StaticDecode } from 'typebox';

export const loginBodySchema = Type.Object({
	login: Type.String({
		minLength: 5,
		maxLength: 255,
	}),
	password: Type.String({
		minLength: 8,
		maxLength: 255,
	}),
});

export type LoginBodySchemaType = StaticDecode<typeof loginBodySchema>;
