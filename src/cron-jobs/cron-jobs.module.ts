import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CronJob, CronJobSchema } from './cron-jobs.schema';
import { CronJobsService } from './cron-jobs.service';
import { CronJobsControllerV0 } from './cron-jobs-v0.controller';
import { BullModule } from '@nestjs/bull';

/**
 * Notification module that handles user creation, deletion, pictures, tags, etc...
 */
@Module({
	imports: [
		MongooseModule.forFeature([{ name: CronJob.name, schema: CronJobSchema }]),
		BullModule.registerQueue({
			name: 'notification-ms',
		}),
	],
	providers: [CronJobsService],
	exports: [CronJobsService],
	controllers: [CronJobsControllerV0],
})
export class CronJobsModule {}
