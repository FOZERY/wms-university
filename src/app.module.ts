import { Module } from '@nestjs/common';
import { TypedConfigModule, TypedConfigService } from 'src/common/modules/config/config.module';
import { authControllers, authProviders } from 'src/modules/auth';
import { suppliersControllers, suppliersProviders } from 'src/modules/suppliers';
import { DrizzleModule } from './common/modules/drizzle/drizzle.module';
import { RedisModule } from './common/modules/redis/redis.module';
import { documentsControllers, documentsProviders } from './modules/documents';
import { nomenclatureControllers, nomenclatureProviders } from './modules/nomenclature';
import { statsControllers, statsProviders } from './modules/stats';
import { stockControllers, stockProviders } from './modules/stock';
import { warehousesControllers, warehousesProviders } from './modules/warehouses';
import { usersProviders } from './modules/users';

const controllers = [
	...authControllers,
	...suppliersControllers,
	...nomenclatureControllers,
	...warehousesControllers,
	...stockControllers,
	...statsControllers,
	...documentsControllers,
];
const providers = [
	...authProviders,
	...usersProviders,
	...usersProviders,
	...suppliersProviders,
	...nomenclatureProviders,
	...warehousesProviders,
	...stockProviders,
	...statsProviders,
	...documentsProviders,
];

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
