import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import path from "node:path";
import postgres from "postgres";
import { UserRoles } from "src/common/enums/roles";
import { usersTable } from "src/common/modules/drizzle/schema";

const envFile = `.env.development`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

async function main() {
	const connectionString = process.env.DB_CONNECTION_STRING;
	if (!connectionString) {
		console.error("Environment variable DB_CONNECTION_STRING is required");
		process.exit(1);
	}

	const sql = postgres(connectionString);
	const db = drizzle(sql, { casing: "snake_case" });

	const managerPassword = "manager123";
	const storeKeeperPassword = "storekeeper123";

	const managerHash = await bcrypt.hash(managerPassword, 10);
	const storeKeeperHash = await bcrypt.hash(storeKeeperPassword, 10);

	const users = [
		{
			role: UserRoles.Manager,
			login: "manager",
			passwordHash: managerHash,
			firstname: "Manager",
			lastname: "User",
			middlename: "",
		},
		{
			role: UserRoles.StoreKeeper,
			login: "storekeeper",
			passwordHash: storeKeeperHash,
			firstname: "Store",
			lastname: "Keeper",
			middlename: "",
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
			console.warn(
				`Could not insert user ${u.login}:`,
				err instanceof Error ? err.message : err
			);
		}
	}

	await sql.end();
	process.exit(0);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
