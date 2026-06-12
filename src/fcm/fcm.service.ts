import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FcmNotificationType, FcmType } from './types/fcm.types';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class FcmService {
	constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}
	addNotificationFcm(fcmBody: FcmType): string {
		if (fcmBody.fcmTokens.length > 0) {
			try {
				admin
					.messaging()
					.sendToDevice(fcmBody.fcmTokens, {
						notification: {
							title: fcmBody.notification.title,
							body: fcmBody.notification.body,
							icon: fcmBody.notification.icon,
							tag: fcmBody.notification.tag,
						},

						data: { ...fcmBody.data, tag: fcmBody.notification.tag },
					})
					.then(
						(value) => {
							this.logger.info('FCM MESSAGE SENT', value);
						},
						(reason) => {
							this.logger.error('FCM MESSAGE FAILED', reason);
						},
					);

				return 'FCM_NOTIFICATION_SENT';
			} catch (e) {
				this.logger.error(e.message);
			}
		} else {
			this.logger.error(`FCM_TOKEN_NOT_EXIST_FOT_USER_ID_${fcmBody.userId}`);
		}
	}

	async subscribeToTopic(topic: string, fcmToken: string) {
		try {
			await admin.messaging().subscribeToTopic(fcmToken, topic);
			this.logger.info('FCM_TOPIC_REGISTERED');
		} catch (e) {
			this.logger.error(e.message);
		}
	}
	async sendToTopic(topic: string, fcmNotification: FcmNotificationType) {
		try {
			admin
				.messaging()
				.sendToTopic(topic, {
					notification: {
						title: fcmNotification.title,
						body: fcmNotification.body,
						icon: fcmNotification.icon,
						tag: fcmNotification.tag,
					},
				})
				.then(
					(value) => {
						this.logger.info('FCM MESSAGE SENT TO TOPIC', value);
					},
					(reason) => {
						this.logger.error('FCM MESSAGE TO TOPIC FAILED', reason);
					},
				);

			return 'FCM_NOTIFICATION_SENT';
		} catch (e) {
			this.logger.error(e.message);
		}
	}
}
