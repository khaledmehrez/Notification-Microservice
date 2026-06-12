import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { MongoClient, ObjectId } from 'mongodb';
import fs = require('fs');
import path = require('path');

export const rootMongooseTestModule = (options: MongooseModuleOptions = {}) =>
	MongooseModule.forRootAsync({
		useFactory: async () => {
			const client = await MongoClient.connect(options.uri);
			const db = client.db('lovester');
			const data_questions = fs.readFileSync(path.resolve(__dirname, 'questions.json'));
			const docs_questions = JSON.parse(data_questions.toString());

			const questions = docs_questions.map((element) => {
				const e = element;
				e._id = ObjectId.createFromHexString(element._id);
				e.questions = element.questions.map((q) => {
					const qu = q;
					qu._id = ObjectId.createFromHexString(q._id);
					qu.options = q.options.map((o) => {
						const option = o;
						option._id = ObjectId.createFromHexString(o._id);
						return option;
					});
					return qu;
				});
				return e;
			});

			await db.collection('questions').insertMany(questions);
			const data_reports = fs.readFileSync(path.resolve(__dirname, 'reports.json'));
			const docs_reports = JSON.parse(data_reports.toString());

			const reports = docs_reports.map((report) => {
				const r = report;
				r._id = ObjectId.createFromHexString(report._id);
				return r;
			});
			await db.collection('reports').insertMany(reports);

			const data_user = fs.readFileSync(path.resolve(__dirname, 'users.json'));
			const docs_user = JSON.parse(data_user.toString());

			const users = docs_user.map((user) => {
				const u = user;
				u._id = ObjectId.createFromHexString(user._id);
				u.pictures = user.pictures.map((picture) => {
					const p = picture;
					p._id = ObjectId.createFromHexString(picture._id);
					return p;
				});
				if (user._id.toString() === '62221be39537739e8674d984') {
					u.lastActiveAt = new Date();
				} else {
					u.lastActiveAt = new Date(u.lastActiveAt);
				}
				if (user._id.toString() === '62221be39537739e8674d982') {
					user.birthday = new Date();
					user.birthday.setFullYear(1996);

					u.dayOfBirth = u.birthday.getDate();
					u.monthOfBirth = u.birthday.getMonth() + 1;
				} else {
					u.birthday = new Date(u.birthday);
				}

				u.reports.psychology = ObjectId.createFromHexString(user.reports.psychology);
				u.reports.sexuality = ObjectId.createFromHexString(user.reports.sexuality);
				u.reports.loveLanguage = ObjectId.createFromHexString(user.reports.loveLanguage);
				u.reports.sociology = user.reports.sociology.map((reportSociology) =>
					ObjectId.createFromHexString(reportSociology),
				);
				return u;
			});

			await db.collection('users').insertMany(users);

			const data_interactions = fs.readFileSync(path.resolve(__dirname, 'interactions.json'));
			const docs_interactions = JSON.parse(data_interactions.toString());
			const interactions = docs_interactions.map((interaction) => {
				const i = interaction;
				i._id = ObjectId.createFromHexString(interaction._id);
				i.user1 = ObjectId.createFromHexString(interaction.user1);
				i.user2 = ObjectId.createFromHexString(interaction.user2);
				i.createdAt = new Date(i.createdAt);
				i.updatedAt = new Date(i.updatedAt);
				i.sociologyReport = interaction.sociologyReport.map((sociology) => ObjectId.createFromHexString(sociology));
				i.compatibilityReport.user1Report.open = ObjectId.createFromHexString(
					interaction.compatibilityReport.user1Report.open,
				);
				i.compatibilityReport.user1Report.agree = ObjectId.createFromHexString(
					interaction.compatibilityReport.user1Report.agree,
				);
				i.compatibilityReport.user1Report.extro = ObjectId.createFromHexString(
					interaction.compatibilityReport.user1Report.extro,
				);
				i.compatibilityReport.user1Report.cons = ObjectId.createFromHexString(
					interaction.compatibilityReport.user1Report.cons,
				);
				i.compatibilityReport.user2Report.open = ObjectId.createFromHexString(
					interaction.compatibilityReport.user2Report.open,
				);
				i.compatibilityReport.user2Report.agree = ObjectId.createFromHexString(
					interaction.compatibilityReport.user2Report.agree,
				);
				i.compatibilityReport.user2Report.extro = ObjectId.createFromHexString(
					interaction.compatibilityReport.user2Report.extro,
				);
				i.compatibilityReport.user2Report.cons = ObjectId.createFromHexString(
					interaction.compatibilityReport.user2Report.cons,
				);
				return i;
			});
			await db.collection('interactions').insertMany(interactions);

			const dataNotificationContents = fs.readFileSync(path.resolve(__dirname, 'notificationcontents.json'));
			const docsNotificationContents = JSON.parse(dataNotificationContents.toString());
			const notificationContents = docsNotificationContents.map((content) => {
				const n = content;
				n._id = ObjectId.createFromHexString(content._id);
				return n;
			});
			await db.collection('notificationcontents').insertMany(notificationContents);

			const data_conversations = fs.readFileSync(path.resolve(__dirname, 'conversations.json'));
			const docs_conversations = JSON.parse(data_conversations.toString());
			const conversations = docs_conversations.map((conversation) => {
				const conv = conversation;
				conv._id = ObjectId.createFromHexString(conversation._id);
				conv.user1 = ObjectId.createFromHexString(conversation.user1);
				conv.user2 = ObjectId.createFromHexString(conversation.user2);
				conv.match = ObjectId.createFromHexString(conversation.match);
				if (conv.latestMessage) {
					conv.latestMessage = ObjectId.createFromHexString(conversation.latestMessage);
				}
				return conv;
			});
			await db.collection('conversations').insertMany(conversations);

			const dataUserInfo = fs.readFileSync(path.resolve(__dirname, 'userinfos.json'));
			const docsUserInfo = JSON.parse(dataUserInfo.toString());
			const UserInfos = docsUserInfo.map((info) => {
				info._id = ObjectId.createFromHexString(info._id);
				info.user = ObjectId.createFromHexString(info.user);
				info.appUse.startAt = new Date(info.appUse.startAt);
				info.startedAt = new Date(info.startedAt);
				return info;
			});
			await db.collection('userinfos').insertMany(UserInfos);

			const dataUserPacks = fs.readFileSync(path.resolve(__dirname, 'userpacks.json'));
			const docsUserPacks = JSON.parse(dataUserPacks.toString());
			const UserPacks = docsUserPacks.map((packs) => {
				packs._id = ObjectId.createFromHexString(packs._id);
				packs.user = ObjectId.createFromHexString(packs.user);
				packs.boost[0].expiration = new Date(packs.boost[0].expiration);
				packs.boost[0].enabledAfter = new Date(packs.boost[0].enabledAfter);
				packs.boost[0]._id = ObjectId.createFromHexString(packs.boost[0]._id);
				packs.compatibilityReport[0].expiration = new Date(packs.compatibilityReport[0].expiration);
				packs.compatibilityReport[0].enabledAfter = new Date(packs.compatibilityReport[0].enabledAfter);
				packs.compatibilityReport[0]._id = ObjectId.createFromHexString(packs.compatibilityReport[0]._id);
				packs.createdAt = new Date(packs.createdAt);
				packs.planExpiration = new Date();
				packs.planExpiration.setDate(packs.planExpiration.getDate() + 3);
				return packs;
			});
			await db.collection('userpacks').insertMany(UserPacks);

			await client.close();
			options.uri += 'lovester';
			return options;
		},
	});
