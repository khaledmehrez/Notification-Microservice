import { maxUserPictures } from '../../config/notification-config';

export const sendTipsAgg = (skip, limit) => [
	{
		$match: {
			$or: [
				{
					bio: '',
				},
				{
					$expr: { $lt: [{ $size: '$pictures' }, maxUserPictures] },
				},
			],
		},
	},
	{
		$lookup: {
			from: 'notifications',
			localField: '_id',
			foreignField: 'user',
			as: 'notification',
		},
	},
	{
		$unwind: {
			path: '$notification',
		},
	},

	{ $project: { _id: 1, 'config.preferredLanguage': 1, 'notification.fcmTokens': 1 } },
	{
		$skip: skip,
	},
	{ $limit: limit },
];
