import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { NotificationService } from './notification.service';
import { Inject } from '@nestjs/common';
import { WebsocketGateway } from '../websocket-gateway/websocket.gateway';
import { CreateFcmNotificationType, NotificationContentType, NotificationType } from '../types/notification.types';
import {
	NotificationNameEnum,
	NotificationEvents,
	InteractionStateEnum,
	limit,
	absentTime,
	birthdayCoupon,
	daysLeft,
	IdVerificationStatusStringEnum,
} from '../config/notification-config';
import {
	BullGiftType,
	BullIdVerificationType,
	BullLikeType,
	BullMatchType,
	BullMessageType,
	BullNsfwType,
	BullWelcomeType,
} from '../types/bull.types';
import { MongoDriverService } from '../mongo-driver/mongo-driver.service';
import { FcmService } from '../fcm/fcm.service';
import { Types } from 'mongoose';
import { NotificationContentService } from '../notification-content/notification-content.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { fcmTopics } from '../config/fcm-config';
import { goBackAgg } from './aggregations-querry/go-back-agg';
import { sendTipsAgg } from './aggregations-querry/send-tip-agg';
import { birthdayAgg } from './aggregations-querry/birthday-agg';
import { planExpirationAgg } from './aggregations-querry/plan-expiration-agg';
import { getAge } from '../utils/misc.utils';
import { retakingPersonalityAgg } from './aggregations-querry/retaking-personality-agg';
import { mondayLikeAgg } from './aggregations-querry/monday-like-agg';
import { notTextedMatchesAgg } from './aggregations-querry/not-texted-matches-agg';
import * as moment from 'moment';
import { Cron } from '@nestjs/schedule';
import { CronJobsName } from '../types/cron-job.type';

@Processor('notification-ms')
export class NotificationConsumer {
	constructor(
		private notificationService: NotificationService,
		private webSocketGateway: WebsocketGateway,
		private mongoDriverService: MongoDriverService,
		private fcmService: FcmService,
		private notificationContentService: NotificationContentService,
		@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
	) {}

	@Process('create_user_notification')
	async createDefaultNotifications(job: Job<BullWelcomeType>) {
		const settings = {
			newMatch: true,
			newMessage: true,
			someoneLikedYou: true,
			firstMessageSeen: true,
			firstMessageReceived: true,
		};

		try {
			await this.notificationService.create({ user: job.data.user, settings });
			const user = await this.mongoDriverService.findOne('users', { _id: new Types.ObjectId(job.data.user) });
			if (!user) {
				this.logger.error('error', `user ${job.data.user} could not be found in database`);
				return;
			}
			const preferredLanguageUser = user.config.preferredLanguage || 'en';
			const notificationContentWelcome = await this.notificationContentService.getNotificationContent(
				NotificationNameEnum.Welcome,
				preferredLanguageUser,
			);
			const notificationContentDefaultConfig = await this.notificationContentService.getNotificationContent(
				NotificationNameEnum.DefaultConfig,
				preferredLanguageUser,
			);

			const notificationWelcome: NotificationType = {
				seen: false,
				type: NotificationNameEnum.Welcome,
				content: notificationContentWelcome.contentForOne[preferredLanguageUser],
				picture: 'https://lovester-backend-dev.s3.eu-central-1.amazonaws.com/16484662533081582.webp',
			};
			const notificationDefaultConfig: NotificationType = {
				seen: false,
				type: NotificationNameEnum.DefaultConfig,
				content: notificationContentDefaultConfig.contentForOne[preferredLanguageUser],
				picture: 'https://lovester-backend-dev.s3.eu-central-1.amazonaws.com/16484662533081582.webp',
			};
			const createdNotificationWelcome = await this.notificationService.addUserNotification(
				job.data.user,
				notificationWelcome,
			);
			const createdDefaultNotification = await this.notificationService.addUserNotification(
				job.data.user,
				notificationDefaultConfig,
			);
			//send notification on socket
			this.webSocketGateway.send(job.data.user.toString(), NotificationEvents.Welcome, {
				notification: createdNotificationWelcome,
			});
			this.webSocketGateway.send(job.data.user.toString(), NotificationEvents.DefaultConfig, {
				defaultConfig: settings,
				notification: createdDefaultNotification,
			});
		} catch (e) {
			this.logger.error(`Could not create notification for user with _id : ${job.data.user}  WITH ERROR: ${e}`);
		}
	}

