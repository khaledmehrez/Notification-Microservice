import { Types } from 'mongoose';
import { SettingsMapDto } from '../notification.types';

export class NotificationsResponseType {
	seen: boolean;

	type: string;

	content: any;

	picture: string;

	_id: Types.ObjectId;
}

export class NotificationResponseType {
	user: Types.ObjectId;

	fcmTokens: string[];

	settings: SettingsMapDto;

	notifications?: NotificationsResponseType[];

	_id: Types.ObjectId;
}
