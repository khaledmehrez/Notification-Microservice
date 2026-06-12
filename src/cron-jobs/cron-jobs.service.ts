import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AbstractService } from '../abstract/abstract.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from './cron-jobs.schema';
import { CronTime } from 'cron';
import { CronJobType, FullCronJob } from '../types/cron-job.type';
import { delay } from '../utils/misc.utils';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class CronJobsService extends AbstractService<CronJob> {
	constructor(
		@InjectModel(CronJob.name) protected cronJobModel: Model<CronJob>,
		@InjectQueue('notification-ms') protected notificationQueue: Queue,
		private schedulerRegistry: SchedulerRegistry,
		@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
	) {
		super(cronJobModel);
		this.syncJobsAndDatabase().then();
	}

	protected modelName = CronJob.name;

	async syncJobsAndDatabase() {
		await delay(5000);
		this.logger.log('info', 'Syncing CRON Jobs with Database...');
		const jobs: CronJobType[] = this.getCronJobs();
		for (let i = 0; i < jobs.length; i++) {
			const job = jobs[i];
			const data = await this.findOne({ name: job.name });
			if (!data) {
				await this.create({ name: job.name, cron: job.cronRule, enabled: job.enabled });
				this.logger.log('info', `Saved new Job ${job.name} in Database`);
			}
			if (job.cronRule != data.cron) {
				await this.updateCronJobPattern(job.name, data.cron);
				this.logger.log('info', `Synced Job's scheduling ${job.name} from Database`);
			}
			if (!data.enabled) {
				await this.stopCronJob(job.name);
				this.logger.log('info', `Stopped Job's scheduling ${job.name} from Database Config`);
			}
		}
	}

	getCronJobs(): CronJobType[] {
		const jobs = this.schedulerRegistry.getCronJobs();
		const result = [];
		jobs.forEach((job: FullCronJob, name) => {
			const data = {
				name,
				lastExecutionTime: job.lastDate(),
				nextExecutionTime: job.nextDate().toJSDate(),
				cronRule: job.cronTime.source,
				enabled: job.running,
			};

			result.push(data);
		});
		return result;
	}

	async updateCronJobPattern(name: string, newPattern: string) {
		const job = this.schedulerRegistry.getCronJob(name);
		const time = new CronTime(newPattern);
		job.setTime(time);
		await this.updateOne({ name }, { cron: newPattern });
	}

	async stopCronJob(name: string) {
		const job = this.schedulerRegistry.getCronJob(name);
		job.stop();
		await this.updateOne({ name }, { enabled: false });
	}

	async startCronJob(name: string) {
		const job = this.schedulerRegistry.getCronJob(name);
		job.start();
		await this.updateOne({ name }, { enabled: true });
	}
}
