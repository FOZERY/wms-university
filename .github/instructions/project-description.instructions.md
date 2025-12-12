---
applyTo: "**"
---

Прикрепляю тебе описание проекта от DeepSeek. Возможно он что-то неправильно описал, поэтому ты каждый раз переспрашивай перед реализацией!!! И говори что хочешь сделать конкретно.

🏭 Бизнес-домен кратко
Мы разрабатываем цифровую систему учёта для склада производственного завода.

Цель: Заменить бумажные накладные и ручные подсчёты на автоматизированный учёт материалов и готовой продукции. Система фиксирует движения товаров через документы (приход, перемещение, производство), автоматически считает остатки и формирует отчётность.

Пользователи: Кладовщики (операции), менеджеры (контроль).

Суть: "Без бумажки — ты букашка", но в цифровом виде. Каждая операция оформляется документом, компьютер считает остатки, все видят единую правду о состоянии склада.

# 📋 **Техническая спецификация системы WMS SpecialTech**

---

## 🏗️ **Модули системы (NestJS)**

### **1. AuthModule** ✅

**Статус:** Реализован  
**Задачи:**

- Аутентификация пользователей
- Генерация JWT токенов
- Обновление токенов
- Выход из системы

**Эндпоинты:**

```
POST   /auth/login          # Вход в систему
POST   /auth/refresh        # Обновление токена
POST   /auth/logout         # Выход
GET    /auth/me             # Текущий пользователь
```

---

### **2. SuppliersModule** ⚠️ (read-only)

**Статус:** Не реализован  
**Задачи:**

- Выбор поставщика в приходных документах
- Просмотр справочника поставщиков

**Важно:** поставщики **предзаполняются в БД** (создание/редактирование через UI не требуется).

**Эндпоинты (минимум):**

```
GET    /suppliers            # Список поставщиков
GET    /suppliers/:id        # Поставщик
```

**Зависимости:** `@UseGuards(JwtAuthGuard)`

---

### **3. NomenclatureModule (Items)** ❌

**Статус:** Не реализован  
**Задачи:**

- Управление справочником номенклатуры
- Категоризация товаров
- Установка минимальных остатков

**Эндпоинты:**

```
GET    /nomenclature         # Список номенклатуры (поиск)
POST   /nomenclature         # Создать позицию (manager)
GET    /nomenclature/:id     # Получить позицию
PUT    /nomenclature/:id     # Обновить позицию (manager)
DELETE /nomenclature/:id     # Удаление (пока не нужно)
```

**Зависимости:** `@UseGuards(JwtAuthGuard)`

---

### **4. WarehousesModule** ❌

**Статус:** Не реализован  
**Задачи:**

- Управление складами (создание/редактирование)
- Использование складов в документах и в остатках

**Эндпоинты:**

```
GET    /warehouses           # Список складов
POST   /warehouses           # Создать склад (manager)
GET    /warehouses/:id       # Получить склад
PUT    /warehouses/:id       # Обновить склад (manager)
```

**Зависимости:** `@UseGuards(JwtAuthGuard)`

---

### **5. DocumentsModule** ❌

**Статус:** Не реализован (ЯДРО системы)  
**Задачи:**

- Создание документов движения
- Проведение/отмена документов
- Печать документов
- История документов

**Эндпоинты:**

```
POST   /documents                    # Создать документ
GET    /documents                    # Список документов
GET    /documents/:id                # Получить документ
PATCH  /documents/:id/status         # Сменить статус
DELETE /documents/:id                # Отменить документ
POST   /documents/:id/print          # Печать документа (PDF)
GET    /documents/stats/daily        # Статистика за день
GET    /documents/:id/audit          # История изменений
```

**Типы документов:**

```typescript
type DocumentType = "incoming" | "transfer" | "production";
```

`transfer` нужен для перемещений между складами (как в 1С).

`outgoing` как отдельный тип не нужен: списание материалов со склада делается внутри `production` (позиции с направлением `out`).

**Зависимости:** `ItemsModule`, `StockModule`

---

### **6. StockModule** ❌

**Статус:** Не реализован  
**Задачи:**

- Управление остатками
- Резервирование товаров
- Контроль доступности

**Эндпоинты:**

```
GET    /stock                        # Остатки (по складам)
GET    /stock/:itemId                # Остатки по товару (по складам)
POST   /stock/reserve                # Зарезервировать товар
POST   /stock/release                # Снять резерв
GET    /stock/low                    # Товары ниже минимума
POST   /stock/adjust                 # Корректировка остатков
```

**Зависимости:** `NomenclatureModule`, `WarehousesModule`, автоматические обновления при документах

---

### **7. ReportsModule** ❌

**Статус:** Не реализован  
**Задачи:**

