import { Global, Module } from '@nestjs/common';
import { NotificationContentControllerV0 } from './notification-content-v0.controller';
import { MongooseModule } from '@nestjs/mongoose';

import { NotificationContent, NotificationContentSchema } from './notification-content.schema';
import { NotificationContentService } from './notification-content.service';

/**
 * Notification content  module that handles content of notification sent to user...
 */
@Global()
@Module({
	imports: [MongooseModule.forFeature([{ name: NotificationContent.name, schema: NotificationContentSchema }])],
	providers: [NotificationContentService],
	exports: [NotificationContentService],
	controllers: [NotificationContentControllerV0],
})
export class NotificationContentModule {}
