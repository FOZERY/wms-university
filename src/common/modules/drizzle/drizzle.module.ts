import {
	type DynamicModule,
	type InjectionToken,
	Module,
	type ModuleMetadata,
	type OptionalFactoryDependency,
} from '@nestjs/common';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export type DrizzleModuleAsyncOptions = {
	token?: string;
	inject?: Array<InjectionToken | OptionalFactoryDependency>;
	// biome-ignore lint/suspicious/noExplicitAny: need for DI
	useFactory: (...args: any[]) => DrizzleModuleOptions | Promise<DrizzleModuleOptions>;
} & Pick<ModuleMetadata, 'imports'>;

export type DrizzleModuleOptions = {
	connectionString: string;
	pgOptions?: postgres.Options<Record<string, postgres.PostgresType>>;
};

@Module({})
export class DrizzleModule {
	public static registerAsync(options: DrizzleModuleAsyncOptions): DynamicModule {
		const token = options.token || PostgresJsDatabase;
		return {
			exports: [token],
			global: true,
			imports: [...(options.imports || [])],
			module: DrizzleModule,
			providers: [
				{
					inject: options.inject || [],
					provide: token,
					useFactory: async (...args: unknown[]) => {
						const moduleOptions = await options.useFactory(...args);

						const pgClient = postgres(moduleOptions.connectionString, moduleOptions.pgOptions);
						return drizzle(pgClient, {
							casing: 'snake_case',
						});
					},
				},
			],
		};
	}
}
