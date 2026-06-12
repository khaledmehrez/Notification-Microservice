import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';
import { AbstractModel } from '../abstract/abstract.model';
import { TranslationMap, TranslationMapSchema } from '../types/translation-map';
import { NotificationNameEnum } from '../config/notification-config';

@Schema({
	timestamps: true,
	autoCreate: true,
	autoIndex: true,
})
export class NotificationContent extends AbstractModel {
	@Prop({ required: true, type: SchemaTypes.String, enum: NotificationNameEnum })
	name: string;

	@Prop(raw({ ...TranslationMapSchema }))
	contentForOne: TranslationMap;

	@Prop(raw({ ...TranslationMapSchema }))
	contentForMany: TranslationMap;
}

const NotificationContentSchema = SchemaFactory.createForClass(NotificationContent);
NotificationContentSchema.index({ name: 1, contentForOne: 1, contentForMany: 1 });
export { NotificationContentSchema };
