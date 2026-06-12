import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { AdminRole } from '../src/guards/constants';
import { accessToken } from './variables';
import { BeforeAll } from './beforeAll';

jest.setTimeout(300000);
describe('Notification Content (e2e)', () => {
	let app: NestFastifyApplication;
	let idNotif = '';
	let server: BeforeAll;

	beforeAll(async () => {
		server = new BeforeAll();
		app = await server.createApp();
		server.role = [AdminRole.Content];
		server.id = '620d6c31cc685c4215e49b2a';
	});

	afterAll(async () => {
		server.close().then();
	});

	it('POST create notification content', async () => {
		const res = await app.inject({
			method: 'POST',
			url: '/notification-content',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${accessToken}`,
			},
			payload: {
				name: 'message',
				contentForOne: {
					en: 'content for one',
					fr: 'contenu pour une personne',
					ar: 'content for one',
				},
				contentForMany: {
					en: 'content for many',
					fr: 'contenu pour plusieurs personne',
					ar: 'content for many',
				},
			},
		});
		const result = JSON.parse(res.body);
		expect(res.statusCode).toBe(201);
		expect(result.message).toEqual('NOTIFICATION_CONTENT_CREATED');
		const notif = await server.mongoDriverService.findOne('notificationcontents', {
			contentForOne: {
				en: 'content for one',
				fr: 'contenu pour une personne',
				ar: 'content for one',
			},
		});
		idNotif = notif._id;
	});

	it('PATCH update notification content', async () => {
		const res = await app.inject({
			method: 'PATCH',
			url: `/notification-content/${idNotif}`,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${accessToken}`,
			},
			payload: {
				name: 'message',
				contentForOne: {
					en: 'new content for one',
					fr: 'nouveau contenu pour une personne',
					ar: 'new content for one',
				},
				contentForMany: {
					en: 'new content for many',
					fr: 'nouveau contenu pour plusieurs personne',
					ar: 'new content for many',
				},
			},
		});
		const result = JSON.parse(res.body);
		expect(res.statusCode).toBe(200);
		expect(result.message).toEqual('NOTIFICATION_CONTENT_UPDATED');
	});

	it('GET notification content without filters', async () => {
		const res = await app.inject({
			method: 'GET',
			url: '/notification-content',
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});
		const result = JSON.parse(res.body);
		expect(res.statusCode).toBe(200);
		expect(result.message).toEqual('FOUND_NOTIFICATION_CONTENT');
	});

	it('GET notification content with filters', async () => {
		const res = await app.inject({
			method: 'GET',
			url: '/notification-content?name=message&preferredLanguage=en',
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});
		const result = JSON.parse(res.body);
		expect(res.statusCode).toBe(200);
		expect(result.data.length).toBe(2);
		expect(JSON.parse(res.body).message).toEqual('FOUND_NOTIFICATION_CONTENT');
		for (let i = 0; i < result.data.length; i++) {
			expect(result.data[i].name).toBe('message');
		}
	});
});
