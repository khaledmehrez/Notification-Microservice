import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AbstractService } from '../abstract/abstract.service';
import { Notification, Notifications } from './notification.schema';
import { UpdateNotificationsSettingsDto } from './dtos/notification.dto';
import { renameKeys } from '../utils/misc.utils';
import { WebsocketGateway } from '../websocket-gateway/websocket.gateway';
import { maxNotificationsCount } from '../config/notification-config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { FcmService } from '../fcm/fcm.service';
import { CreateFcmNotificationType, NotificationContentType } from '../types/notification.types';
import { NotificationContent } from '../notification-content/notification-content.schema';
import { NotificationContentService } from '../notification-content/notification-content.service';
import { SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class NotificationService extends AbstractService<Notification> {
	constructor(
		@InjectModel(Notification.name) protected notificationModel: Model<Notification>,
		protected webSocketGateway: WebsocketGateway,
		protected fcmService: FcmService,
		protected notificationContentService: NotificationContentService,
		@InjectQueue('notification-ms') protected notificationQueue: Queue,
		private schedulerRegistry: SchedulerRegistry,
	) {
		super(notificationModel);
	}

	protected modelName = Notification.name;

	async updateNotificationsSettings(
		id: Types.ObjectId,
		notificationsSettings: UpdateNotificationsSettingsDto,
	): Promise<Notification> {
		const keysMap = {
			newMatch: 'settings.newMatch',
			newMessage: 'settings.newMessage',
			someoneLikedYou: 'settings.someoneLikedYou',
			firstMessageSeen: 'settings.firstMessageSeen',
			firstMessageReceived: 'settings.firstMessageReceived',
		};
		const settings = renameKeys(keysMap, notificationsSettings);
		return this.findOneAndUpdate({ user: id }, { $set: settings });
	}

	async addUserNotification(userId: Types.ObjectId, notification: Partial<Notifications>) {
		const savedNotificationsUser1 = await this.findOne({ user: userId });
		const updates = [];
		if (savedNotificationsUser1.notifications.length >= maxNotificationsCount) {
			updates.push(
				this.updateOne(
					{ user: userId },
					{
						$pop: {
							notifications: -1,
						},
					},
				),
			);
		}
		updates.push(
			this.updateOne(
				{ user: userId },
				{
					$push: {
						notifications: notification,
					},
				},
			),
		);
		return updates;
	}

	async getUserTokens(userId: Types.ObjectId): Promise<Notification> {
		return this.findOne({ user: userId }, ['fcmTokens', '_id']);
	}

	async createFcmNotification(createFcmNotification: CreateFcmNotificationType) {
		if (createFcmNotification.unseenCount > 0) {
			//create bodyFcm
			let body: string;
			body =
				createFcmNotification.unseenCount === 1
					? createFcmNotification.notificationContent.contentForOne
					: createFcmNotification.notificationContent.contentForMany.replace(
							'(n)',
							createFcmNotification.unseenCount.toString(),
					  );
			if (createFcmNotification.fromName) {
				body = body.replace('(FROM-X)', createFcmNotification.fromName);
			}
			if (createFcmNotification.toName) {
				body = body.replace('(TO-X)', createFcmNotification.toName);
			}
			if (createFcmNotification.variables && createFcmNotification.variables.length > 0) {
				createFcmNotification.variables.forEach((variable, i) => {
					body = body.replace(`V-${i}`, variable);
				});
			}

			//send notification on fcm
			const fcmNotification = {
				notification: {
					title: 'Lovester',
					body: body,
					icon: createFcmNotification.image,
					tag: createFcmNotification.notificationContent.tag,
				},
				fcmTokens: createFcmNotification.fcmTokens ? createFcmNotification.fcmTokens : [],
				data: createFcmNotification.data,
				userId: createFcmNotification.userId,
			};

			if (fcmNotification) this.fcmService.addNotificationFcm(fcmNotification);
		}
	}

	async createNotificationContentUser(
		notificationContent: NotificationContent,
		preferredLanguageUser: string,
	): Promise<NotificationContentType> {
		return {
			_id: notificationContent._id,
			contentForOne: notificationContent.contentForOne[preferredLanguageUser],
			contentForMany: notificationContent.contentForMany[preferredLanguageUser],
			name: notificationContent.name,
			tag: notificationContent.name,
		};
	}

	async getUserPicture(user: any): Promise<string> {
		return user && user.pictures.length > 0
			? user.pictures.find((picture) => picture.index === 0).url
			: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';
	}

	async getRandomNotificationContent(name: string): Promise<NotificationContent> {
		const notificationContents = await this.notificationContentService.find({ name: name });
		const randomNumber = Math.floor(Math.random() * notificationContents.length);
		return notificationContents[randomNumber];
	}
}