- Формирование отчётов
- Аналитика движения
- Экспорт данных

**Эндпоинты:**

```
GET    /reports/stock                # Отчёт по остаткам
GET    /reports/movement             # Движение за период
GET    /reports/production           # Выпуск продукции
GET    /reports/sales                # Продажи
GET    /reports/financial            # Финансовый отчёт
GET    /reports/export/:type         # Экспорт отчёта (Excel/PDF)
```

---

## 🛡️ **Ролевая модель и права доступа**

### **Роли пользователей (актуально):**

```typescript
type UserRole = "manager" | "storeKeeper";
// clerk = storeKeeper, admin отсутствует
```

**В системе только две роли:**

- **manager** — менеджер (операции, контроль, создание документов, номенклатуры, складов)
- **storeKeeper** — кладовщик (операции, создание документов)

**Роль admin не используется.**
**Роль clerk = storeKeeper.**

**Пользователи и поставщики предзаполняются в базе данных.**
В системе можно создавать только документы, номенклатуру и склады через интерфейс. Пользователей и поставщиков — только через БД.

### **Матрица прав доступа (актуально):**

| Действие \ Роль                    | manager | storeKeeper |
| ---------------------------------- | ------- | ----------- |
| **AuthModule**                     |         |             |
| Вход в систему                     | ✅      | ✅          |
| Просмотр своего профиля            | ✅      | ✅          |
| **NomenclatureModule**             |         |             |
| Просмотр товаров                   | ✅      | ✅          |
| Создание/редактирование товаров    | ✅      | ❌          |
| Удаление товаров                   | ❌      | ❌          |
| **SuppliersModule**                |         |             |
| Просмотр поставщиков               | ✅      | ✅          |
| **DocumentsModule**                |         |             |
| Создание incoming (приход)         | ✅      | ✅          |
| Создание transfer (перемещение)    | ✅      | ✅          |
| Создание production (производство) | ✅      | ❌          |
| Просмотр всех документов           | ✅      | только свои |
| Отмена документов                  | ✅      | ❌          |
| Печать документов                  | ✅      | ✅          |
| **StockModule**                    |         |             |
| Просмотр остатков                  | ✅      | ✅          |
| Резервирование товаров             | ✅      | ✅          |
| Корректировка остатков             | ✅      | ❌          |
| **ReportsModule**                  |         |             |
| Просмотр отчётов                   | ✅      | ограниченно |
| Экспорт отчётов                    | ✅      | ❌          |

---

### **Детализация по типам документов (актуально):**

| Тип документа             | Может создавать      | Может отменять |
| ------------------------- | -------------------- | -------------- |
| incoming (приход)         | storeKeeper, manager | manager        |
| production (производство) | manager              | manager        |
| transfer (перемещение)    | storeKeeper, manager | manager        |

---

## 🖥️ **Frontend (экраны и доступы)**

### **Основные экраны**

1. **Login**

- Ввод `login` + `password`
- После успешного логина — редирект на список документов или остатки

2. **Документы: список**

- Таблица/лист документов: `number`, `type`, `status`, `date`, склады, автор
- Для storeKeeper показываем только свои документы; для manager — все

3. **Документы: создание/редактирование черновика**

- Выбор типа документа: `incoming` / `transfer` / `production`
- Динамические поля шапки:
    - `incoming`: `supplier_id`, `warehouse_to_id`
    - `transfer`: `warehouse_from_id`, `warehouse_to_id`
    - `production`: `warehouse_from_id` (материалы), `warehouse_to_id` (готовая продукция)
- Табличная часть (позиции): выбор номенклатуры + количество
    - для `production` у каждой позиции есть `direction` (`out` материалы, `in` продукция)

4. **Документы: просмотр**

- Шапка + позиции
- Действия:
    - изменить статус (провести/отменить) по правам
    - печать (если включена)

5. **Остатки (Stock)**

- Просмотр остатков по складам: склад → позиции (quantity/reserved/available)
- Просмотр остатков по номенклатуре: позиция → склады

6. **Номенклатура**

- Список
- Карточка
- Создание/редактирование (только manager)

7. **Склады**

- Список
- Карточка
- Создание/редактирование (только manager)

8. **Поставщики (read-only)**

- Список
- Карточка

9. **Профиль**

- Экран “Я” (`/auth/me`)

### **Доступ по ролям (экраны)**

