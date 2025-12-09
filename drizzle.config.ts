import path from 'node:path';
import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

const envFile = `.env.${process.env.NODE_ENV?.toLowerCase() || 'development'}`;
dotenv.config({ path: path.resolve(__dirname, envFile) });
export default defineConfig({
	casing: 'snake_case',
	dbCredentials: {
		// biome-ignore lint/style/noNonNullAssertion: DB_URL is always set in our environments
		url: process.env.DB_URL!,
	},
	dialect: 'postgresql',
	out: `${__dirname}/migrations`,
	schema: `${__dirname}/src/infrastructure/drizzle/schema.ts`,
});
