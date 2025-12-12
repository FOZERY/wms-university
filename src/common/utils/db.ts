import { asc, desc } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';
import { PgSelect, PgTable } from 'drizzle-orm/pg-core';

type SortObject<TColumns> = {
	[key in keyof TColumns]?: 'asc' | 'desc';
};
/**
 * Применяет сортировку к запросу на основе объекта sort
 * @param qb - query builder в динамическом режиме
 * @param table - таблица drizzle orm
 * @param sort - объект сортировки, где ключи - названия колонок, значения - 'asc' | 'desc'
 */
export function setOrderBy<
	T extends PgSelect,
	TTable extends PgTable,
	TColumns = TTable['_']['columns'],
>(qb: T, table: TTable, sort: SortObject<TColumns>): T {
	if (Object.keys(sort).length === 0) return qb;

	const orderByArr = Object.entries(sort)
		.filter(([_, direction]) => direction !== undefined)
		.map(([key, direction]) => {
			// biome-ignore lint/suspicious/noExplicitAny: Иначе не работает
			const column = (table as any)[key];
			return direction === 'desc' ? desc(column) : asc(column);
		});

	if (orderByArr.length === 0) return qb;

	return qb.orderBy(...orderByArr) as T;
}

export function setOrderByColumn<T extends PgSelect, C extends PgColumn>(
	qb: T,
	column: C,
	direction?: 'asc' | 'desc'
): T {
	if (!direction) return qb;

	return qb.orderBy(direction === 'desc' ? desc(column) : asc(column));
}
