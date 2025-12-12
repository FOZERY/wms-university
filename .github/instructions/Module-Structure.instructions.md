---
applyTo: "**/modules/**"
---

Инструкция: структура модуля в проекте

Кратко: каждый модуль в `src/modules/<module>` имеет очевидные части: контроллеры/сервисы и дополнительные подпапки для типов, схем и утилит. Проект не использует NestJS модули — контроллеры и провайдеры регистрируются прямо в `AppModule` через `index.ts` файлы.

Рекомендуемая структура (пример `suppliers`):

```
src/modules/suppliers/
  controllers/ (optional)
  services/ (optional)
  schemas/        # TypeBox схемы для request/response
  types/          # экспорт DTO типов (Static<typeof schema>)
  utils/          # mapper-и и хелперы
  constants/      # если есть константы
  enums/          # локальные enum-ы
  suppliers.controller.ts
  suppliers.service.ts
  index.ts        # экспорт providers/controllers для AppModule
```

Правила и пояснения

- `schemas/` — все TypeBox-схемы, используются в контроллерах и для `@ApiSwagger`.
- `types/` — центральное место для экспортируемых TS-типов (DTO). Если тип выводится из схемы, импортируйте `Static<typeof schema>` и экспортируйте в `types/index.ts`.
- `utils/` — сюда складывайте чистые функции: `mapX(db)`, `calculateTotals`, и т.п.
- `constants/` и `enums/` — локальные значения модуля.
- `index.ts` должен экспортировать массивы `controllers` и `providers` (например `export const suppliersProviders = [SuppliersService]; export const suppliersControllers = [SuppliersController];`) чтобы `AppModule` мог добавить их к общему списку.
- Не создавайте NestJS `@Module` для каждого модуля — проект регистрирует провайдеры/контроллеры централизованно.

Пример `index.ts` (уже используется в проекте):

```ts
import { SuppliersController } from "./suppliers.controller";
import { SuppliersService } from "./suppliers.service";

export const suppliersProviders = [SuppliersService];
export const suppliersControllers = [SuppliersController];
```

---
