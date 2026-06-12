import { ArrayUnique, IsArray, IsBoolean, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddNotificationDto {
	content: string;
	state: number;
	user: any;
	seenAt?: Date;
	data = new Date();
	type?: string;
}
export class CreateNewMatchNotification {
	@IsNotEmpty()
	@IsMongoId()
	@ApiProperty()
	match: Types.ObjectId;

	@IsNotEmpty()
	@IsMongoId()
	@ApiProperty()
	user1: Types.ObjectId;

	@IsNotEmpty()
	@IsMongoId()
	@ApiProperty()
	user2: Types.ObjectId;

	@IsNotEmpty()
	@IsString()
	@ApiProperty()
	user1Name: string;

	@IsNotEmpty()
	@IsString()
	@ApiProperty()
	user2Name: string;
}

export class UpdateNotificationsSettingsDto {
	@IsOptional()
	@IsBoolean()
	@ApiPropertyOptional()
	newMatch: boolean;

	@IsBoolean()
	@IsOptional()
	@ApiPropertyOptional()
	newMessage: boolean;

	@IsBoolean()
	@IsOptional()
	@ApiPropertyOptional()
	someoneLikedYou: boolean;

	@IsBoolean()
	@IsOptional()
	@ApiPropertyOptional()
	firstMessageSeen: boolean;

	@IsBoolean()
	@IsOptional()
	@ApiPropertyOptional()
	firstMessageReceived: boolean;
}

export class SendGiftDto {
	@ApiProperty({ example: [new Types.ObjectId()] })
	user: Types.ObjectId[];

	@ApiProperty()
	coupon: string;
}

export class MarkAsSeenDto {
	@ApiProperty()
	@ArrayUnique()
	@IsArray()
	@IsMongoId({ each: true })
	notificationsIds: Types.ObjectId[];
}
