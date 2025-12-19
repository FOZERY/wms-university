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

	// Public JSON export of OpenAPI document for tooling/CI. Serves /openapi.json
	// Note: this uses the underlying HTTP adapter (Express) to expose a simple GET endpoint.
	app.getHttpAdapter()?.get('/openapi.json', (_req, res) => res.json(document));

	await app.listen(config.get('PORT'));
}
bootstrap();
