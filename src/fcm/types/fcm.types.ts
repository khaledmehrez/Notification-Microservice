import { Types } from 'mongoose';

export type FcmType = {
	notification?: FcmNotificationType;
	fcmTokens: string[];
	data?: {
		[key: string]: string;
	};
	userId: Types.ObjectId;
};
export type FcmNotificationType = {
	title: string;
	body: string;
	icon: string;
	tag: string;
};
