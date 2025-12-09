import { Module } from '@nestjs/common';
import { TypedConfigModule } from 'src/common/modules/config/config.module';
import { AuthController } from 'src/modules/auth/auth.controller';

@Module({
	controllers: [AuthController],
	exports: [],
	imports: [TypedConfigModule],
})
export class AppModule {}
