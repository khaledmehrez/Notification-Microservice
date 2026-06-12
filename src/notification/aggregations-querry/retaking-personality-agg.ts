import { personalityTestTime } from '../../config/notification-config';

export const retakingPersonalityAgg = (skip, limit) => [
	{
		$match: {
			personalityTestTime: {
				$lt: personalityTestTime,
			},
		},
	},
	{
		$lookup: {
			from: 'users',
			localField: 'user',
			foreignField: '_id',
			as: 'user',
		},
	},
	{
		$lookup: {
			from: 'notifications',
			localField: 'user._id',
			foreignField: 'user',
			as: 'notification',
		},
	},
	{
		$unwind: {
			path: '$user',
		},
	},
	{
		$unwind: {
			path: '$notification',
		},
	},

	{
		$project: {
			_id: 1,
			'user._id': 1,
			'user.config.preferredLanguage': 1,
			'notification.fcmTokens': 1,
		},
	},

	{ $skip: skip },
	{ $limit: limit },
];
