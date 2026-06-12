import { BeforeAll } from './beforeAll';
import { Types } from 'mongoose';
import { MongoClient, ObjectId } from 'mongodb';
import { NotificationNameEnum } from '../src/config/notification-config';
import { accessToken } from './variables';

jest.setTimeout(300000);
describe('Notifications - Part 1 (e2e)', () => {
	let server: BeforeAll;
	let app;

	beforeAll(async () => {
		server = new BeforeAll();
		app = await server.createApp();
	});

	afterAll(async () => {
		server.close().then();
	});

	it('GET notifications', async () => {
		const res = await app.inject({
			method: 'GET',
			url: '/notification',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${accessToken}`,
			},
		});
		expect(res.statusCode).toBe(200);
		expect(JSON.parse(res.body).message).toEqual('FOUND_NOTIFICATION');
	});

	it('Create user notification', async () => {
		const user1 = await server.mongoDriverService.findOne('users', { _id: new Types.ObjectId(server.id) });
		const user2 = await server.mongoDriverService.findOne('users', {
			_id: new Types.ObjectId('62221be39537739e8674d982'),
		});
		const user3 = await server.mongoDriverService.findOne('users', {
			_id: new Types.ObjectId('62221be39537739e8674d983'),
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
		await server.notificationConsumer.createDefaultNotifications(job1);
		await server.notificationConsumer.createDefaultNotifications(job2);
		await server.notificationConsumer.createDefaultNotifications(job3);

		const user1Notification = await server.mongoDriverService.findOne('notifications', {
			user: new Types.ObjectId(server.id),
		});
		const user2Notification = await server.mongoDriverService.findOne('notifications', {
			user: new Types.ObjectId('62221be39537739e8674d982'),
		});
		const user3Notification = await server.mongoDriverService.findOne('notifications', {
			user: new Types.ObjectId('62221be39537739e8674d983'),
		});

		expect(user1Notification).not.toBe(null);
		expect(user2Notification).not.toBe(null);
		expect(user3Notification).not.toBe(null);

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

		expect(user1Notification.notifications.length).toBe(2);
		expect(user1Notification.notifications[0].type).toBe(NotificationNameEnum.Welcome);
		expect(user1Notification.notifications[1].type).toBe(NotificationNameEnum.DefaultConfig);

		expect(user2Notification.notifications.length).toBe(2);
		expect(user2Notification.notifications[0].type).toBe(NotificationNameEnum.Welcome);
		expect(user2Notification.notifications[1].type).toBe(NotificationNameEnum.DefaultConfig);

		expect(user3Notification.notifications.length).toBe(2);
		expect(user3Notification.notifications[0].type).toBe(NotificationNameEnum.Welcome);
		expect(user3Notification.notifications[1].type).toBe(NotificationNameEnum.DefaultConfig);
	});

	it('Like notification: user1 likes user2', async () => {
		server.socketUser2.on('new-like', function (data) {
			server.socketCall();
			const notification = {
				seen: false,
				type: 'like',
				content: 'you have a new like ',
				picture: 'https://lovester-backend-dev.s3.eu-central-1.amazonaws.com/16463174753752350.webp',
			};
			expect(data.notification).toEqual(notification);
		});

		server.fcmServiceAddNotification.mockImplementation((fcmBody) => {
			expect(fcmBody.userId.toString()).toEqual('62221be39537739e8674d982');
			expect(fcmBody.notification.tag).toBe('like');
			expect(fcmBody.notification.body).toBe('You have 2 new likes! ');
		});

		const job: any = {
			data: {
				user1: new Types.ObjectId(server.id),
				user2: new Types.ObjectId('62221be39537739e8674d982'),
				like: new Types.ObjectId('622777d43e18230e8fdf68c1'),
				interaction: {
					_id: '622777d43e18230e8fdf68c1',
					user2Interaction: 0,
					user1Interaction: 5,
					sociologyReport: ['621cded23ff0f4d2c83d3567', '621ce0c93ff0f4d2c83d356f'],
					compatibilityReport: {
						user1Report: {
							open: '61fa7ac053f45574382da20e',
							agree: '61fa811153f45574382da263',
							extro: '61fa851153f45574382da287',
							cons: '61fa7db953f45574382da235',
						},
						user2Report: {
							open: '61fa7ac053f45574382da20e',
							agree: '61fa811153f45574382da263',
							extro: '61fa851153f45574382da287',
							cons: '61fa7db953f45574382da235',
						},
					},
					compatibilityScore: 65.64637134150657,
					type: 'SCIENCE',
					state: 1,
					user2: '62221be39537739e8674d982',
					user1: '62221be39537739e8674d981',
					createdAt: '2022-04-06T14:02:11.296Z',
					updatedAt: '2022-04-06T14:02:11.296Z',
					__v: 0,
				},
			},
		};

		await server.notificationConsumer.likeNotification(job);
		const user2Notification = await server.mongoDriverService.findOne('notifications', {
			user: new Types.ObjectId('62221be39537739e8674d982'),
		});
		expect(user2Notification.notifications.length).not.toBe(0);
		expect(user2Notification.notifications[2].type).toBe('like');
		expect(server.socketCall).toBeCalledTimes(1);
		expect(server.fcmServiceAddNotification).toBeCalledTimes(1);
	});

	it('Match notification', async () => {
		server.socketUser1.on('new-match', function (data) {
			server.socketCall();
			const notification = {
				seen: false,
				type: 'match',
				content: 'BOOM💥You have a new match! ',
				picture: 'https://lovester-backend-dev.s3.eu-central-1.amazonaws.com/16463174753752350.webp',
			};
			expect(data.notification).toEqual(notification);
		});
		server.socketUser2.on('new-match', function (data) {
			server.socketCall();
			const notification = {
				seen: false,
				type: 'match',
				content: 'BOOM💥You have a new match! ',
				picture: 'https://lovester-backend-dev.s3.eu-central-1.amazonaws.com/16463174753752350.webp',
			};
			expect(data.notification).toEqual(notification);
		});

		server.fcmServiceAddNotification.mockImplementation((fcmBody) => {
			expect(fcmBody.userId.toString()).toEqual(server.id);
			expect(fcmBody.notification.tag).toBe('match');
			expect(fcmBody.notification.body).toBe('BOOM💥You have a new match! ');
		});

		const job: any = {
			data: {
				user1: new Types.ObjectId(server.id),
				user2: new Types.ObjectId('62221be39537739e8674d982'),
				match: new Types.ObjectId('622777d43e18230e8fdf68c1'),
				interaction: {
					_id: '622777d43e18230e8fdf68c1',
					user2Interaction: 0,
					user1Interaction: 5,
					sociologyReport: ['621cded23ff0f4d2c83d3567', '621ce0c93ff0f4d2c83d356f'],
					compatibilityReport: {
						user1Report: {
							open: '61fa7ac053f45574382da20e',
							agree: '61fa811153f45574382da263',
							extro: '61fa851153f45574382da287',
							cons: '61fa7db953f45574382da235',
						},
						user2Report: {
							open: '61fa7ac053f45574382da20e',
							agree: '61fa811153f45574382da263',
							extro: '61fa851153f45574382da287',
							cons: '61fa7db953f45574382da235',
						},
					},
					compatibilityScore: 65.64637134150657,
					type: 'SCIENCE',
					state: 1,
					user2: '62221be39537739e8674d982',
					user1: '62221be39537739e8674d981',
					createdAt: '2022-04-06T14:02:11.296Z',
					updatedAt: '2022-04-06T14:02:11.296Z',
					__v: 0,
				},
			},
		};
		await server.notificationConsumer.matchNotification(job);
		const user1Notification = await server.mongoDriverService.findOne('notifications', {
			user: new Types.ObjectId(server.id),
		});
		const user2Notification = await server.mongoDriverService.findOne('notifications', {
			user: new Types.ObjectId('62221be39537739e8674d982'),
		});
		expect(user1Notification.notifications.length).toBe(3);
		expect(user1Notification.notifications[2].type).toBe('match');
		expect(user2Notification.notifications.length).toBe(3);
		expect(user2Notification.notifications[2].type).toBe('like');
		expect(server.socketCall).toBeCalledTimes(2);
		expect(server.fcmServiceAddNotification).toBeCalledTimes(2);
	});

	it('PATCH update notifications settings', async () => {
		const res = await app.inject({
			method: 'PATCH',
			url: '/notification',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${accessToken}`,
			},
			payload: {
				newMatch: true,
				newMessage: false,
				someoneLikedYou: false,
				firstMessageSeen: true,
				firstMessageReceived: false,
			},
		});
		const notification = await server.mongoDriverService.findOne('notifications', {
			user: new Types.ObjectId(server.id),
		});
		expect(notification.settings.newMatch).toEqual(true);
		expect(notification.settings.newMessage).toEqual(false);
		expect(notification.settings.someoneLikedYou).toEqual(false);
		expect(notification.settings.firstMessageSeen).toEqual(true);
		expect(notification.settings.firstMessageReceived).toEqual(false);
		expect(res.statusCode).toBe(200);
		expect(JSON.parse(res.body).message).toEqual('UPDATED_NOTIFICATION');
	});

	it('Message notification', async () => {
		const user = await server.mongoDriverService.findOne('users', {
			_id: new Types.ObjectId('62221be39537739e8674d981'),
		});
		const firstName = user.firstName;
		server.fcmServiceAddNotification.mockImplementation((fcmBody) => {
			expect(fcmBody.userId.toString()).toEqual('62221be39537739e8674d982');
			expect(fcmBody.notification.tag).toBe('message');
			expect(fcmBody.notification.body).toBe(`You received a new message ${firstName}`);
			expect(fcmBody.data.message).toBe('bonjour');
		});

		const job: any = {
			data: {
				user1: new Types.ObjectId(server.id),
				user2: new Types.ObjectId('62221be39537739e8674d982'),
				message: 'bonjour',
			},
		};

		const message = {
			_id: ObjectId.createFromHexString('6218fa3ced69261e61d63dfe'),
			conversation: ObjectId.createFromHexString('61de0267bfcc211fe04472ba'),
			isDelivered: true,
			reactions: [],
			content: 'bonjour',
			destination: ObjectId.createFromHexString('62221be39537739e8674d982'),
			sender: ObjectId.createFromHexString('62221be39537739e8674d981'),
			createdAt: new Date('2022-04-28T13:48:12.013Z'),
			updatedAt: new Date('2022-04-28T14:39:33.805Z'),
			__v: 0,
		};

		const client = await MongoClient.connect(server.mongod.getUri());
		await client.db('lovester').collection('chats').insertOne(message);
		await client.close();
		await server.notificationConsumer.messageNotification(job);
		expect(server.fcmServiceAddNotification).toBeCalledTimes(3);
		server.fcmServiceAddNotification.mockImplementation((fcmBody) => {
			expect(fcmBody.userId.toString()).toEqual('62221be39537739e8674d982');
			expect(fcmBody.notification.tag).toBe('message');
			expect(fcmBody.notification.body).toBe(`You received a new message ${firstName}`);
			expect(fcmBody.data.message).toBe('bonjour');
		});
		await server.notificationConsumer.messageNotification(job);
		expect(server.fcmServiceAddNotification).toBeCalledTimes(4);
	});

	it('Id Verification notification (pending)', async () => {
		server.socketUser1.on('id-verification', function (data) {
			server.socketCall();
			const notification = {
				name: 'id-verification-pending',
				content: 'photo pending',
				status: 'pending',
			};
			expect(data).toEqual(notification);
		});
		server.fcmServiceAddNotification.mockImplementation((fcmBody) => {
			expect(fcmBody.userId.toString()).toEqual('62221be39537739e8674d981');
			expect(fcmBody.notification.tag).toBe('id-verification-pending');
			expect(fcmBody.notification.body).toBe('photo pending');
		});

		const job: any = {
			data: {
				status: 1,
				user: new Types.ObjectId('62221be39537739e8674d981'),
			},
		};
		await server.notificationConsumer.idVerificationNotification(job);
		expect(server.fcmServiceAddNotification).toBeCalledTimes(5);
		expect(server.socketCall).toBeCalledTimes(3);
	});

	it('Id Verification notification (declined)', async () => {
		server.socketUser2.on('id-verification', function (data) {
			server.socketCall();
			const notification = {
				name: 'id-verification-declined',
				content: 'photo declined',
				status: 'declined',
			};
			expect(data).toEqual(notification);
		});
		server.fcmServiceAddNotification.mockImplementation((fcmBody) => {
			expect(fcmBody.userId.toString()).toEqual('62221be39537739e8674d982');
			expect(fcmBody.notification.tag).toBe('id-verification-declined');
			expect(fcmBody.notification.body).toBe('photo declined');
		});

		const job: any = {
			data: {
				status: 0,
				user: new Types.ObjectId('62221be39537739e8674d982'),
			},
		};
		await server.notificationConsumer.idVerificationNotification(job);
		expect(server.fcmServiceAddNotification).toBeCalledTimes(6);
		expect(server.socketCall).toBeCalledTimes(4);
	});

	it('Id Verification notification (accepted)', async () => {
		server.socketUser3.on('id-verification', function (data) {
			server.socketCall();
			const notification = {
				name: 'id-verification-accepted',
				content: 'photo accepted',
				status: 'accepted',
			};
			expect(data).toEqual(notification);
		});
		server.fcmServiceAddNotification.mockImplementation((fcmBody) => {
			expect(fcmBody.userId.toString()).toEqual('62221be39537739e8674d983');
			expect(fcmBody.notification.tag).toBe('id-verification-accepted');
			expect(fcmBody.notification.body).toBe('photo accepted');
		});

		const job: any = {
			data: {
				status: 2,
				user: new Types.ObjectId('62221be39537739e8674d983'),
			},
		};
		await server.notificationConsumer.idVerificationNotification(job);
		expect(server.fcmServiceAddNotification).toBeCalledTimes(7);
		expect(server.socketCall).toBeCalledTimes(5);
	});
});
