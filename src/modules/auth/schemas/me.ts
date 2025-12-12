import { UserRole } from 'src/common/types/roles';
import Type, { Static } from 'typebox';

export const getMeResultSchema = Type.Object({
	id: Type.String({ format: 'uuid' }),
	login: Type.String(),
	firstname: Type.String(),
	lastname: Type.String(),
	middlename: Type.Optional(Type.String()),
	role: Type.Enum(UserRole),
});

export type GetMeResultSchemaType = Static<typeof getMeResultSchema>;
