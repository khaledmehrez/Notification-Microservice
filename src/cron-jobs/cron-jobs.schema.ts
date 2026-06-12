import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';
import { AbstractModel } from '../abstract/abstract.model';

@Schema({
	timestamps: true,
	autoCreate: true,
	autoIndex: true,
})
export class CronJob extends AbstractModel {
	@Prop({ required: true, type: SchemaTypes.String, index: true })
	name: string;

	@Prop({ required: true, type: SchemaTypes.String })
	cron: string;

	@Prop({ required: true, type: SchemaTypes.Boolean, default: true })
	enabled: boolean;
}

export const CronJobSchema = SchemaFactory.createForClass(CronJob);
