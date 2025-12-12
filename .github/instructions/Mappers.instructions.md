---
applyTo: "**/modules/**/utils/**"
---

Инструкция: как работать с mapper-ами (DB -> DTO)

Кратко: mapper — простая функция, которая принимает строку(и) из Drizzle (DB-модель) и возвращает DTO, совместимый с TypeBox-схемой модуля.

Правила и примеры

- Место: каждый модуль использует `src/modules/<module>/utils/mapper.ts` (или `utils/*.ts`) для мапперов.
- Подход: одна маленькая функция `mapX(dbRow): XDto` — чистая, без сайд-эффектов.
- Типы:
    - В `utils/mapper.ts` импортируйте DB-тип: `type DbX = InferSelectModel<typeof xTable>`.
    - Экспортируйте/используйте DTO-тип из `src/modules/<module>/types` (например `Supplier`).
- Даты/временные поля: Drizzle возвращает `Date` для `timestamp` — в DTO приводим к целочисленному epoch ms (или строке), в соответствии с `schemas/*`.
    - Пример: `createdAt: db.createdAt.getTime()` или `Math.floor(db.createdAt.getTime())`.
- Nullable: DB nullable поля будут `null` — mapper должен сохранять `null` (не заменять на `undefined`).

Пример (из `suppliers`):

```ts
import { SupplierSchemaType } from "../schemas";
import { DbSupplier } from "../types";

export function mapSupplier(db: DbSupplier): SupplierSchemaType {
	return {
		id: db.id,
		name: db.name,
		inn: db.inn ?? null,
		createdAt: db.createdAt.getTime(),
		updatedAt: db.updatedAt.getTime(),
	};
}
```

Где использовать

- В сервисе после запроса к БД: `const rows = await db.select().from(table); return rows.map(mapX);`.
- Для одиночной записи применяйте `row ? mapX(row) : null`.

Тесты

- Мапперы легко тестировать: передавайте мок-объект DB и ожидайте DTO.
