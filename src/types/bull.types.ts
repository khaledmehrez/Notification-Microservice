import { Types } from 'mongoose';
import { InteractionLikeType, InteractionMatchType, InteractionModeEnum } from './interaction.type';

export type BullMatchType = {
	//user1 is the one who received match websocket and fcm notification
	user1: Types.ObjectId;
	user2: Types.ObjectId;
	match: Types.ObjectId;
	interaction: InteractionMatchType;
	mode: InteractionModeEnum;
};

export type BullLikeType = {
	user1: Types.ObjectId;
	//user2 is the one who received like websocket and fcm notification
	user2: Types.ObjectId;
	like: Types.ObjectId;
	interaction: InteractionLikeType;
	mode: InteractionModeEnum;
};

export type BullWelcomeType = {
	user: Types.ObjectId;
};

export type BullMessageType = {
	//user1 is the one who created the match
	user1: Types.ObjectId;
	//user2 is the one who received the match
	user2: Types.ObjectId;
	message: Types.ObjectId;
	interaction: Types.ObjectId;
	conversation: Types.ObjectId;
};

export type BullMondayLikeType = {
	user: Types.ObjectId;
};

export type BullGiftType = {
	users: Types.ObjectId[];
	coupon: string;
};

export type BullNsfwType = {
	user: Types.ObjectId;
	picture: Types.ObjectId;
	pictureData: any;
	isSafe: boolean;
};
export type BullIdVerificationType = {
	user: Types.ObjectId;
	status: number;
};
