import { ExecutionContext, Injectable, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { TestingModule, Test } from '@nestjs/testing';
import { WsException } from '@nestjs/websockets';
import fastifyCookie from 'fastify-cookie';
import fastifyHelmet from 'fastify-helmet';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { RequestInterceptor } from '../src/abstract/request.interceptor';
import { validateEnv } from '../src/env.validation';
import { FcmService } from '../src/fcm/fcm.service';
import { FcmType, FcmNotificationType } from '../src/fcm/types/fcm.types';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston/dist/winston.utilities';
import { NotificationConsumer } from '../src/notification/notification.consumer';
import { NotificationModule } from '../src/notification/notification.module';
import { WebsocketModule } from '../src/websocket-gateway/websocket.module';
import { WsGuard } from '../src/websocket-gateway/ws-jwt.guard';
import { FcmModuleMock } from './test-utils/fcm.module.mock';
import { rootMongooseTestModule } from './test-utils/mongo/mongooseTestModule';
import { NotificationContentModule } from '../src/notification-content/notification-content.module';
import { MongoDriverService } from '../src/mongo-driver/mongo-driver.service';
import { MongoDriverModule } from '../src/mongo-driver/mongo-driver.module';
import { JwtAuthGuard } from '../src/guards/jwt-auth.guard';
import * as io from 'socket.io-client';
import { accessTokenUser1, accessTokenUser2, accessTokenUser3 } from './variables';
import { ScheduleModule } from '@nestjs/schedule';

@Injectable()
export class BeforeAll {
	public app: NestFastifyApplication;
	public mongod;
	public id = '62221be39537739e8674d981';
	public socketUser1;
	public socketUser2;
	public socketUser3;
	public mongoDriverService: MongoDriverService;
	public notificationConsumer: NotificationConsumer;
	public role;

	public socketCall = jest.fn();
	// eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
	public fcmServiceAddNotification = jest.fn((_fcmBody: FcmType) => {});
	// eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
	public fcmServiceSubscribeToTopic = jest.fn((_topic: string, _fcmToken: string) => {});
	// eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
	public fcmServiceSendToTopic = jest.fn((_topic: string, _fcmNotification: FcmNotificationType) => {});
	public fcmServiceMock = {
		addNotificationFcm: this.fcmServiceAddNotification,
		subscribeToTopic: this.fcmServiceSubscribeToTopic,
		sendToTopic: this.fcmServiceSendToTopic,
	};

	async close() {
		await this.mongod.stop();
		await this.app.close();
	}

	async createApp() {
		this.mongod = await MongoMemoryServer.create();
		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [
				ConfigModule.forRoot({ isGlobal: true, validate: validateEnv, envFilePath: './test/.env.test' }),
				ScheduleModule.forRoot(),
				MongoDriverModule.register({ mongoURL: this.mongod.getUri() }),
				rootMongooseTestModule({ uri: this.mongod.getUri() }),
				PassportModule,
				NotificationModule,
				NotificationContentModule,
				WebsocketModule,
				FcmModuleMock,
				JwtModule.register({
					secret: process.env.APP_SECRET,
					secretOrPrivateKey: process.env.APP_SECRET,
					signOptions: { expiresIn: '24h' },
				}),
				WinstonModule.forRoot({
					handleExceptions: true,
					transports: [
						new winston.transports.Console({
							format: winston.format.combine(
								winston.format.ms(),
								winston.format.timestamp(),
								winston.format.json(),
								winston.format.align(),
								winston.format.colorize({ all: true }),
								nestWinstonModuleUtilities.format.nestLike('NOTIFICATION-MS', { prettyPrint: true }),
							),
						}),
					],
				}),
			],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({
				canActivate: (context: ExecutionContext) => {
					const req = context.switchToHttp().getRequest();
					req.user = { user: this.id, roles: this.role };
					return true;
				},
			})
			.overrideGuard(WsGuard)
			.useValue({
				canActivate: () => {
					try {
						return true;
					} catch (ex) {
						throw new WsException({ status: 401, error: 'unauthorized' });
					}
				},
			})
			.overrideProvider(FcmService)
			.useValue(this.fcmServiceMock)
			.compile();

		this.app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
		this.mongoDriverService = moduleRef.get<MongoDriverService>(MongoDriverService);
		this.notificationConsumer = moduleRef.get<NotificationConsumer>(NotificationConsumer);
		this.app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
		this.app.useGlobalInterceptors(new RequestInterceptor());
		// Enable cors
		await this.app.register(fastifyCookie, {
			secret: 'custom-cookies', // for cookies signature
		});
		this.app.enableCors({ origin: process.env.ORIGIN, credentials: true });
		this.app.useLogger(this.app.get(WINSTON_MODULE_NEST_PROVIDER));

		await this.app.register(fastifyHelmet, {
			contentSecurityPolicy: {
				directives: {
					defaultSrc: [`'self'`],
					styleSrc: [`'self'`, `'unsafe-inline'`],
					imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
					scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
				},
			},
		});

		await this.app.init();

		this.socketUser1 = io.connect(`http://localhost:3010`, {
			transports: ['websocket'],
			secure: false,
			reconnection: true,
			rejectUnauthorized: true,
			path: '/notification-socket',
			auth: {
				user: '62221be39537739e8674d981',
				token: accessTokenUser1,
			},
		});

		this.socketUser2 = io.connect(`http://localhost:3010`, {
			transports: ['websocket'],
			path: '/notification-socket',
			secure: false,
			reconnection: true,
			rejectUnauthorized: true,
			auth: {
				user: '62221be39537739e8674d982',
				token: accessTokenUser2,
			},
		});

		this.socketUser3 = io.connect(`http://localhost:3010`, {
			transports: ['websocket'],
			path: '/notification-socket',
			secure: false,
			reconnection: true,
			rejectUnauthorized: true,
			auth: {
				user: '62221be39537739e8674d983',
				token: accessTokenUser3,
			},
		});

		return this.app;
	}
}
