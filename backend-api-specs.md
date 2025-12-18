# Backend API Specification

This document outlines the REST API endpoints required to support the WMS University frontend.
All endpoints should be prefixed with `/api` (or configured via base URL).

## Common Types

```typescript
type UserRole = "manager" | "storeKeeper";
type ItemType = "material" | "product";
type DocumentType = "incoming" | "transfer" | "production";
type DocumentStatus = "draft" | "completed" | "cancelled";
type DocumentItemDirection = "in" | "out";
```

## 1. Auth Module

### Login

-   **POST** `/auth/login`
-   **Body**: `{ login: string, password: string }`
-   **Response**: `void` (Sets `sessionId` HttpOnly cookie)

### Get Current User

-   **GET** `/auth/me`
-   **Response**:

```typescript
{
  id: string; // UUID
  login: string;
  firstname: string;
  lastname: string;
  middlename?: string;
  role: UserRole;
}
```

### Logout

-   **POST** `/auth/logout`
-   **Response**: `void` (Clears cookie)

## 2. Stats Module (Dashboard)

### Warehouse Utilization

Used for the "Warehouse Utilization" chart.

-   **GET** `/stats/warehouse-utilization`
-   **Response**:

```typescript
Array<{
	id: number;
	name: string;
	capacity: number;
	currentCount: number;
}>;
```

### Daily Movements

Used for the "Documents — 14 days" chart.

-   **GET** `/stats/daily-movements`
-   **Query**: `days` (optional, default 14)
-   **Response**:

```typescript
Array<{
	date: string; // YYYY-MM-DD
	incoming: number;
	transfer: number;
	production: number;
}>;
```

### Low Stock Items

Used for the "Items below minimum" chart.

-   **GET** `/stats/low-stock`
-   **Response**:

```typescript
Array<{
	id: number;
	name: string;
	current: number; // Current quantity across all warehouses
	min: number; // Min quantity threshold
}>;
```

## 3. Suppliers Module

### List Suppliers

-   **GET** `/suppliers`
-   **Response**:

```typescript
Array<{
	id: number;
	name: string;
	inn: string | null;
	contactPerson: string | null;
	phone: string | null;
	email: string | null;
	address: string | null;
	createdAt: number; // Timestamp
	updatedAt: number; // Timestamp
}>;
```

### Get Supplier

-   **GET** `/suppliers/:id`
-   **Response**: `Supplier` (same object as in list)

### Create Supplier

-   **POST** `/suppliers`
-   **Body**:

```typescript
{
  name: string;
  inn?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}
```

-   **Response**: `Supplier`
-   **Permissions**: Manager only.

### Update Supplier

-   **PATCH** `/suppliers/:id`
-   **Body**: Partial `Supplier` fields.
-   **Response**: `Supplier`
-   **Permissions**: Manager only.

### Delete Supplier

-   **DELETE** `/suppliers/:id`
-   **Response**: `void`
-   **Permissions**: Manager only.

## 4. Nomenclature Module (Items)

### List Items

-   **GET** `/nomenclature`
-   **Response**:

```typescript
Array<{
	id: number;
	code: string;
	name: string;
	type: ItemType;
	unit: string;
	purchasePrice: string | null; // Decimal as string
	sellPrice: string | null; // Decimal as string
	minQuantity: string; // Decimal as string
	description: string | null;
	createdAt: number;
	updatedAt: number;
}>;
```

### Get Item

-   **GET** `/nomenclature/:id`
-   **Response**: `Item` (same object as in list)

### Create Item

-   **POST** `/nomenclature`
-   **Body**:

```typescript
{
  code: string;
  name: string;
  type: ItemType;
  unit: string;
  minQuantity: string;
  purchasePrice?: string;
  sellPrice?: string;
  description?: string;
}
```

-   **Response**: `Item`
-   **Permissions**: Manager only.

### Update Item

-   **PATCH** `/nomenclature/:id`
-   **Body**: Partial `Item` fields.
-   **Response**: `Item`
-   **Permissions**: Manager only.

### Delete Item

-   **DELETE** `/nomenclature/:id`
-   **Response**: `void`
-   **Permissions**: Manager only.

## 5. Warehouses Module

### List Warehouses

-   **GET** `/warehouses`
-   **Response**:

```typescript
Array<{
	id: number;
	name: string;
	address: string | null;
	capacity?: number;
}>;
```

### Get Warehouse

