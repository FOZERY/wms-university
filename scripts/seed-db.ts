import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import path from 'node:path';
import postgres from 'postgres';
import { UserRoles } from 'src/common/enums/roles';
import { ItemType } from 'src/common/enums/item-type';
import {
	usersTable,
	suppliersTable,
	warehousesTable,
	itemsTable,
} from 'src/common/modules/drizzle/schema';

const envFile = `.env.development`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

async function main() {
	const connectionString = process.env.DB_CONNECTION_STRING;
	if (!connectionString) {
		console.error('Environment variable DB_CONNECTION_STRING is required');
		process.exit(1);
	}

	const sql = postgres(connectionString);
	const db = drizzle(sql, { casing: 'snake_case' });

	const managerPassword = 'manager123';
	const storeKeeperPassword = 'storekeeper123';

	const managerHash = await bcrypt.hash(managerPassword, 10);
	const storeKeeperHash = await bcrypt.hash(storeKeeperPassword, 10);

	const users = [
		{
			role: UserRoles.Manager,
			login: 'manager',
			passwordHash: managerHash,
			firstname: 'Иван',
			lastname: 'Петров',
			middlename: 'Иванович',
		},
		{
			role: UserRoles.StoreKeeper,
			login: 'storekeeper',
			passwordHash: storeKeeperHash,
			firstname: 'Алексей',
			lastname: 'Сидоров',
			middlename: 'Сергеевич',
		},
	];

	for (const u of users) {
		try {
			await db.insert(usersTable).values({
				firstname: u.firstname,
				lastname: u.lastname,
				middlename: u.middlename,
				login: u.login,
				passwordHash: u.passwordHash,
				role: u.role,
			});
			console.log(`Inserted user ${u.login}`);
		} catch (err: unknown) {
			console.warn(`Could not insert user ${u.login}:`, err instanceof Error ? err.message : err);
		}
	}

	// Seed suppliers
	const suppliers = [
		{
			name: 'ООО СтройСнаб',
			inn: '7701234567',
			contactPerson: 'Петров П.С.',
			phone: '+7 (495) 123-45-67',
			email: 'info@stroysnab.ru',
			address: 'г. Москва, ул. Промышленная, д. 10',
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			name: 'Завод Металлоконструкций',
			inn: '7812345678',
			contactPerson: 'Иванова Н.А.',
			phone: '+7 (812) 234-56-78',
			email: 'sales@zmk.ru',
			address: 'г. Санкт-Петербург, пр. Заводской, д. 5',
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			name: 'ТехПартнер',
			inn: '7723456789',
			contactPerson: 'Смирнов А.В.',
			phone: '+7 (495) 987-65-43',
			email: 'contact@techpartner.ru',
			address: 'г. Москва, ул. Технологическая, д. 2',
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	];

	for (const s of suppliers) {
		try {
			await db.insert(suppliersTable).values(s);
			console.log(`Inserted supplier ${s.name}`);
		} catch (err: unknown) {
			console.warn(
				`Could not insert supplier ${s.name}:`,
				err instanceof Error ? err.message : err
			);
		}
	}

	// Seed warehouses
	const warehouses = [
		{
			name: 'Склад материалов Восточный',
			address: 'г. Москва, ул. Восточная, д. 1',
			capacity: 1000,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			name: 'Склад материалов Западный',
			address: 'г. Москва, ул. Западная, д. 2',
			capacity: 1000,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			name: 'Склад готовой продукции',
			address: 'г. Москва, ул. Промышленная, д. 20',
			capacity: 500,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	];

	for (const w of warehouses) {
		try {
			await db.insert(warehousesTable).values(w);
			console.log(`Inserted warehouse ${w.name}`);
		} catch (err: unknown) {
			console.warn(
				`Could not insert warehouse ${w.name}:`,
				err instanceof Error ? err.message : err
			);
		}
	}

	// Seed items (materials + finished products)
	const items = [
		// Materials
		{
			code: 'MAT-001',
			name: 'Блок двигателя',
			type: ItemType.Material,
			unit: 'шт',
			purchasePrice: '15000.00',
			sellPrice: null,
			minQuantity: '1',
			description: 'Чугунный блок для двигателей модели T',
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			code: 'MAT-002',
			name: 'Гидронасос',
			type: ItemType.Material,
			unit: 'шт',
			purchasePrice: '8500.00',
			sellPrice: null,
			minQuantity: '2',
			description: 'Насос гидравлической системы',
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			code: 'MAT-003',
			name: 'Ось задняя',
			type: ItemType.Material,
			unit: 'шт',
			purchasePrice: '12000.00',
			sellPrice: null,
			minQuantity: '1',
			description: 'Задняя ось для сельхозтехники',
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			code: 'MAT-004',
			name: 'Шланг гидравлический',
			type: ItemType.Material,
			unit: 'м',
			purchasePrice: '120.00',
			sellPrice: null,
			minQuantity: '10',
			description: 'Усиленный гидравлический шланг',
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			code: 'MAT-005',
			name: 'Болт M16',
			type: ItemType.Material,
			unit: 'шт',
			purchasePrice: '5.00',
			sellPrice: null,
			minQuantity: '100',
			description: 'Крепёжный болт M16 класс прочности 8.8',
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			code: 'MAT-006',
			name: 'Фильтр масляный',
			type: ItemType.Material,
			unit: 'шт',
			purchasePrice: '350.00',
			sellPrice: null,
			minQuantity: '20',
			description: 'Фильтр масляный для двигателей серии T',
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			code: 'MAT-007',
			name: 'Ремень приводной',
			type: ItemType.Material,
			unit: 'шт',
			purchasePrice: '450.00',
			sellPrice: null,
			minQuantity: '30',
			description: 'Ремень для трансмиссии',
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			code: 'MAT-008',
			name: 'Фара передняя',
			type: ItemType.Material,
			unit: 'шт',
			purchasePrice: '1200.00',
			sellPrice: null,
			minQuantity: '10',
			description: 'Фара передняя галогенная',
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			code: 'MAT-009',
			name: 'Радиатор охлаждения',
			type: ItemType.Material,
			unit: 'шт',
			purchasePrice: '7500.00',
			sellPrice: null,
			minQuantity: '2',
			description: 'Радиатор системы охлаждения',
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			code: 'MAT-010',
			name: 'Сальник передний',
			type: ItemType.Material,
			unit: 'шт',
			purchasePrice: '80.00',
			sellPrice: null,
			minQuantity: '200',
			description: 'Сальник валов передний',
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		// Finished products
		{
			code: 'PROD-100',
			name: 'Трактор T-100',
			type: ItemType.Product,
			unit: 'шт',
			purchasePrice: '250000.00',
			sellPrice: '300000.00',
			minQuantity: '0',
			description: 'Универсальный трактор малого класса',
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			code: 'PROD-200',
			name: 'Трактор T-200',
			type: ItemType.Product,
			unit: 'шт',
			purchasePrice: '400000.00',
			sellPrice: '480000.00',
			minQuantity: '0',
			description: 'Трактор среднего класса с гидравлической навеской',
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			code: 'PROD-300',
			name: 'Трактор T-300',
			type: ItemType.Product,
			unit: 'шт',
			purchasePrice: '650000.00',
			sellPrice: '780000.00',
			minQuantity: '0',
			description: 'Тяжёлый трактор для полевых работ',
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	];

	for (const it of items) {
		try {
			await db.insert(itemsTable).values(it as any);
			console.log(`Inserted item ${it.code} - ${it.name}`);
		} catch (err: unknown) {
			console.warn(`Could not insert item ${it.code}:`, err instanceof Error ? err.message : err);
		}
	}

	await sql.end();
	process.exit(0);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
