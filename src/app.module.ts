import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { NotificationModule } from './notification/notification.module';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { WebsocketModule } from './websocket-gateway/websocket.module';
import { BullModule } from '@nestjs/bull';
import { MongoDriverModule } from './mongo-driver/mongo-driver.module';
import { NotificationContentModule } from './notification-content/notification-content.module';
import { FcmModule } from './fcm/fcm.module';
import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import { validateEnv } from './env.validation';
import { ScheduleModule } from '@nestjs/schedule';
import { CronJobsModule } from './cron-jobs/cron-jobs.module';
import { JwtStrategy } from './guards/jwt.strategy';
import { JwtModule } from '@nestjs/jwt';

@Module({
	imports: [
		ConfigModule.forRoot({ validate: validateEnv, isGlobal: true }),
		ScheduleModule.forRoot(),
		WinstonModule.forRoot({
			handleExceptions: true,
			transports: [
				new winston.transports.Console({
					format:
						process.env.DEBUG?.toString() === 'true'
							? winston.format.combine(
									winston.format.timestamp(),
									winston.format.ms(),
									winston.format.json(),
									nestWinstonModuleUtilities.format.nestLike('NOTIFICATION-MS', { prettyPrint: true }),
									winston.format.align(),
									winston.format.colorize({ all: true }),
							  )
							: winston.format.combine(winston.format.timestamp(), winston.format.ms(), winston.format.json()),
				}),
			],
		}),
		BullModule.forRoot({
			redis: {
				host: process.env.BULL_REDIS_HOST,
				port: parseInt(process.env.BULL_REDIS_PORT),
				password: process.env.BULL_REDIS_PASSWORD,
				sentinels: process.env.BULL_SENTINEL_HOST
					? [
							{
								host: process.env.BULL_SENTINEL_HOST,
								port: parseInt(process.env.BULL_SENTINEL_PORT),
							},
					  ]
					: undefined,
				sentinelPassword: process.env.BULL_SENTINEL_PASSWORD,
				name: process.env.BULL_SENTINEL_NAME,
			},
		}),
		MongoDriverModule.register({ mongoURL: process.env.MONGO_SERVER_URL }),
		NotificationModule,
		NotificationContentModule,
		WebsocketModule,
		FcmModule,
		MongooseModule.forRoot(process.env.MONGO_URL, {
			maxPoolSize: 200,
		}),
		PassportModule,
		JwtModule.register({
			secret: process.env.JWT_ACCESS_TOKEN_SECRET,
			secretOrPrivateKey: process.env.JWT_ACCESS_TOKEN_SECRET,
			signOptions: { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME },
		}),
		CronJobsModule,
	],
	controllers: [AppController],
	providers: [JwtStrategy],
})
export class AppModule {}