-   **GET** `/warehouses/:id`
-   **Response**: `Warehouse`

### Create Warehouse

-   **POST** `/warehouses`
-   **Body**: `{ name: string, address?: string, capacity?: number }`
-   **Response**: `Warehouse`
-   **Permissions**: Manager only.

### Update Warehouse

-   **PATCH** `/warehouses/:id`
-   **Body**: `{ name?: string, address?: string, capacity?: number }`
-   **Response**: `Warehouse`
-   **Permissions**: Manager only.

### Delete Warehouse

-   **DELETE** `/warehouses/:id`
-   **Response**: `void`
-   **Permissions**: Manager only.

## 6. Documents Module

### List Documents

-   **GET** `/documents`
-   **Query**:
    -   `type` (optional): DocumentType
    -   `status` (optional): DocumentStatus
    -   `dateFrom` (optional): YYYY-MM-DD
    -   `dateTo` (optional): YYYY-MM-DD
-   **Response**:

```typescript
Array<{
	id: number;
	number: string;
	type: DocumentType;
	status: DocumentStatus;
	date: string; // YYYY-MM-DD
	warehouseFromId?: number | null;
	warehouseToId?: number | null;
	supplierId?: number | null;
	author?: {
		id: string;
		login: string;
		firstname: string;
		lastname: string;
	};
}>;
```

### Get Document Detail

-   **GET** `/documents/:id`
-   **Response**:

```typescript
{
  // ... fields from List Item
  userId: string; // Author ID
  comment?: string;

  // Expanded relations for UI display
  supplier?: { id: number; name: string };
  warehouseFrom?: { id: number; name: string };
  warehouseTo?: { id: number; name: string };

  items: Array<{
    id?: number;
    itemId: number;
    quantity: string;
    direction?: "in" | "out";
    price?: string; // Purchase price snapshot

    // Expanded item info
    item: {
      id: number;
      code: string;
      name: string;
      unit: string;
    };
  }>;
}
```

### Create Document

-   **POST** `/documents`
-   **Body**:

```typescript
{
  type: DocumentType;
  date?: string;
  warehouseFromId?: number | null;
  warehouseToId?: number | null;
  supplierId?: number | null;
  comment?: string;
  items: Array<{
    itemId: number;
    quantity: string;
    direction?: "in" | "out";
  }>;
}
```

-   **Response**: `DocumentDetail`

### Cancel Document

-   **PATCH** `/documents/:id/cancel`
-   **Response**: `DocumentDetail` (with status 'cancelled')
-   **Permissions**: Manager only.

## 7. Stock Module

### Get Stock Balance

-   **GET** `/stock`
-   **Query**: `warehouseId` (optional)
-   **Response**:

```typescript
Array<{
	warehouseId: number;
	warehouseName: string; // Joined for convenience
	itemId: number;
	itemName: string; // Joined for convenience
	quantity: string; // Decimal
	reserved: string; // Decimal
	available: string; // Decimal
}>;
```

### Adjust Stock

-   **POST** `/stock/adjust`
-   **Body**:

```typescript
{
	warehouseId: number;
	itemId: number;
	quantity: string; // Amount to adjust by
	type: "increase" | "decrease";
	reason: string;
}
```

-   **Response**: `void`
-   **Permissions**: Manager only.

## 8. Структура Базы Данных (PostgreSQL)

Ниже приведена схема БД, необходимая для поддержки описанного API и текущего функционала фронтенда.

### 1. users (Пользователи)

Таблица для хранения учетных записей и ролей.

| Поле            | Тип         | Описание                          |
| :-------------- | :---------- | :-------------------------------- |
| `id`            | UUID (PK)   | Уникальный идентификатор          |
| `login`         | VARCHAR     | Логин для входа (unique)          |
| `password_hash` | VARCHAR     | Хеш пароля                        |
| `firstname`     | VARCHAR     | Имя                               |
| `lastname`      | VARCHAR     | Фамилия                           |
| `middlename`    | VARCHAR     | Отчество (nullable)               |
| `role`          | VARCHAR     | Роль: 'manager' или 'storeKeeper' |
| `created_at`    | TIMESTAMPTZ | Дата создания                     |

### 2. warehouses (Склады)

Справочник мест хранения.

