import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AbstractService } from '../abstract/abstract.service';
import { NotificationContent } from './notification-content.schema';

@Injectable()
export class NotificationContentService extends AbstractService<NotificationContent> {
	constructor(@InjectModel(NotificationContent.name) protected notificationContentModel: Model<NotificationContent>) {
		super(notificationContentModel);
	}

	protected modelName = NotificationContent.name;

	async getNotificationContent(name: string, preferredLanguage?: string): Promise<NotificationContent> {
		return this.findOne(
			name ? { name: name } : {},
			preferredLanguage
				? ['name', `contentForOne.${preferredLanguage}`, `contentForMany.${preferredLanguage}`, 'tag']
				: {},
		);
	}
}
