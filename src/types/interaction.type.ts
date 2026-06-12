import { Types } from 'mongoose';

export class InteractionLikeType {
	user1InteractionDuration: number;

	user2Interaction: number;

	user1Interaction: number;

	sociologyReport: Types.ObjectId[];

	type: string;

	state: number;

	user2: Types.ObjectId;

	user1: Types.ObjectId;

	_id: Types.ObjectId;
}

export class InteractionMatchType {
	user1InteractionDuration: number;

	user2InteractionDuration: number;

	user2Interaction: number;

	user1Interaction: number;

	sociologyReport: Types.ObjectId[];

	type: string;

	state: number;

	user2: Types.ObjectId;

	user1: Types.ObjectId;

	conversation: Types.ObjectId;

	_id: Types.ObjectId;
}

export enum InteractionModeEnum {
	Science = 'SCIENCE',
	Astrology = 'ASTROLOGY',
}
