export const planExpirationAgg = (skip, limit, beginningExpirationDay, endingExpirationDay) => [
	{
		$match: {
			planExpiration: { $gt: beginningExpirationDay, $lt: endingExpirationDay },
			recullingEnabled: false,
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
