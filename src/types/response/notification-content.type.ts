import { TranslationMapDto } from '../translation-map';
import { Types } from 'mongoose';

export class NotificationContentResponseType {
	name: string;

	contentForOne: TranslationMapDto;

	contentForMany: TranslationMapDto;

	_id: Types.ObjectId;
}
