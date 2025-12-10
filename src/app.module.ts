import { Module } from '@nestjs/common';
import { TypedConfigModule, TypedConfigService } from 'src/common/modules/config/config.module';
import { DrizzleModule } from 'src/common/modules/drizzle/drizzle.module';
import { authControllers, authProviders } from 'src/modules/auth';

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
	],
	providers,
})
export class AppModule {}
