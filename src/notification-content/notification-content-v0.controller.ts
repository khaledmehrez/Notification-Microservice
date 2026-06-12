import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateNotificationContentDto, FilterDto, UpdateNotificationContent } from './notification-content.dto';
import { ResponseObject } from '../abstract/response.object';
import { NotificationContentService } from './notification-content.service';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminRoles } from '../guards/admin-roles.decorator';
import { AdminRole } from '../guards/constants';
import { NotificationContentResponse } from '../api-doc/dtos/notification-content.dto';
import { CustomApiCreatedResponse } from '../api-doc/api-response-schema';
import { NotificationContentResponseType } from '../types/response/notification-content.type';

@ApiTags('Notification Content V0')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminRolesGuard)
@AdminRoles(AdminRole.Content)
@Controller({
	path: 'notification-content',
	version: ['0', VERSION_NEUTRAL],
})
export class NotificationContentControllerV0 {
	constructor(private notificationContentService: NotificationContentService) {}

	@ApiOperation({
		operationId: 'Create Notification Content',
		description: 'Enables an admin to create a notification content  ',
		summary: 'Create a notification content by an admin',
	})
	@ApiExtraModels(NotificationContentResponse)
	@CustomApiCreatedResponse(
		'Create notification content response',
		'NOTIFICATION_CONTENT_CREATED',
		NotificationContentResponse,
	)
	@Post('')
	async createNotificationContent(
		@Body() createNotificationContentDto: CreateNotificationContentDto,
	): Promise<ResponseObject<NotificationContentResponseType>> {
		const data = await this.notificationContentService.create(createNotificationContentDto);
		return new ResponseObject('NOTIFICATION_CONTENT_CREATED', data);
	}

	@ApiOperation({
		operationId: 'Update Notification Content',
		description: 'Enables an admin to update a notification content',
		summary: 'Update a notification content by an admin',
	})
	@ApiExtraModels(NotificationContentResponse)
	@CustomApiCreatedResponse(
		'Update notification content response',
		'NOTIFICATION_CONTENT_UPDATED',
		NotificationContentResponse,
	)
	@Patch(':id')
	async updateNotificationContent(
		@Param('id') id: Types.ObjectId,
		@Body() updateNotificationContentDto: UpdateNotificationContent,
	): Promise<ResponseObject<NotificationContentResponseType>> {
		const data = await this.notificationContentService.findOneAndUpdate({ _id: id }, updateNotificationContentDto);
		return new ResponseObject('NOTIFICATION_CONTENT_UPDATED', data);
	}

	@ApiOperation({
		operationId: 'Get Notification Content ',
		description: 'Enables an admin to Get a notification content  ',
		summary: 'Get a notification content by an admin',
	})
	@ApiExtraModels(NotificationContentResponse)
	@CustomApiCreatedResponse(
		'Get notification content response',
		'FOUND_NOTIFICATION_CONTENT',
		NotificationContentResponse,
		true,
	)
	@Get('')
	async getAll(@Query() filter: FilterDto): Promise<ResponseObject<NotificationContentResponseType>> {
		const data = await this.notificationContentService.find(
			filter.name ? { name: filter.name } : {},
			filter.preferredLanguage ? ['name', `content.${filter.preferredLanguage}`] : {},
		);

		return new ResponseObject('FOUND_NOTIFICATION_CONTENT', data);
	}
}
