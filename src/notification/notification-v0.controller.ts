import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards, VERSION_NEUTRAL } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { ApiBearerAuth, ApiExtraModels, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EmptyObject, ResponseObject } from '../abstract/response.object';
import { MarkAsSeenDto, SendGiftDto, UpdateNotificationsSettingsDto } from './dtos/notification.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AddFcmTokenDto } from './dtos/fcm.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { FcmService } from '../fcm/fcm.service';
import { fcmTopics } from '../config/fcm-config';
import { CustomApiCreatedResponse } from '../api-doc/api-response-schema';
import { NotificationResponseType } from '../types/response/notification.type';
import { NotificationResponse } from '../api-doc/dtos/notification.dto';
import { Types } from 'mongoose';

@ApiTags('Notification V0')
@ApiBearerAuth()
@Controller({
	path: 'notification',
	version: ['0', VERSION_NEUTRAL],
})
export class NotificationControllerV0 {
	constructor(
		protected notificationService: NotificationService,
		protected fcmService: FcmService,
		@InjectQueue('notification-ms') protected notificationQueue: Queue,
	) {}

	@ApiOperation({
		operationId: 'Get Notifications ',
		description: 'Enables a user to get his own notifications  ',
		summary: 'Get user notifications',
	})
	@ApiExtraModels(NotificationResponse)
	@CustomApiCreatedResponse('Get notifications  response', 'FOUND_NOTIFICATION', NotificationResponse)
	@UseGuards(JwtAuthGuard)
	@Get('')
	async getNotifications(@Request() req): Promise<ResponseObject<NotificationResponseType>> {
		const data = await this.notificationService.findOne({ user: req.auth.user });
		return new ResponseObject('FOUND_' + this.notificationService.getModelName(), data);
	}

	@ApiOperation({
		operationId: 'Mark as seen ',
		description: 'Enables a user to mark a notification as seen ',
		summary: 'Update user notification seen status',
	})
	@CustomApiCreatedResponse('Update notification settings  response', 'UPDATED_NOTIFICATION')
	@UseGuards(JwtAuthGuard)
	@Patch('mark-as-seen')
	async markAsSeen(@Request() req, @Body() markAsSeenDto: MarkAsSeenDto): Promise<ResponseObject<EmptyObject>> {
		await this.notificationService.updateOne(
			{ user: req.auth.user, 'notifications._id': { $in: markAsSeenDto.notificationsIds } },
			{ $set: { 'notifications.$[e].seen': true } },
			{ arrayFilters: [{ 'e._id': { $in: markAsSeenDto.notificationsIds } }] },
		);
		return new ResponseObject('UPDATED_' + this.notificationService.getModelName());
	}

	@ApiOperation({
		operationId: 'Update notification settings ',
		description: 'Enables a user to update his own notification settings ',
		summary: 'Update user notification setting',
	})
	@ApiExtraModels(NotificationResponse)
	@CustomApiCreatedResponse('Update notification settings  response', 'UPDATED_NOTIFICATION', NotificationResponse)
	@UseGuards(JwtAuthGuard)
	@Patch('')
	async updateNotificationsSettings(
		@Body() updateNotificationsSettingsDto: UpdateNotificationsSettingsDto,
		@Request() req,
	): Promise<ResponseObject<NotificationResponseType>> {
		const data = await this.notificationService.updateNotificationsSettings(
			req.auth.user,
			updateNotificationsSettingsDto,
		);
		return new ResponseObject('UPDATED_' + this.notificationService.getModelName(), data);
	}

	@ApiOperation({
		operationId: 'Add fcm token ',
		description: 'Used to register fcm token ',
		summary: 'Add fcm token',
	})
	@CustomApiCreatedResponse('Add fcm token  response', 'ADDED_FCM_TOKEN || FCM_TOKEN_ALREADY_EXIST')
	@UseGuards(JwtAuthGuard)
	@Post('add-token')
	async addFcmToken(@Request() req, @Body() addFcmToken: AddFcmTokenDto) {
		const data = await this.notificationService.updateOne(
			{ user: req.auth.user },
			{ $addToSet: { fcmTokens: addFcmToken.fcmToken } },
		);
		await this.fcmService.subscribeToTopic(fcmTopics.All, addFcmToken.fcmToken);
		return new ResponseObject(data.modifiedCount === 0 ? 'FCM_TOKEN_ALREADY_EXIST' : 'ADDED_FCM_TOKEN');
	}

	@ApiOperation({
		operationId: 'Send Peak Day Notification',
		description: 'Sends a notification for peak day',
		summary: 'Send peak day notification',
	})
	@CustomApiCreatedResponse('Send Peak Day Notification - Response', 'NOTIFICATION_SENT')
	@Post('peak-day')
	async sendPeakDayNotification(): Promise<ResponseObject<EmptyObject>> {
		await this.notificationQueue.add('peak-day');
		return new ResponseObject('NOTIFICATION_SENT');
	}

	@ApiOperation({
		operationId: 'Share Lovester',
		description: 'Used to send share lovester fcm notification',
		summary: 'Share lovester fcm notification',
	})
	@CustomApiCreatedResponse('Share lovester fcm notification response', 'NOTIFICATION_SENT')
	@Post('share-lovester')
	async sendShareLovesterNotification(): Promise<ResponseObject<EmptyObject>> {
		await this.notificationQueue.add('share-lovester-notification');
		return new ResponseObject('NOTIFICATION_SENT');
	}