| Экран                                 | manager  | storeKeeper      |
| ------------------------------------- | -------- | ---------------- |
| Login                                 | ✅       | ✅               |
| Профиль                               | ✅       | ✅               |
| Документы: список                     | ✅ (все) | ✅ (только свои) |
| Документы: incoming                   | ✅       | ✅               |
| Документы: transfer                   | ✅       | ✅               |
| Документы: production                 | ✅       | ❌               |
| Документы: отмена                     | ✅       | ❌               |
| Документы: печать                     | ✅       | ✅               |
| Остатки                               | ✅       | ✅               |
| Номенклатура: просмотр                | ✅       | ✅               |
| Номенклатура: создание/редактирование | ✅       | ❌               |
| Склады: просмотр                      | ✅       | ✅               |
| Склады: создание/редактирование       | ✅       | ❌               |
| Поставщики: просмотр                  | ✅       | ✅               |

---

## 🔌 **Frontend модели / DTO (TypeScript)**

> Примечание: авторизация сейчас cookie-based (`sessionId` в httpOnly cookie), поэтому фронту достаточно вызывать `POST /auth/login` и затем `GET /auth/me`.

```ts
export type UserRole = "manager" | "storeKeeper";

export interface MeResponse {
	id: string; // uuid
	login: string;
	firstname: string;
	lastname: string;
	middlename?: string;
	role: UserRole;
}

export interface LoginRequest {
	login: string;
	password: string;
}

export type DocumentType = "incoming" | "transfer" | "production";
export type DocumentStatus = "draft" | "completed" | "cancelled";

export interface Supplier {
	id: number;
	name: string;
	inn?: string;
	contact_person?: string;
	phone?: string;
	email?: string;
	address?: string;
}

export interface Warehouse {
	id: number;
	name: string;
	address?: string;
}

// В MVP достаточно 2 типов для UI: материалы и готовая продукция.
// Если будет нужно — можно расширить (например, components/полуфабрикаты).
export type ItemType = "material" | "product";

export interface Item {
	id: number;
	code: string;
	name: string;
	unit: string;
	type: ItemType;
	min_quantity: string; // decimal as string
	description?: string;
}

export type DocumentItemDirection = "in" | "out";

export interface DocumentItemInput {
	itemId: number;
	quantity: string; // decimal as string
	direction?: DocumentItemDirection; // обязательно для production
}

export interface CreateDocumentRequest {
	type: DocumentType;
	date?: string; // YYYY-MM-DD
	warehouseFromId?: number;
	warehouseToId?: number;
	supplierId?: number;
	comment?: string;
	items: DocumentItemInput[];
}

export interface DocumentListItem {
	id: number;
	number: string;
	type: DocumentType;
	status: DocumentStatus;
	date: string; // YYYY-MM-DD
	warehouseFromId?: number;
	warehouseToId?: number;
	supplierId?: number;
}

export interface DocumentItem {
	id: number;
	itemId: number;
	quantity: string;
	direction?: DocumentItemDirection;
}

export interface DocumentDetail extends DocumentListItem {
	userId: string;
	comment?: string;
	items: DocumentItem[];
}

export interface StockBalance {
	itemId: number;
	warehouseId: number;
	quantity: string;
	reserved: string;
	available: string;
}
```

---

## 🗃️ **Основные таблицы БД**

### **1. Таблица `users` (Пользователи, актуально)**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,

  -- Авторизация
  login VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,

  -- Данные пользователя
  firstname VARCHAR(255) NOT NULL,
  lastname VARCHAR(255) NOT NULL,
  middlename VARCHAR(255) NOT NULL,

  -- Роль (только 2 варианта)
  role VARCHAR(20) CHECK (role IN ('manager', 'storeKeeper')) NOT NULL,

  -- Системные поля
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Индексы:**

```sql
CREATE INDEX idx_users_login ON users(login);
CREATE INDEX idx_users_role ON users(role);
```

---

### **2. Таблица `warehouses` (Склады)**

```sql
CREATE TABLE warehouses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### **3. Таблица `suppliers` (Поставщики, seed)**

```sql
CREATE TABLE suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  inn VARCHAR(20),
  contact_person VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### **4. Таблица `items` (Номенклатура)**

