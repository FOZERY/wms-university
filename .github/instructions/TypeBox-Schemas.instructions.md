---
applyTo: "**"
---

Инструкция: как работать с TypeBox-схемами в этом проекте

Кратко: В проекте все входные/выходные типы описываются через TypeBox-схемы (в папках `src/modules/**/schemas`), затем используются в контроллерах через декораторы `TypeboxBody`/`TypeboxParams`/`TypeboxQueries`. Для документации Swagger проект применяет `@ApiSwagger` с передачей схемы ответа/запроса.

Основные правила и последовательность работы

- Сначала создаём TypeBox-схемы для всех входных данных и ответов (в `src/modules/<module>/schemas`). Примеры: `src/modules/auth/schemas/login.ts`, `src/modules/auth/schemas/me.ts`.
- Каждая схема экспортируется как схема TypeBox и тип через `Static`: `export const mySchema = Type.Object({...}); export type MySchemaType = Static<typeof mySchema>`.
- Когда поле в БД nullable (Postgres NULL), используйте утилиту `TNullable` из `src/common/utils/typebox/extensions.ts`.
    - Пример: `inn: TNullable(Type.String())` — Drizzle вернёт `null` для пустого значения, поэтому поле не должно быть `optional`.
- В контроллере: используем `TypeboxBody`, `TypeboxParams`, `TypeboxQueries` для валидации входящих данных (они оборачивают Typebox `Pipe` и конвертацию).
- Для Swagger-документации используется `@ApiSwagger({ request: { body: mySchema }, response: { 200: resultSchema } })` рядом с методом контроллера.

Примеры (по мотивам `auth.controller.ts`)

- Схема ответа `getMeResultSchema` хранится в `src/modules/auth/schemas/me.ts` и экспортирует тип:
    - `export const getMeResultSchema = Type.Object({ id: Type.String({ format: 'uuid' }), ... })`
    - `export type GetMeResultSchemaType = Static<typeof getMeResultSchema>`

- В `AuthController.me()` схема подключена для Swagger и возвращаемого типа:
    - В `@ApiSwagger({ response: { 200: getMeResultSchema } })` — это даёт Swagger-описание ответа.
    - Метод имеет подпись `public async me(...): Promise<GetMeResultSchemaType> { return userSession; }` — здесь мы используем ранее экспортированный `Static`-тип.

Типичные декораторы в контроллерах

- `@TypeboxBody(schema)` — валидирует тело запроса по схеме и типизирует аргумент (используйте в POST/PUT).
- `@TypeboxParams(schema)` — валидирует `params` маршрута (id и т.п.).
- `@TypeboxQueries(schema)` — валидирует параметры запроса (query string), полезно вместе с `createLimitSchema/createOffsetSchema/createSortSchema`.

Рекомендации по стилю

- Названия файлов: `schemas/<entity>.ts` для DTO/ответов и `schemas/<entity>.params.ts` при необходимости.
- Всегда экспортируйте и схему, и тип: `export const fooSchema = ...; export type Foo = Static<typeof fooSchema>`.
- Документация: перед методом добавляйте `@ApiSwagger({ request: { body: <schema> }, response: { 200: <schema> } })` — это проецирует TypeBox-схемы в Swagger UI.

Пример полного рабочего потока при добавлении нового эндпоинта

1. Создать схему входных данных: `src/modules/xxx/schemas/createX.ts` + `export type CreateX = Static<typeof createXSchema>`.
2. Создать схему ответа: `resultXSchema` + `export type ResultX = Static<typeof resultXSchema>`.
3. В контроллере: добавить метод с декоратором `@TypeboxBody(createXSchema)` и типом возвращаемого значения `Promise<ResultX>`.
4. Прописать `@ApiSwagger({ request: { body: createXSchema }, response: { 200: resultXSchema } })` рядом с методом.
5. Реализовать бизнес-логику в сервисе и возвращать объекты, совместимые с `resultXSchema`.

Где смотреть готовые шаблоны

- `src/modules/auth/schemas/login.ts` — пример схемы тела `login`.
- `src/modules/auth/schemas/me.ts` — пример схемы ответа и использования `Static`.
- `src/common/schemas/pagination.ts` и `src/common/schemas/sort.ts` — утилиты для списков (limit/offset/sort) — используйте их для list endpoints.

Проверка и отладка

- Если контроллер не принимает данные — убедитесь, что вы используете правильный декоратор (`TypeboxBody` vs Nest `@Body`) и что схема экспортирована.
- При ошибках валидации смотрите исключения `TypeBoxValidatorError`, которые прокидываются в `TypeboxValidatorPipe` (файл `src/common/utils/typebox/pipes.ts`).

Если нужно — могу добавить маленькие шаблоны (copy/paste) для `create`, `list`, `getById` эндпоинтов в новом модуле.

---
