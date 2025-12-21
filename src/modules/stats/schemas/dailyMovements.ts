import Type, { Static } from 'typebox';

export const dailyMovementSchema = Type.Object({
	date: Type.String({ description: 'YYYY-MM-DD' }),
	incoming: Type.Number(),
	transfer: Type.Number(),
	production: Type.Number(),
});

export type DailyMovementSchemaType = Static<typeof dailyMovementSchema>;

export const dailyMovementsQueriesSchema = Type.Object({
	days: Type.Optional(Type.Integer({ minimum: 1, maximum: 90, default: 14 })),
});

export type DailyMovementsQueriesSchemaType = Static<typeof dailyMovementsQueriesSchema>;