```sql
CREATE TABLE items (
    id SERIAL PRIMARY KEY,

    -- Идентификация
    code VARCHAR(100) UNIQUE NOT NULL,        -- Внутренний код
    name VARCHAR(255) NOT NULL,               -- Наименование

    -- Классификация
    type VARCHAR(20) CHECK (type IN ('material', 'product')) NOT NULL,

    -- Единицы измерения
    unit VARCHAR(20) NOT NULL,                -- кг, шт, л, м

    -- Цены
    purchase_price DECIMAL(14,2),             -- Средняя цена закупки
    sell_price DECIMAL(14,2),                 -- Цена продажи (для продуктов)

    -- Контроль остатков
    min_quantity DECIMAL(14,3) DEFAULT 0,     -- Минимальный остаток

    -- Дополнительно
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Индексы:**

```sql
CREATE INDEX idx_items_code ON items(code);
CREATE INDEX idx_items_type ON items(type);
CREATE INDEX idx_items_name ON items(name);
```

---

### **5. Таблица `documents` (Документы)**

```sql
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,

    -- Нумерация
    number VARCHAR(50) UNIQUE NOT NULL,       -- ПР-0001, РС-0001

    -- Тип и статус
    type VARCHAR(20) CHECK (type IN ('incoming', 'transfer', 'production')) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('draft', 'completed', 'cancelled')) DEFAULT 'draft',

    -- Метаданные
    user_id UUID NOT NULL REFERENCES users(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    -- Склады. В зависимости от типа документа используются по-разному:
    -- incoming: warehouse_to_id
    -- transfer: warehouse_from_id + warehouse_to_id
    -- production: warehouse_from_id (списание материалов) + warehouse_to_id (оприходование продукции)
    warehouse_from_id INTEGER REFERENCES warehouses(id),
    warehouse_to_id INTEGER REFERENCES warehouses(id),

    -- Поставщик нужен только для incoming
    supplier_id INTEGER REFERENCES suppliers(id),

    -- Сумма и комментарии
    total_amount DECIMAL(16,2) DEFAULT 0,
    comment TEXT,

    -- Печать
    printed_at TIMESTAMPTZ,
    file_url TEXT,

    -- Системные поля
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### **6. Таблица `document_items` (Позиции документа)**

```sql
CREATE TABLE document_items (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

  item_id INTEGER NOT NULL REFERENCES items(id),
  quantity DECIMAL(14,3) NOT NULL,
  price DECIMAL(14,2),
  amount DECIMAL(16,2),

  -- Направление движения (нужно в первую очередь для production):
  -- out = списать со склада материалы, in = оприходовать продукцию
  direction VARCHAR(3) CHECK (direction IN ('in', 'out')),

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Индексы:**

```sql
CREATE INDEX idx_documents_number ON documents(number);
CREATE INDEX idx_documents_date ON documents(date);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_items ON documents USING gin(items);
```

---

### **7. Таблица `stock_balances` (Остатки по складам)**

```sql
CREATE TABLE stock_balances (
    -- Составной первичный ключ
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),

    -- Количества
    quantity DECIMAL(14,3) NOT NULL DEFAULT 0,
    reserved DECIMAL(14,3) DEFAULT 0,

    -- Вычисляемые поля
    available DECIMAL(14,3) GENERATED ALWAYS AS (quantity - reserved) STORED,

    -- Время обновления
    last_updated TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (item_id, warehouse_id)
);
```

**Индексы:**

```sql
CREATE INDEX idx_stock_balances_item_id ON stock_balances(item_id);
CREATE INDEX idx_stock_balances_quantity ON stock_balances(quantity) WHERE quantity > 0;
CREATE INDEX idx_stock_balances_available ON stock_balances(available) WHERE available > 0;
```

---

### **5. Таблица `audit_logs` (Логи действий)**

```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,

    -- Кто
    user_id INTEGER REFERENCES users(id),

    -- Что
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,

    -- Изменения
    old_value JSONB,
    new_value JSONB,

    -- Контекст
    ip_address INET,
    user_agent TEXT,

    -- Время
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Индексы:**

```sql
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## 🔗 **Связи между таблицами**

```
users
  │
  ├─── id ──┬─────────────── user_id (documents)
  │         └─────────────── user_id (audit_logs)
  │
warehouses
  │
  ├─── id ──┬─────────────── warehouse_from_id / warehouse_to_id (documents)
  │         └─────────────── warehouse_id (stock_balances)
  │
suppliers
  │
  └─── id ──────────────── supplier_id (documents)
  │
documents
  │
  └─── id ──────────────── document_id (document_items)
  │
items
  │
  ├─── id ──────────────── item_id (document_items)
  └─── id ──────────────── item_id (stock_balances)

---

## 📊 **Типы документов и их влияние на остатки:**

| Тип документа  | Входные данные           | Влияние на остатки                                  | Кто создаёт          |
| -------------- | ------------------------ | --------------------------------------------------- | -------------------- |
| **incoming**   | Материалы от поставщика  | `warehouse_to.quantity += X`                        | storeKeeper, manager |
| **transfer**   | Перемещение              | `warehouse_from -= X`, `warehouse_to += X`          | storeKeeper, manager |
| **production** | Выпуск продукции         | позиции `out`: `warehouse_from -= X`; позиции `in`: `warehouse_to += Y` | manager              |

---

## 🧩 **Что НЕ входит в MVP**

- `storage_zones` (зоны хранения) — не используем
- `batches` (партии/серии/сроки годности) — не используем

---

**Готов к реализации:** ✅
**Обновлено:** 2025-04-01
**Версия:** 1.0
```
