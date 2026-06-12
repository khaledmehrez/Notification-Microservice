import { ApiProperty } from '@nestjs/swagger';

export class CronJobResponse {
	@ApiProperty({ example: 'Peak Day' })
	name: string;

	@ApiProperty()
	enabled: boolean;

	@ApiProperty()
	lastExecutionTime: Date;

	@ApiProperty()
	nextExecutionTime: Date;

	@ApiProperty({ example: '* * * * * 4' })
	cronRule: string;
}
