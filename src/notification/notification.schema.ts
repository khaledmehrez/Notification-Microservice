import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SettingsMap, SettingsMapSchema } from '../types/notification.types';
import { SchemaTypes, Types } from 'mongoose';
import { AbstractModel } from '../abstract/abstract.model';
import { InteractionModeEnum } from '../types/interaction.type';

@Schema({
	timestamps: true,
	autoCreate: true,
	autoIndex: true,
})
export class Notifications extends AbstractModel {
	@Prop({ required: true, type: SchemaTypes.Boolean })
	seen: boolean;
	@Prop({ required: true, type: SchemaTypes.String })
	type: string;

	@Prop({ required: true, type: SchemaTypes.Mixed })
	content: any;

	@Prop({ required: true, type: SchemaTypes.String })
	picture: string;

	@Prop({ required: false, type: SchemaTypes.String, enum: InteractionModeEnum })
	mode?: InteractionModeEnum;
}

const NotificationsSchema = SchemaFactory.createForClass(Notifications);

@Schema()
export class Notification extends AbstractModel {
	@Prop({ required: true, type: SchemaTypes.ObjectId })
	user: Types.ObjectId;

	@Prop({ required: false, type: SchemaTypes.Array, default: [] })
	fcmTokens: string[];

	@Prop(raw({ ...SettingsMapSchema }))
	settings: SettingsMap;

	@Prop({ required: false, type: [NotificationsSchema], default: [] })
	notifications?: Notifications[];
}

const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ user: 1, fcmTokens: 1 });
export { NotificationSchema };
