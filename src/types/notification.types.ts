import { Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { InteractionModeEnum } from './interaction.type';

export const SettingsMapSchema = {
	newMatch: Boolean,
	newMessage: Boolean,
	someoneLikedYou: Boolean,
	firstMessageSeen: Boolean,
	firstMessageReceived: Boolean,
};

export type SettingsMap = {
	newMatch: boolean;
	newMessage: boolean;
	someoneLikedYou: boolean;
	firstMessageSeen: boolean;
	firstMessageReceived: boolean;
};

export class SettingsMapDto {
	@ApiProperty()
	newMatch: boolean;

	@ApiProperty()
	newMessage: boolean;

	@ApiProperty()
	someoneLikedYou: boolean;

	@ApiProperty()
	firstMessageSeen: boolean;

	@ApiProperty()
	firstMessageReceived: boolean;
}

export type NotificationType = {
	seen: boolean;
	type: string;
	content: any;
	picture: string;
	mode?: InteractionModeEnum;
};

export type CreateFcmNotificationType = {
	userId: Types.ObjectId;
	notificationContent: NotificationContentType;
	data: any;
	image: string;
	unseenCount: number;
	fcmTokens: string[];
	fromName?: string;
	toName?: string;
	variables?: string[];
};

export type NotificationContentType = {
	_id: Types.ObjectId;
	contentForOne: string;
	contentForMany: string;
	name: string;
	tag: string;
};
