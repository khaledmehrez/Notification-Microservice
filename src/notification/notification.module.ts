import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from './notification.schema';
import { NotificationControllerV0 } from './notification-v0.controller';
import { WebsocketModule } from '../websocket-gateway/websocket.module';
import { BullModule } from '@nestjs/bull';
import { NotificationConsumer } from './notification.consumer';
import { JwtStrategy } from '../guards/jwt.strategy';

/**
 * Notification module that handles user creation, deletion, pictures, tags, etc...
 */
@Module({
	imports: [
		MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }]),
		BullModule.registerQueue({
			name: 'notification-ms',
		}),
		WebsocketModule,
	],
	providers: [NotificationService, NotificationConsumer, JwtStrategy],
	exports: [NotificationService],
	controllers: [NotificationControllerV0],
})
export class NotificationModule {}
