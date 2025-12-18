import Type, { Static } from 'typebox';

export const getByIdParamsSchema = Type.Object({
	id: Type.Integer(),
});

export type GetByIdParamsSchemaType = Static<typeof getByIdParamsSchema>;
