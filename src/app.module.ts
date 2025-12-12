import { Module } from '@nestjs/common';
import { TypedConfigModule, TypedConfigService } from 'src/common/modules/config/config.module';
import { authControllers, authProviders } from 'src/modules/auth';
import { DrizzleModule } from './common/modules/drizzle/drizzle.module';
import { RedisModule } from './common/modules/redis/redis.module';

const controllers = [...authControllers];
const providers = [...authProviders];

@Module({
	controllers,
	imports: [
		TypedConfigModule,
		DrizzleModule.registerAsync({
			inject: [TypedConfigService],
			useFactory: (config: TypedConfigService) => ({
				connectionString: config.get('DB_CONNECTION_STRING'),
			}),
		}),
		RedisModule,
	],
	providers,
})
export class AppModule {}
