import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from 'src/app.module';
import { TypedConfigService } from 'src/common/modules/config/config.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	const config = app.get(TypedConfigService);

	// Настройка Swagger
	const swaggerConfig = new DocumentBuilder()
		.setTitle('WMS University API')
		.setDescription('API для системы складского учёта')
		.setVersion('1.0')
		.addTag('wms')
		.build();

	const document = SwaggerModule.createDocument(app, swaggerConfig);
	SwaggerModule.setup('swagger', app, document);

	await app.listen(config.get('PORT'));
}
bootstrap();
