import path from 'node:path';
import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

const envFile = `.env.${process.env.NODE_ENV?.toLowerCase() || 'development'}`;
dotenv.config({ path: path.resolve(__dirname, envFile) });

console.log(__dirname);

export default defineConfig({
	casing: 'snake_case',
	dbCredentials: {
		// biome-ignore lint/style/noNonNullAssertion: DB_URL is always set in our environments
		url: process.env.DB_CONNECTION_STRING!,
	},
	dialect: 'postgresql',
	out: './migrations',
	schema: './src/common/modules/drizzle/schema.ts',
});
