import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';
import { TypedConfigService } from '../config/config.module';

@Global()
@Module({
	providers: [
		{
			inject: [TypedConfigService],
			provide: Redis,
			useFactory: (config: TypedConfigService) => {
				return new Redis(config.get('REDIS_CONNECTION_STRING'));
			},
		},
	],
	exports: [Redis],
})
export class RedisModule {}
