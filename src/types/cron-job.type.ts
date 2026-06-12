import { CronJob } from 'cron';

export class CronJobType {
	name: string;
	lastExecutionTime: string;
	nextExecutionTime: string;
	cronRule: string;
	enabled: boolean;
}

export enum CronJobsName {
	MONDAY_LIKES = 'Monday likes',
	PEAK_DAY = 'Peak day',
}

export class FullCronJob extends CronJob {
	cronTime: { source: any };
}
