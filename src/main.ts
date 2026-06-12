import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { RequestInterceptor } from './abstract/request.interceptor';
import { ValidationPipe, VERSION_NEUTRAL, VersioningType } from '@nestjs/common';
import fastifyCookie from 'fastify-cookie';
import fastifyHelmet from 'fastify-helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RedisIoAdapter } from './websocket-gateway/redis-io-adapter.adatper';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER, WINSTON_MODULE_PROVIDER } from 'nest-winston';
import './dd-tracer';

async function bootstrap() {
	const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter({ logger: false }));

	app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
	app.useGlobalInterceptors(new RequestInterceptor());
	await app.register(fastifyCookie, {
		secret: 'custom-cookies', // for cookies signature
	});
	app.enableCors({ origin: process.env.ORIGIN.split(','), credentials: true });
	app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

	app.enableVersioning({ defaultVersion: VERSION_NEUTRAL, type: VersioningType.URI });
	await app.register(fastifyHelmet, {
		contentSecurityPolicy: {
			directives: {
				defaultSrc: [`'self'`],
				styleSrc: [`'self'`, `'unsafe-inline'`],
				imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
				scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
			},
		},
	});

	const config = new DocumentBuilder()
		.setTitle('Lovester - Notification MS')
		.setDescription('Lovester - Notification MS API description')
		.setVersion('0.0.1')
		.addTag('Notification MS')
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('docs', app, document, {
		swaggerUrl: 'json',
	});

	const configService = app.get(ConfigService);
	const winstonLogger = app.get(WINSTON_MODULE_PROVIDER);

	const redisIoAdapter = new RedisIoAdapter(app, configService, winstonLogger);
	await redisIoAdapter.connectToRedis();

	app.useWebSocketAdapter(redisIoAdapter);

	await app.listen(process.env.DEFAULT_PORT || process.env.NOTIFICATION_MS_PORT, '0.0.0.0');
}

bootstrap();