	@Process('like_notification')
	async likeNotification(job: Job<BullLikeType>) {
		// user1 is the sender of like and user 2 is the destination
		//data user1
		const user1 = await this.mongoDriverService.findOne('users', { _id: new Types.ObjectId(job.data.user1) });
		if (!user1) {
			this.logger.log('error', `user ${job.data.user1} could not be found in database`);
			return;
		}

		const pictureUser1 = await this.notificationService.getUserPicture(user1);
		//data user2
		const user2 = await this.mongoDriverService.findOne(
			'users',
			{ _id: new Types.ObjectId(job.data.user2) },
			{
				projection: {
					config: 1,
					lastActiveAt: 1,
				},
			},
		);
		if (!user2) {
			this.logger.log('error', `user ${job.data.user2} could not be found in database`);
			return;
		}

		const preferredLanguageUser2 = user2.config.preferredLanguage || 'en';
		const notificationContent = await this.notificationContentService.getNotificationContent(NotificationNameEnum.Like);
		const notificationContentUser2: NotificationContentType =
			await this.notificationService.createNotificationContentUser(notificationContent, preferredLanguageUser2);

		// create notification for user2
		const notification: NotificationType = {
			seen: false,
			type: NotificationNameEnum.Like,
			content: notificationContentUser2.contentForOne,
			picture: pictureUser1,
			mode: job.data.mode,
		};
		//save user notification
		const createdNotification = await this.notificationService.addUserNotification(job.data.user2, notification);

		job.data.interaction.user1 = user1;
		//send notification on socket
		this.webSocketGateway.send(job.data.user2.toString(), NotificationEvents.Like, {
			like: job.data.like,
			interaction: job.data.interaction,
			notification: createdNotification,
		});
		//get unseen like for user2
		user2.lastActiveAt?.setSeconds(user2.lastActiveAt?.getSeconds() + 60);
		const unseenLikesCountUser2 = await this.mongoDriverService.count('interactions', {
			user2: new Types.ObjectId(job.data.user2),
			state: { $lte: 1 },
			createdAt: { $gt: user2.lastActiveAt ?? moment().subtract(1, 'weeks').toDate() },
		});

		//retrieve fcmTokens for user2
		const fcmTokensUser = await this.notificationService.getUserTokens(job.data.user2);

		//send notification on fcm
		const createFcmNotificationUser2: CreateFcmNotificationType = {
			userId: job.data.user2,
			notificationContent: notificationContentUser2,
			data: {
				like: `${job.data.like}`,
			},
			image: 'https://i.ibb.co/cbV2Tzg/logo.png',
			unseenCount: unseenLikesCountUser2,
			fcmTokens: fcmTokensUser.fcmTokens,
		};
		//send notification on fcm
		await this.notificationService.createFcmNotification(createFcmNotificationUser2);
	}

