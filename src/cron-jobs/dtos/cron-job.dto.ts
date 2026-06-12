import { IsDefined, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsCron } from '../../validators/cron.validator';
import { CronJobsName } from '../../types/cron-job.type';

export class UpdateJobPatternBody {
	@IsCron()
	@IsDefined()
	@ApiProperty({ example: '* * * * * 4' })
	newPattern: string;
}

export class JobByName {
	@IsEnum(CronJobsName)
	@IsDefined()
	@ApiProperty({ example: 'Peak Day' })
	jobName: string;
}
