import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { reset } from "drizzle-seed";
import path from "node:path";
import postgres from "postgres";
import * as schema from "src/common/modules/drizzle/schema";

const envFile = `.env.development`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

async function main() {
	const connectionString = process.env.DB_CONNECTION_STRING;
	if (!connectionString) {
		console.error("Environment variable DB_CONNECTION_STRING is required");
		process.exit(1);
	}

	const sql = postgres(connectionString);
	const db = drizzle(sql);

	await reset(db, schema);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
