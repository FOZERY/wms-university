import { Global, Injectable, Module } from '@nestjs/common';
import { ConfigModule, ConfigService, Path, PathValue } from '@nestjs/config';
import Type, { Static } from 'typebox';
import Value from 'typebox/value';

// biome-ignore lint/nursery/useExplicitType: Use explicit type
const configSchema = Type.Object({
	DB_CONNECTION_STRING: Type.String({ format: 'uri' }),
	NODE_ENV: Type.Union(
		[Type.Literal('development'), Type.Literal('production'), Type.Literal('test')],
		{ default: 'development' }
	),
	PORT: Type.Integer({ default: 3000 }),
	REDIS_CONNECTION_STRING: Type.String({ format: 'uri' }),
	SESSION_SECRET: Type.String({ minLength: 32 }),
	SESSION_MAX_AGE: Type.Integer({ default: 3600000 }), // 1 hour
});

function validate(config: Record<string, unknown>): ConfigType {
	const validateConfig = Value.Parse(configSchema, config);
	return validateConfig;
}

export interface ConfigType extends Static<typeof configSchema> {}

@Injectable()
export class TypedConfigService extends ConfigService<ConfigType, true> {
	public get<P extends Path<ConfigType>>(propertyPath: P): PathValue<ConfigType, P> {
		return super.get(propertyPath, { infer: true });
	}
}

@Global()
@Module({
	exports: [TypedConfigService],
	imports: [
		ConfigModule.forRoot({
			cache: true,
			envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
			ignoreEnvFile: process.env.NODE_ENV === 'production',
			isGlobal: true,
			skipProcessEnv: process.env.NODE_ENV !== 'production',
			validate: validate,
			validatePredefined: process.env.NODE_ENV === 'production',
		}),
	],
	providers: [TypedConfigService],
})
export class TypedConfigModule {}
