export const goBackAgg = (skip, limit, date) => [
	{
		$match: {
			lastActiveAt: { $lt: date },
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
	{ $project: { _id: 1, 'config.preferredLanguage': 1, firstName: 1, 'notification.fcmTokens': 1 } },
	{ $skip: skip },
	{ $limit: limit },
];
