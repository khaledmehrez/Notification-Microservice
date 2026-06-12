import { TranslationMapDto } from '../../types/translation-map';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationNameEnum } from '../../config/notification-config';
import { Types } from 'mongoose';

export class NotificationContentResponse {
	@ApiProperty({ example: 'string', enum: NotificationNameEnum })
	name: string;

	@ApiProperty({ type: TranslationMapDto })
	contentForOne: TranslationMapDto;

	@ApiProperty({ type: TranslationMapDto })
	contentForMany: TranslationMapDto;

	@ApiProperty({ example: new Types.ObjectId() })
	_id: Types.ObjectId;
}