| Поле         | Тип         | Описание                                                             |
| :----------- | :---------- | :------------------------------------------------------------------- |
| `id`         | SERIAL (PK) | Идентификатор                                                        |
| `name`       | VARCHAR     | Название склада                                                      |
| `address`    | TEXT        | Адрес (nullable)                                                     |
| `capacity`   | INTEGER     | Вместимость (условные единицы) для расчета загруженности на дашборде |
| `created_at` | TIMESTAMPTZ |                                                                      |

### 3. suppliers (Поставщики)

Контрагенты для приходных накладных.

| Поле             | Тип         | Описание                     |
| :--------------- | :---------- | :--------------------------- |
| `id`             | SERIAL (PK) | Идентификатор                |
| `name`           | VARCHAR     | Название организации         |
| `inn`            | VARCHAR     | ИНН (nullable)               |
| `contact_person` | VARCHAR     | Контактное лицо (nullable)   |
| `phone`          | VARCHAR     | Телефон (nullable)           |
| `email`          | VARCHAR     | Email (nullable)             |
| `address`        | TEXT        | Юридический адрес (nullable) |
| `created_at`     | TIMESTAMPTZ |                              |
| `updated_at`     | TIMESTAMPTZ |                              |

### 4. items (Номенклатура)

Товары и материалы.

| Поле             | Тип           | Описание                              |
| :--------------- | :------------ | :------------------------------------ |
| `id`             | SERIAL (PK)   | Идентификатор                         |
| `code`           | VARCHAR       | Артикул / Код (unique)                |
| `name`           | VARCHAR       | Наименование                          |
| `type`           | VARCHAR       | Тип: 'material' или 'product'         |
| `unit`           | VARCHAR       | Ед. измерения (кг, шт, л)             |
| `purchase_price` | DECIMAL(14,2) | Закупочная цена (nullable)            |
| `sell_price`     | DECIMAL(14,2) | Цена продажи (nullable)               |
| `min_quantity`   | DECIMAL(14,3) | Минимальный остаток (для уведомлений) |
| `description`    | TEXT          | Описание (nullable)                   |
| `created_at`     | TIMESTAMPTZ   |                                       |
| `updated_at`     | TIMESTAMPTZ   |                                       |

### 5. documents (Документы)

Шапки документов движения.

| Поле                | Тип         | Описание                                  |
| :------------------ | :---------- | :---------------------------------------- |
| `id`                | SERIAL (PK) | Идентификатор                             |
| `number`            | VARCHAR     | Номер документа (ПР-001 и т.д.)           |
| `type`              | VARCHAR     | Тип: 'incoming', 'transfer', 'production' |
| `status`            | VARCHAR     | Статус: 'draft', 'completed', 'cancelled' |
| `date`              | DATE        | Дата документа                            |
| `user_id`           | UUID (FK)   | Автор документа (связь с users)           |
| `warehouse_from_id` | INT (FK)    | Склад списания (nullable)                 |
| `warehouse_to_id`   | INT (FK)    | Склад получения (nullable)                |
| `supplier_id`       | INT (FK)    | Поставщик (nullable, только для incoming) |
| `comment`           | TEXT        | Комментарий                               |
| `created_at`        | TIMESTAMPTZ |                                           |
| `updated_at`        | TIMESTAMPTZ |                                           |

### 6. document_items (Позиции документов)

Табличная часть документов.

| Поле          | Тип           | Описание                                          |
| :------------ | :------------ | :------------------------------------------------ |
| `id`          | SERIAL (PK)   | Идентификатор                                     |
| `document_id` | INT (FK)      | Ссылка на документ                                |
| `item_id`     | INT (FK)      | Ссылка на товар                                   |
| `quantity`    | DECIMAL(14,3) | Количество                                        |
| `price`       | DECIMAL(14,2) | Цена на момент операции (nullable)                |
| `direction`   | VARCHAR       | Направление ('in'/'out') - важно для производства |

### 7. stock_balances (Остатки)

Текущие остатки на складах (регистр накопления).

| Поле           | Тип           | Описание                         |
| :------------- | :------------ | :------------------------------- |
| `warehouse_id` | INT (FK)      | Склад (PK part 1)                |
| `item_id`      | INT (FK)      | Товар (PK part 2)                |
| `quantity`     | DECIMAL(14,3) | Физический остаток               |
| `reserved`     | DECIMAL(14,3) | Резерв (под заказы/производство) |
| `last_updated` | TIMESTAMPTZ   | Время последнего изменения       |

_Примечание: Поле `available` (доступно) вычисляется как `quantity - reserved`._
