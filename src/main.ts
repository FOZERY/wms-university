import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from 'src/app.module';
import { TypedConfigService } from 'src/common/modules/config/config.module';
import qs from 'qs';

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);

	app.set('query parser', (str: string) => {
		return qs.parse(str, {
			allowEmptyArrays: false,
			arrayLimit: 100000,
			duplicates: 'combine',
			throwOnLimitExceeded: true,
		});
	});

	const config = app.get(TypedConfigService);

	// Enable CORS for local development with credentials support.
	// Using `origin: true` will reflect the request origin (not '*'),
	// which is required when credentials (cookies) are included.
	app.enableCors({
		origin: true,
		credentials: true,
		allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
		methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
	});

	app.use(cookieParser());

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
