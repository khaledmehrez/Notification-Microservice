import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseObject } from '../abstract/response.object';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CustomApiCreatedResponse, CustomApiOkResponse } from '../api-doc/api-response-schema';
import { JobByName, UpdateJobPatternBody } from './dtos/cron-job.dto';
import { CronJobResponse } from '../api-doc/dtos/cron-job.response';
import { CronJobsService } from './cron-jobs.service';
import { AdminRoles } from '../guards/admin-roles.decorator';
import { AdminRole } from '../guards/constants';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';

@ApiTags('Cron Job V0')
@ApiBearerAuth()
@Controller({
	path: 'cron-jobs',
	version: ['0', VERSION_NEUTRAL],
})
@UseGuards(JwtAuthGuard, AdminRolesGuard)
@AdminRoles(AdminRole.Content)
export class CronJobsControllerV0 {
	constructor(
		protected cronJobsService: CronJobsService,
		@InjectQueue('notification-ms') protected notificationQueue: Queue,
	) {}

	@ApiOperation({
		operationId: 'Get Cron Jobs',
		description: 'Returns the list of configured CRON jobs',
		summary: 'Get Cron Jobs',
	})
	@ApiExtraModels(CronJobResponse)
	@CustomApiOkResponse('Get Cron Jobs response', 'FOUND_CRON_JOBS', CronJobResponse, true)
	@Get()
	async getCronJobs(): Promise<ResponseObject<CronJobResponse>> {
		const data = this.cronJobsService.getCronJobs();
		return new ResponseObject('FOUND_CRON_JOBS', data);
	}

	@ApiOperation({
		operationId: "Update Cron Job's pattern",
		description: 'Update a given cron job and returns the list of configured CRON jobs',
		summary: "Update Cron Job's pattern",
	})
	@CustomApiOkResponse('Update Cron Jobs response', 'UPDATE_CRON_RULE', CronJobResponse, true)
	@ApiExtraModels(CronJobResponse)
	@Patch(':jobName/pattern')
	async updateCronJobPattern(@Param() params: JobByName, @Body() body: UpdateJobPatternBody) {
		await this.cronJobsService.updateCronJobPattern(params.jobName, body.newPattern);
		const data = this.cronJobsService.getCronJobs();
		return new ResponseObject('UPDATE_CRON_RULE', data);
	}

	@ApiOperation({
		operationId: 'Starts Cron Jos',
		description: 'Starts a given cron job and returns the list of configured CRON jobs',
		summary: 'Starts Cron Job',
	})
	@CustomApiCreatedResponse('Start Cron Jobs response', 'STARTED_JOB', CronJobResponse, true)
	@ApiExtraModels(CronJobResponse)
	@Post(':jobName/start')
	async startCronJob(@Param() params: JobByName) {
		await this.cronJobsService.startCronJob(params.jobName);
		const data = this.cronJobsService.getCronJobs();
		return new ResponseObject('STARTED_JOB', data);
	}

	@ApiOperation({
		operationId: 'Stops Cron Jos',
		description: 'Stops a given cron job and returns the list of configured CRON jobs',
		summary: 'Stops Cron Job',
	})
	@CustomApiCreatedResponse('Stop Cron Jobs response', 'STOPPED_JOB', CronJobResponse, true)
	@ApiExtraModels(CronJobResponse)
	@Delete(':jobName/stop')
	async stopCronJob(@Param() params: JobByName) {
		await this.cronJobsService.stopCronJob(params.jobName);
		const data = this.cronJobsService.getCronJobs();
		return new ResponseObject('STOPPED_JOB', data);
	}
}