	@Process('match_notification')
	async matchNotification(job: Job<BullMatchType>) {
		//get user1 and user2 data
		const user1 = await this.mongoDriverService.findOne(
			'users',
			{ _id: new Types.ObjectId(job.data.user1) },
			{
				projection: {
					config: 1,
					pictures: 1,
					lastActiveAt: 1,
				},
			},
		);
		if (!user1) {
			this.logger.log('error', `user ${job.data.user1} could not be found in database`);
			return;
		}

		const user2 = await this.mongoDriverService.findOne('users', { _id: new Types.ObjectId(job.data.user2) });
		if (!user2) {
			this.logger.log('error', `user ${job.data.user2} could not be found in database`);
			return;
		}

		const preferredLanguageUser1 = user1.config.preferredLanguage || 'en';

		const pictureUser2 = await this.notificationService.getUserPicture(user2);

		const notificationContent = await this.notificationContentService.getNotificationContent(
			NotificationNameEnum.Match,
		);
		const notificationContentUser1: NotificationContentType =
			await this.notificationService.createNotificationContentUser(notificationContent, preferredLanguageUser1);
		// create notification
		const notificationUser1: NotificationType = {
			seen: false,
			type: NotificationNameEnum.Match,
			content: notificationContentUser1.contentForOne,
			picture: pictureUser2,
			mode: job.data.mode,
		};

		//save notification for user1 who received the match
		const createdNotificationUser1 = await this.notificationService.addUserNotification(
			job.data.user1,
			notificationUser1,
		);
		//send notification on socket
		job.data.interaction.user2 = user2;
		this.webSocketGateway.send(job.data.user1.toString(), NotificationEvents.Match, {
			match: job.data.match,
			interaction: job.data.interaction,
			notification: createdNotificationUser1,
		});

		//get new matches user1
		user1.lastActiveAt?.setSeconds(user1.lastActiveAt?.getSeconds() + 60);
		const unseenMatchesCountUser1 = await this.mongoDriverService.count('interactions', {
			user1: new Types.ObjectId(job.data.user1),
			state: InteractionStateEnum.Match,
			createdAt: { $gt: user1.lastActiveAt ?? moment().subtract(1, 'week').toDate() },
		});

		//Retrieve fcmTokens for user1
		const fcmTokensUser = await this.notificationService.getUserTokens(job.data.user1);

		//send notification on fcm
		const createFcmNotificationUser1: CreateFcmNotificationType = {
			userId: job.data.user1,
			notificationContent: notificationContentUser1,
			data: {
				match: `${job.data.match}`,
			},
			image: pictureUser2,
			unseenCount: unseenMatchesCountUser1,
			fcmTokens: fcmTokensUser.fcmTokens,
		};

		await this.notificationService.createFcmNotification(createFcmNotificationUser1);
	}

	@Process('message_notification')
	async messageNotification(job: Job<BullMessageType>) {
		const user1 = await this.mongoDriverService.findOne(
			'users',
			{ _id: new Types.ObjectId(job.data.user1) },
			{
				projection: {
					firstName: 1,
				},
			},
		);
		if (!user1) {
			this.logger.log('error', `user ${job.data.user1} could not be found in database`);
			return;
		}

		const user2 = await this.mongoDriverService.findOne(
			'users',
			{ _id: new Types.ObjectId(job.data.user2) },
			{
				projection: {
					config: 1,
					lastActiveAt: 1,
				},
			},
		);

		if (!user2) {
			this.logger.log('error', `user ${job.data.user2} could not be found in database`);
			return;
		}
		const preferredLanguage = user2.config.preferredLanguage || 'en';
		const notificationContent = await this.notificationContentService.getNotificationContent(
			NotificationNameEnum.Message,
		);
		const notificationContentUser2: NotificationContentType =
			await this.notificationService.createNotificationContentUser(notificationContent, preferredLanguage);

		// get unseen message count

		user2.lastActiveAt?.setSeconds(user2.lastActiveAt?.getSeconds() + 60);

		const unseenMessagesCount = await this.mongoDriverService.count('chats', {
			destination: new Types.ObjectId(job.data.user2),
			seenAt: { $exists: false },
			createdAt: { $gt: user2.lastActiveAt ?? moment().subtract(1, 'week').toDate() },
		});

		//Retrieve fcmTokens for user2
		const fcmTokensUser = await this.notificationService.getUserTokens(job.data.user2);

		//Send fcm to user 2
		const createFcmNotificationUser2: CreateFcmNotificationType = {
			userId: job.data.user2,
			notificationContent: notificationContentUser2,
			data: {
				message: `${job.data.message}`,
				matchId: `${job.data.interaction}`,
			},
			image: 'https://i.ibb.co/cbV2Tzg/logo.png',
			unseenCount: unseenMessagesCount,
			fromName: user1.firstName,
			fcmTokens: fcmTokensUser.fcmTokens,
		};
		await this.notificationService.createFcmNotification(createFcmNotificationUser2);
	}