	@ApiOperation({
		operationId: ' Tips',
		description: 'Used to send tips fcm notification',
		summary: 'Tips fcm notification',
	})
	@CustomApiCreatedResponse('tips fcm notification response', 'NOTIFICATION_SENT')
	@Post('tips')
	async sendTipsNotification(): Promise<ResponseObject<EmptyObject>> {
		await this.notificationQueue.add('tips-notification');
		return new ResponseObject('NOTIFICATION_SENT');
	}

	@ApiOperation({
		operationId: 'go back ',
		description: 'Used to send go back fcm notification ',
		summary: 'Go back fcm notification',
	})
	@CustomApiCreatedResponse('go back fcm notification response', 'NOTIFICATION_SENT')
	@Post('go-back')
	async goBackNotification(): Promise<ResponseObject<EmptyObject>> {
		await this.notificationQueue.add('go-back-notification');
		await this.notificationQueue.add('gift-notification', {
			users: ['6226351d7035240c83f383db'],
			coupon: 'test',
		});
		return new ResponseObject('NOTIFICATION_SENT');
	}

	@ApiOperation({
		operationId: 'Gift ',
		description: 'Used to send gift fcm notification ',
		summary: 'Gift fcm notification',
	})
	@CustomApiCreatedResponse('Gift fcm notification response', 'NOTIFICATION_SENT')
	@Post('gift')
	async sendGiftsNotification(@Body() sendGiftDto: SendGiftDto): Promise<ResponseObject<EmptyObject>> {
		await this.notificationQueue.add('gift-notification', sendGiftDto);
		return new ResponseObject('NOTIFICATION_SENT');
	}

	@ApiOperation({
		operationId: 'Birthday ',
		description: 'Used to send birthday fcm notification ',
		summary: 'Birthday fcm notification',
	})
	@CustomApiCreatedResponse('Birthday fcm notification response', 'NOTIFICATION_SENT')
	@Post('birthday')
	async sendBirthdayNotification(): Promise<ResponseObject<EmptyObject>> {
		await this.notificationQueue.add('birthday-notification');
		return new ResponseObject('NOTIFICATION_SENT');
	}

	@ApiOperation({
		operationId: 'Retaking personality test  ',
		description: 'Used to send retaking personality test fcm notification ',
		summary: 'Retaking personality test fcm notification',
	})
	@CustomApiCreatedResponse('Retaking personality test fcm notification response', 'NOTIFICATION_SENT')
	@Post('retaking-personality-test')
	async sendRetakingPersonalityTestNotification(): Promise<ResponseObject<EmptyObject>> {
		await this.notificationQueue.add('retaking-personality-test-notification');
		return new ResponseObject('NOTIFICATION_SENT');
	}

	@ApiOperation({
		operationId: 'Plan expiration  ',
		description: 'Used to send plan expiration fcm notification ',
		summary: 'Plan expiration fcm notification',
	})
	@CustomApiCreatedResponse('Plan expiration fcm notification response', 'NOTIFICATION_SENT')
	@Post('plan-expiration')
	async sendPlanExpirationNotification(): Promise<ResponseObject<EmptyObject>> {
		await this.notificationQueue.add('plan-expiration-notification');
		return new ResponseObject('NOTIFICATION_SENT');
	}

	@ApiOperation({
		operationId: 'Monday Likes ',
		description: 'Used to send monday likes fcm notification ',
		summary: 'Monday likes fcm notification',
	})
	@CustomApiCreatedResponse('Monday likes fcm notification response', 'NOTIFICATION_SENT')
	@Post('monday-likes')
	async sendMondayLikesNotification(): Promise<ResponseObject<EmptyObject>> {
		await this.notificationQueue.add('monday-likes-notification');
		return new ResponseObject('NOTIFICATION_SENT');
	}

	@ApiOperation({
		operationId: 'Not texted matches ',
		description: 'Used to send not texted matches fcm notification ',
		summary: 'Not texted matches fcm notification',
	})
	@CustomApiCreatedResponse('Not texted matches fcm notification response', 'NOTIFICATION_SENT')
	@Post('not-texted-matches')
	async sendNotTextedMatchesNotification(): Promise<ResponseObject<EmptyObject>> {
		await this.notificationQueue.add('not-texted-matches-notification');
		return new ResponseObject('NOTIFICATION_SENT');
	}

	@ApiOperation({
		operationId: 'Send Welcome Notification ',
		description: 'Used to send Welcome Notification',
		summary: 'Monday likes fcm notification',
	})
	@CustomApiCreatedResponse('Monday likes fcm notification response', 'NOTIFICATION_SENT')
	@UseGuards(JwtAuthGuard)
	@Post('welcome-notification')
	async sendWelcomeNotification(@Request() req): Promise<ResponseObject<EmptyObject>> {
		await this.notificationQueue.add('create_user_notification', { user: req.auth.user });
		return new ResponseObject('NOTIFICATION_SENT');
	}

	@Post('send-fcm-for-testing/:id')
	async sendFcmForTesting(@Param('id') id: Types.ObjectId) {
		await this.notificationQueue.add('send-fcm-for-testing', { user: id });
		return new ResponseObject('NOTIFICATION_SENT');
	}
}
