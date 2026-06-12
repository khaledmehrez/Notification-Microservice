import { Types } from 'mongoose';
import { SettingsMapDto } from '../../types/notification.types';
import { ApiProperty } from '@nestjs/swagger';

export class NotificationsResponse {
	@ApiProperty()
	seen: boolean;

	@ApiProperty()
	type: string;

	@ApiProperty()
	content: any;

	@ApiProperty()
	picture: string;

	@ApiProperty({ example: new Types.ObjectId() })
	_id: Types.ObjectId;
}

export class NotificationResponse {
	@ApiProperty({ example: new Types.ObjectId() })
	user: Types.ObjectId;

	@ApiProperty()
	fcmTokens: string[];

	@ApiProperty({ type: SettingsMapDto })
	settings: SettingsMapDto;

	@ApiProperty({ type: [NotificationsResponse] })
	notifications?: NotificationsResponse[];

	@ApiProperty({ example: new Types.ObjectId() })
	_id: Types.ObjectId;
}