	// FCM cron FUNCTIONS
	@Cron('0 0 9 * * 4', { name: CronJobsName.PEAK_DAY, utcOffset: 1 })
	@Process('peak-day')
	async peakDay() {
		const notificationContentUser = await this.notificationContentService.getNotificationContent(
			NotificationNameEnum.PeakDay,
			'en',
		);
		const notificationFcmUser = {
			title: notificationContentUser.name,
			body: notificationContentUser.contentForOne['en'],
			icon: 'https://i.ibb.co/cbV2Tzg/logo.png',
			tag: notificationContentUser.name,
		};
		await this.fcmService.sendToTopic(fcmTopics.All, notificationFcmUser);
	}

	@Process('share-lovester-notification')
	async shareLovester() {
		const notificationContent = await this.notificationService.getRandomNotificationContent(
			NotificationNameEnum.ShareLovester,
		);
		const notificationContentUser: NotificationContentType =
			await this.notificationService.createNotificationContentUser(notificationContent, 'en');
		const notificationFcmUser = {
			title: 'Lovester',
			body: notificationContentUser.contentForOne,
			icon: 'https://i.ibb.co/cbV2Tzg/logo.png',
			tag: notificationContentUser.tag,
		};
		await this.fcmService.sendToTopic(fcmTopics.All, notificationFcmUser);
	}

	@Process('tips-notification')
	async tipsNotification() {
		const notificationContent = await this.notificationContentService.getNotificationContent(NotificationNameEnum.Tips);
		let skip = 0;
		let usersCount = limit + 1;
		while (usersCount >= limit) {
			const users = await this.mongoDriverService.aggregation('users', sendTipsAgg(skip, limit));
			for (const user of users) {
				const preferredLanguageUser = user.config.preferredLanguage || 'en';
				const notificationContentUser: NotificationContentType =
					await this.notificationService.createNotificationContentUser(notificationContent, preferredLanguageUser);
				const createFcmNotificationUser: CreateFcmNotificationType = {
					userId: user._id,
					notificationContent: notificationContentUser,
					data: {},
					image: 'https://i.ibb.co/cbV2Tzg/logo.png',
					unseenCount: 1,
					toName: user.firstName,
					fcmTokens: user.notification.fcmTokens,
				};
				await this.notificationService.createFcmNotification(createFcmNotificationUser);
			}
			skip = skip + limit;
			usersCount = users.length;
		}
	}

	@Process('go-back-notification')
	async goBackNotification() {
		let skip = 0;
		let usersCount = limit + 1;
		const date = new Date();
		date.setDate(date.getDate() - absentTime);
		const notificationContent = await this.notificationContentService.getNotificationContent(
			NotificationNameEnum.GoBack,
		);
		while (usersCount >= limit) {
			const users = await this.mongoDriverService.aggregation('users', goBackAgg(skip, limit, date));
			usersCount = users.length;
			for (const user of users) {
				const preferredLanguageUser = user.config.preferredLanguage || 'en';
				const notificationContentUser: NotificationContentType =
					await this.notificationService.createNotificationContentUser(notificationContent, preferredLanguageUser);
				const createFcmNotificationUser: CreateFcmNotificationType = {
					userId: user._id,
					notificationContent: notificationContentUser,
					data: {},
					image: 'https://i.ibb.co/cbV2Tzg/logo.png',
					unseenCount: 1,
					toName: user.firstName,
					fcmTokens: user.notification.fcmTokens,
				};
				await this.notificationService.createFcmNotification(createFcmNotificationUser);
			}
			skip = skip + limit;
		}
	}

