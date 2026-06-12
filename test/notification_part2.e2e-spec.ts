import { Types } from 'mongoose';
import { BeforeAll } from './beforeAll';
import { NotificationNameEnum } from '../src/config/notification-config';
import { accessToken } from './variables';

jest.setTimeout(300000);

describe('Notifications - Part 2 (e2e)', () => {
	let app;
	let server: BeforeAll;

	beforeAll(async () => {
		server = new BeforeAll();
		app = await server.createApp();
	});
	afterAll(async () => {
		server.close().then();
		app.close().then();
	});

	it('Create user notification', async () => {
		const user1 = await server.mongoDriverService.findOne('users', { _id: new Types.ObjectId(server.id) });
		const user2 = await server.mongoDriverService.findOne('users', {
			_id: new Types.ObjectId('62221be39537739e8674d982'),
		});
		const user3 = await server.mongoDriverService.findOne('users', {
			_id: new Types.ObjectId('62221be39537739e8674d983'),
		});
		const user4 = await server.mongoDriverService.findOne('users', {
			_id: new Types.ObjectId('62221be39537739e8674d984'),
		});

		const job1: any = {
			data: {
				user: user1._id,
			},
		};

		const job2: any = {
			data: {
				user: user2._id,
			},
		};
		const job3: any = {
			data: {
				user: user3._id,
			},
		};
		const job4: any = {
			data: {
				user: user4._id,
			},
		};
		await server.notificationConsumer.createDefaultNotifications(job1);
		await server.notificationConsumer.createDefaultNotifications(job2);
		await server.notificationConsumer.createDefaultNotifications(job3);
		await server.notificationConsumer.createDefaultNotifications(job4);

		const user1Notification = await server.mongoDriverService.findOne('notifications', {
			user: new Types.ObjectId(server.id),
		});
		const user2Notification = await server.mongoDriverService.findOne('notifications', {
			user: new Types.ObjectId('62221be39537739e8674d982'),
		});
		const user3Notification = await server.mongoDriverService.findOne('notifications', {
			user: new Types.ObjectId('62221be39537739e8674d983'),
		});
		const user4Notification = await server.mongoDriverService.findOne('notifications', {
			user: new Types.ObjectId('62221be39537739e8674d984'),
		});

		expect(user1Notification).not.toBe(null);
		expect(user2Notification).not.toBe(null);
		expect(user3Notification).not.toBe(null);
		expect(user4Notification).not.toBe(null);

		expect(user1Notification.settings).toEqual({
			newMatch: true,
			newMessage: true,
			someoneLikedYou: true,
			firstMessageSeen: true,
			firstMessageReceived: true,
		});
		expect(user2Notification.settings).toEqual({
			newMatch: true,
			newMessage: true,
			someoneLikedYou: true,
			firstMessageSeen: true,
			firstMessageReceived: true,
		});
		expect(user3Notification.settings).toEqual({
			newMatch: true,
			newMessage: true,
			someoneLikedYou: true,
			firstMessageSeen: true,
			firstMessageReceived: true,
		});
		expect(user4Notification.settings).toEqual({
			newMatch: true,
			newMessage: true,
			someoneLikedYou: true,
			firstMessageSeen: true,
			firstMessageReceived: true,
		});

		expect(user1Notification.notifications.length).toBe(2);
		expect(user1Notification.notifications[0].type).toBe(NotificationNameEnum.Welcome);
		expect(user1Notification.notifications[1].type).toBe(NotificationNameEnum.DefaultConfig);

		expect(user2Notification.notifications.length).toBe(2);
		expect(user2Notification.notifications[0].type).toBe(NotificationNameEnum.Welcome);
		expect(user2Notification.notifications[1].type).toBe(NotificationNameEnum.DefaultConfig);

		expect(user3Notification.notifications.length).toBe(2);
		expect(user3Notification.notifications[0].type).toBe(NotificationNameEnum.Welcome);
		expect(user3Notification.notifications[1].type).toBe(NotificationNameEnum.DefaultConfig);

		expect(user4Notification.notifications.length).toBe(2);
		expect(user4Notification.notifications[0].type).toBe(NotificationNameEnum.Welcome);
		expect(user4Notification.notifications[1].type).toBe(NotificationNameEnum.DefaultConfig);
	});

	it('PEAK DAY', async () => {
		const peakDay = {
			title: 'peak-day',
			body: ' Some people call it Thursday, we like to call it “Peak Day”💫 Activate “Rise Up” today to increase your match chances',
			icon: 'https://i.ibb.co/cbV2Tzg/logo.png',
			tag: 'peak-day',
		};
		server.fcmServiceSendToTopic.mockImplementation((topic, data) => {
			expect(topic).toBe('all');
			expect(data).toStrictEqual(peakDay);
		});
		await server.notificationConsumer.peakDay();
		expect(server.fcmServiceSendToTopic).toBeCalledTimes(1);
	});

	it('SHARE-LOVESTER-NOTIFICATION', async () => {
		const shareLovesterNotification = {
			title: 'Lovester',
			body: ' They say “Good Friends Follow You Anywhere” - Would your friends follow you to Lovester? Invite them now and get rewards (for both of you!!) ',
			icon: 'https://i.ibb.co/cbV2Tzg/logo.png',
			tag: 'share-lovester',
		};
		server.fcmServiceSendToTopic.mockImplementation((topic, data) => {
			expect(topic).toBe('all');
			expect(data).toStrictEqual(shareLovesterNotification);
		});
		await server.notificationConsumer.shareLovester();
		expect(server.fcmServiceSendToTopic).toBeCalledTimes(2);
	});

	it('tips-notification', async () => {
		const notification = {
			title: 'Lovester',
			body: 'Time to step up the game! Make your profile stand out by adding more pictures and including a witty bio 😉  ',
			icon: 'https://i.ibb.co/cbV2Tzg/logo.png',
			tag: 'tips',
		};
		server.fcmServiceAddNotification.mockImplementation((data) => {
			expect(data.notification.title).toBe(notification.title);
			expect(data.notification.body).toBe(notification.body);
			expect(data.notification.icon).toBe(notification.icon);
			expect(data.notification.tag).toBe(notification.tag);
		});
		await server.notificationConsumer.tipsNotification();
		expect(server.fcmServiceAddNotification).toBeCalledTimes(4);
	});

	it('GO-BACK-NOTIFICATION', async () => {
		const notification = {
			title: 'Lovester',
			body1: `“I love you Iheb” this could have been you but you haven’t been matching for a while… Get back to the game!  `,
			body2: `“I love you Yasmine” this could have been you but you haven’t been matching for a while… Get back to the game!  `,
			body3: `“I love you Ranim” this could have been you but you haven’t been matching for a while… Get back to the game!  `,
			icon: 'https://i.ibb.co/cbV2Tzg/logo.png',
			tag: 'go-back',
		};
		server.fcmServiceAddNotification.mockImplementation((data) => {
			expect(data.notification.title).toBe(notification.title);
			expect([notification.body1, notification.body2, notification.body3]).toContain(data.notification.body);
			expect(data.notification.icon).toBe(notification.icon);
			expect(data.notification.tag).toBe(notification.tag);
		});
		await server.notificationConsumer.goBackNotification();
		expect(server.fcmServiceAddNotification).toBeCalledTimes(7);
	});

	it('GIFT-NOTIFICATION', async () => {
		const notification = {
			title: 'Lovester',
			body: 'GOTD stands for “Gift Of The Day” and it’s already waiting for you! One Free (lovester) available for you to use now. Use it wisely 😉',
			icon: 'https://i.ibb.co/cbV2Tzg/logo.png',
			tag: 'gift',
		};
		server.fcmServiceAddNotification.mockImplementation((data) => {
			expect(data.notification.title).toBe(notification.title);
			expect(data.notification.body).toBe(notification.body);
			expect(data.notification.icon).toBe(notification.icon);
			expect(data.notification.tag).toBe(notification.tag);
		});
		const job: any = {
			data: {
				users: [new Types.ObjectId('62221be39537739e8674d982')],
				coupon: 'lovester',
			},
		};
		await server.notificationConsumer.giftNotification(job);
		expect(server.fcmServiceAddNotification).toBeCalledTimes(8);
	});

	it('BIRTHDAY-NOTIFICATION', async () => {
		const notification = {
			title: 'Lovester',
			body: 'Today, we celebrate YOU! Happy 27 amazing trips around the sun, Yasmine ! Enjoy (n)% off any purchase you make until midnight with the code: (happy-birthday)   ',
			icon: 'https://i.ibb.co/cbV2Tzg/logo.png',
			tag: 'birthday',
		};
		server.fcmServiceAddNotification.mockImplementation((data) => {
			expect(data.notification.title).toBe(notification.title);
			expect(data.notification.body).toBe(notification.body);
			expect(data.notification.icon).toBe(notification.icon);
			expect(data.notification.tag).toBe(notification.tag);
		});
		await server.notificationConsumer.birthdayNotification();
		expect(server.fcmServiceAddNotification).toBeCalledTimes(9);
	});

	it('RETAKING-PERSONALITY-TEST-NOTIFICATION', async () => {
		const notification = {
			title: 'Lovester',
			body: 'LAST CALL! You can now take the Emotional DNA Test again, but make sure to take your time and answer honestly to improve your recommendations! ',
			icon: 'https://i.ibb.co/cbV2Tzg/logo.png',
			tag: 'retaking-personality-test',
		};
		server.fcmServiceAddNotification.mockImplementation((data) => {
			expect(data.notification.title).toBe(notification.title);
			expect(data.notification.body).toBe(notification.body);
			expect(data.notification.icon).toBe(notification.icon);
			expect(data.notification.tag).toBe(notification.tag);
		});
		await server.notificationConsumer.retakingPersonalityTestNotification();
		expect(server.fcmServiceAddNotification).toBeCalledTimes(10);
	});

	it('PLAN-EXPIRATION-NOTIFICATION', async () => {
		const notification = {
			title: 'Lovester',
			body: 'Your Premium Journey with Lovester is Almost Over 😢  Your subscription is about to expire. Only 3 days left! Renew TODAY ',
			icon: 'https://i.ibb.co/cbV2Tzg/logo.png',
			tag: 'plan-expiration',
		};
		server.fcmServiceAddNotification.mockImplementation((data) => {
			expect(data.notification.title).toBe(notification.title);
			expect(data.notification.body).toBe(notification.body);
			expect(data.notification.icon).toBe(notification.icon);
			expect(data.notification.tag).toBe(notification.tag);
		});
		await server.notificationConsumer.planExpirationNotification();
		expect(server.fcmServiceAddNotification).toBeCalledTimes(11);
	});

	it('MONDAY-LIKES-NOTIFICATION', async () => {
		const notification = {
			title: 'Lovester',
			body: 'New Monday, New Week, New Likes✨ You received 2 new likes, start your day by checking them out!',
			icon: 'https://i.ibb.co/cbV2Tzg/logo.png',
			tag: 'monday-likes',
		};
		server.fcmServiceAddNotification.mockImplementation((data) => {
			expect(data.notification.title).toBe(notification.title);
			expect(data.notification.body).toBe(notification.body);
			expect(data.notification.icon).toBe(notification.icon);
			expect(data.notification.tag).toBe(notification.tag);
			expect(data.userId.toString()).toBe('62221be39537739e8674d982');
		});
		await server.notificationConsumer.mondayLikesNotification();
		expect(server.fcmServiceAddNotification).toBeCalledTimes(12);
	});

	it('not-texted-matches-notification', async () => {
		const notification = {
			title: 'Lovester',
			body: 'Hey! You have a match waiting for you, don’t forget to text them!',
			icon: 'https://i.ibb.co/cbV2Tzg/logo.png',
			tag: 'not-texted-matches',
		};
		server.fcmServiceAddNotification.mockImplementation((data) => {
			expect(data.notification.title).toBe(notification.title);
			expect(data.notification.body).toBe(notification.body);
			expect(data.notification.icon).toBe(notification.icon);
			expect(data.notification.tag).toBe(notification.tag);
		});
		await server.notificationConsumer.notTextedMatchesNotification();
		expect(server.fcmServiceAddNotification).toBeCalledTimes(13);
	});

	it('NSFW_NOTIFICATION', async () => {
		server.socketUser2.on('nsfw', function (data) {
			server.socketCall();
			const result = {
				picture: '6220cfec6570369bcd4a6711',
				isSafe: true,
				notification: {
					seen: false,
					type: 'nsfw',
					content: 'photo approved',
					picture: 'https://lovester-backend-dev.s3.eu-central-1.amazonaws.com/16463174753752350.webp',
				},
			};
			expect(data.notification).toEqual(result.notification);
			expect(data.picture).toEqual('6220cfec6570369bcd4a6711');
			expect(data.isSafe).toEqual(true);
		});
		const job: any = {
			data: {
				user: new Types.ObjectId('62221be39537739e8674d982'),
				picture: new Types.ObjectId('6220cfec6570369bcd4a6711'),
				isSafe: true,
			},
		};
		await server.notificationConsumer.nsfwNotification(job);
		expect(server.fcmServiceAddNotification).toBeCalled();
		const userNotification = await server.mongoDriverService.findOne('notifications', {
			user: new Types.ObjectId('62221be39537739e8674d982'),
		});
		expect(userNotification.notifications.length).toBe(3);
		expect(userNotification.notifications[2].type).toBe('nsfw');
		expect(userNotification.notifications[2].picture).toBe(
			'https://lovester-backend-dev.s3.eu-central-1.amazonaws.com/16463174753752350.webp',
		);
		expect(userNotification.notifications[2].content).toBe('photo approved');
		expect(server.socketCall).toBeCalledTimes(1);
	});

	it('ADD TOKEN', async () => {
		server.fcmServiceSubscribeToTopic.mockImplementation((topic, fcmToken) => {
			expect(topic).toBe('all');
			expect(fcmToken).toStrictEqual('token');
		});
		const res = await app.inject({
			method: 'POST',
			url: '/notification/add-token',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${accessToken}`,
			},
			payload: {
				fcmToken: 'token',
			},
		});
		const result = JSON.parse(res.body);
		expect(res.statusCode).toBe(201);
		expect(result.message).toEqual('ADDED_FCM_TOKEN');
		const userNotification = await server.mongoDriverService.findOne('notifications', {
			user: new Types.ObjectId('62221be39537739e8674d981'),
		});
		expect(userNotification.fcmTokens).toContain('token');
	});
});