	@Process('gift-notification')
	async giftNotification(job: Job<BullGiftType>) {
		const notificationContent = await this.notificationService.getRandomNotificationContent(NotificationNameEnum.Gift);
		for (const user of job.data.users) {
			const preferredLanguageUser = 'en';
			const notificationContentUser: NotificationContentType =
				await this.notificationService.createNotificationContentUser(notificationContent, preferredLanguageUser);

			//Retrieve fcmTokens for user1
			const fcmTokensUser = await this.notificationService.getUserTokens(user);

			const createFcmNotificationUser: CreateFcmNotificationType = {
				userId: user,
				notificationContent: notificationContentUser,
				data: {},
				image: 'https://i.ibb.co/cbV2Tzg/logo.png',
				unseenCount: 1,
				variables: [job.data.coupon],
				fcmTokens: fcmTokensUser.fcmTokens,
			};
			await this.notificationService.createFcmNotification(createFcmNotificationUser);
		}
	}

	@Process('birthday-notification')
	async birthdayNotification() {
		let skip = 0;
		let isFebruary = false;
		const date = new Date();
		const notificationContent = await this.notificationService.getRandomNotificationContent(
			NotificationNameEnum.Birthday,
		);
		if (date.getUTCFullYear() % 4 != 0 && date.getUTCMonth() === 1 && date.getUTCDate() === 28) {
			isFebruary = true;
		}
		let usersCount = limit + 1;
		while (usersCount >= limit) {
			const users = await this.mongoDriverService.aggregation('users', birthdayAgg(skip, limit, isFebruary));
			usersCount = users.length;
			for (const user of users) {
				const preferredLanguageUser = user.config.preferredLanguage || 'en';
				const notificationContentUser: NotificationContentType =
					await this.notificationService.createNotificationContentUser(notificationContent, preferredLanguageUser);
				const age = getAge(user.birthday);
				const createFcmNotificationUser: CreateFcmNotificationType = {
					userId: user._id,
					notificationContent: notificationContentUser,
					data: {},
					image: 'https://i.ibb.co/cbV2Tzg/logo.png',
					unseenCount: age,
					toName: user.firstName,
					variables: [birthdayCoupon],
					fcmTokens: user.notification.fcmTokens,
				};
				await this.notificationService.createFcmNotification(createFcmNotificationUser);
			}

			skip = skip + limit;
		}
	}

	@Process('retaking-personality-test-notification')
	async retakingPersonalityTestNotification() {
		let skip = 0;
		let usersCount = limit + 1;
		const notificationContent = await this.notificationContentService.getNotificationContent(
			NotificationNameEnum.RetakingPersonalityTest,
		);
		while (usersCount >= limit) {
			const users = await this.mongoDriverService.aggregation('userinfos', retakingPersonalityAgg(skip, limit));
			usersCount = users.length;

			for (const user of users) {
				const preferredLanguageUser = user.user.config.preferredLanguage || 'en';

				const notificationContentUser: NotificationContentType =
					await this.notificationService.createNotificationContentUser(notificationContent, preferredLanguageUser);
				const createFcmNotificationUser: CreateFcmNotificationType = {
					userId: user.user._id,
					notificationContent: notificationContentUser,
					data: {},
					image: 'https://i.ibb.co/cbV2Tzg/logo.png',
					unseenCount: 1,
					fcmTokens: user.notification.fcmTokens,
				};
				await this.notificationService.createFcmNotification(createFcmNotificationUser);
			}
			skip = skip + limit;
		}
	}

	@Process('plan-expiration-notification')
	async planExpirationNotification() {
		let skip = 0;
		let usersCount = limit + 1;
		// create today +3days and time at 0am
		const beginningExpirationDay = new Date();
		beginningExpirationDay.setDate(beginningExpirationDay.getDate() + daysLeft);
		beginningExpirationDay.setUTCHours(0, 0, 0, 0);
		//create today +3 days and time at 23.59 min
		const endingExpirationDay = new Date();
		endingExpirationDay.setDate(endingExpirationDay.getDate() + daysLeft);
		endingExpirationDay.setUTCHours(23, 59, 59, 59);
		const notificationContent = await this.notificationContentService.getNotificationContent(
			NotificationNameEnum.PlanExpiration,
		);
		while (usersCount >= limit) {
			const users = await this.mongoDriverService.aggregation(
				'userpacks',
				planExpirationAgg(skip, limit, beginningExpirationDay, endingExpirationDay),
			);
			usersCount = users.length;
			skip = skip + limit;
			for (const user of users) {
				const preferredLanguageUser = user.user.config.preferredLanguage || 'en';

				const notificationContentUser: NotificationContentType =
					await this.notificationService.createNotificationContentUser(notificationContent, preferredLanguageUser);
				const createFcmNotificationUser: CreateFcmNotificationType = {
					userId: user.user._id,
					notificationContent: notificationContentUser,
					data: {},
					image: 'https://i.ibb.co/cbV2Tzg/logo.png',
					unseenCount: daysLeft,
					fcmTokens: user.notification.fcmTokens,
				};
				await this.notificationService.createFcmNotification(createFcmNotificationUser);
			}
		}
	}

	@Cron('0 00 20 * * 1', { name: CronJobsName.MONDAY_LIKES, utcOffset: 1 })
	@Process('monday-likes-notification')
	async mondayLikesNotification() {
		let skip = 0;
		let usersCount = limit + 1;
		const notificationContent = await this.notificationContentService.getNotificationContent(
			NotificationNameEnum.MondayLikes,
		);
		while (usersCount >= limit) {
			const users = await this.mongoDriverService.aggregation('interactions', mondayLikeAgg(skip, limit));

			usersCount = users.length;
			for (const user of users) {
				const preferredLanguageUser = user.preferredLanguage || 'en';

				const notificationContentUser: NotificationContentType =
					await this.notificationService.createNotificationContentUser(notificationContent, preferredLanguageUser);
				const createFcmNotificationUser: CreateFcmNotificationType = {
					userId: user._id,
					notificationContent: notificationContentUser,
					data: {},
					image: 'https://i.ibb.co/cbV2Tzg/logo.png',
					unseenCount: user.count,
					fcmTokens: user.notification.fcmTokens,
				};
				await this.notificationService.createFcmNotification(createFcmNotificationUser);
			}

			skip = skip + limit;
		}
	}

	@Process('not-texted-matches-notification')
	async notTextedMatchesNotification() {
		let skip = 0;
		let usersCount = limit + 1;
		const notificationContent = await this.notificationContentService.getNotificationContent(
			NotificationNameEnum.NotTextedMatches,
		);
		while (usersCount >= limit) {
			const users = await this.mongoDriverService.aggregation('conversations', notTextedMatchesAgg(skip, limit));
			usersCount = users.length;
			for (const user of users) {
				const preferredLanguageUser = user.user.config.preferredLanguage || 'en';

				const notificationContentUser: NotificationContentType =
					await this.notificationService.createNotificationContentUser(notificationContent, preferredLanguageUser);

				const createFcmNotificationUser: CreateFcmNotificationType = {
					userId: user.user._id,
					notificationContent: notificationContentUser,
					data: {},
					image: 'https://i.ibb.co/cbV2Tzg/logo.png',
					unseenCount: user.count,
					fcmTokens: user.notification.fcmTokens,
				};
				await this.notificationService.createFcmNotification(createFcmNotificationUser);
			}
			skip = skip + limit;
		}
	}

	@Process('nsfw-notification')
	async nsfwNotification(job: Job<BullNsfwType>) {
		//data user1
		const user = await this.mongoDriverService.findOne('users', { _id: new Types.ObjectId(job.data.user) });
		if (!user) {
			this.logger.error('error', `user ${job.data.user} could not be found in database`);
			return;
		}
		const pictureUser = await this.notificationService.getUserPicture(user);

		const preferredLanguageUser = user.config.preferredLanguage || 'en';
		const notificationContent = await this.notificationContentService.getNotificationContent(NotificationNameEnum.Nsfw);
		const notificationContentUser: NotificationContentType =
			await this.notificationService.createNotificationContentUser(notificationContent, preferredLanguageUser);

		// create notification for user2
		const notification: NotificationType = {
			seen: false,
			type: NotificationNameEnum.Nsfw,
			content: notificationContentUser.contentForOne,
			picture: pictureUser,
		};
		const createdNotification = await this.notificationService.addUserNotification(job.data.user, notification);

		this.webSocketGateway.send(job.data.user.toString(), NotificationEvents.Nsfw, {
			picture: job.data.picture,
			pictureData: job.data.pictureData,
			isSafe: job.data.isSafe,
			notification: createdNotification,
		});
	}

	@Process('id-verification-notification')
	async idVerificationNotification(job: Job<BullIdVerificationType>) {
		const user = await this.mongoDriverService.findOne(
			'users',
			{ _id: new Types.ObjectId(job.data.user) },
			{ projection: { 'config.preferredLanguage': 1 } },
		);

		if (!user) {
			this.logger.error('error', `user ${job.data.user} could not be found in database`);
			return;
		}

		let statusString;
		let notificationName;
		if (job.data.status === 0) {
			notificationName = NotificationNameEnum.IdVerificationDeclined;
			statusString = IdVerificationStatusStringEnum.Declined;
		} else if (job.data.status === 1) {
			notificationName = NotificationNameEnum.IdVerificationPending;
			statusString = IdVerificationStatusStringEnum.Pending;
		} else {
			notificationName = NotificationNameEnum.IdVerificationAccepted;
			statusString = IdVerificationStatusStringEnum.Accepted;
		}

		const notificationContent = await this.notificationContentService.getNotificationContent(notificationName);
		const preferredLanguageUser = user.config.preferredLanguage || 'en';
		const notificationContentUser: NotificationContentType =
			await this.notificationService.createNotificationContentUser(notificationContent, preferredLanguageUser);

		this.webSocketGateway.send(job.data.user.toString(), NotificationEvents.IdVerification, {
			name: notificationContentUser.name,
			content: notificationContentUser.contentForOne,
			status: statusString,
		});

		//retrieve fcmTokens for user
		const fcmTokensUser = await this.notificationService.getUserTokens(job.data.user);

		const createFcmNotificationUser: CreateFcmNotificationType = {
			userId: job.data.user,
			notificationContent: notificationContentUser,
			data: {},
			image: 'https://i.ibb.co/cbV2Tzg/logo.png',
			unseenCount: 1,
			fcmTokens: fcmTokensUser.fcmTokens,
		};
		await this.notificationService.createFcmNotification(createFcmNotificationUser);
	}

	@Process('send-fcm-for-testing')
	async sendFcmForTesting(job: Job<any>) {
		const fcmTokensUser = await this.notificationService.getUserTokens(job.data.user);
		//send notification on socket
		this.webSocketGateway.send(job.data.user.toString(), 'test', { success: 'success' });
		const fcmNotification = {
			notification: {
				title: 'Lovester',
				body: 'Tesing fcm',
				icon: 'https://i.ibb.co/cbV2Tzg/logo.png',
				tag: 'testing',
			},
			fcmTokens: fcmTokensUser ? fcmTokensUser.fcmTokens : [],
			data: null,
			userId: job.data.user,
		};

		this.fcmService.addNotificationFcm(fcmNotification);
	}
}
