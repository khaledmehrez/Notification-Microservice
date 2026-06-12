export const notTextedMatchesAgg = (skip, limit) => [
	{
		$match: {
			hasMessage: false,
		},
	},
	{
		$group: {
			_id: '$user1',
			count: {
				$sum: 1,
			},
		},
	},
	{
		$lookup: {
			from: 'users',
			localField: '_id',
			foreignField: '_id',
			as: 'user',
		},
	},

	{
		$project: {
			_id: 1,
			'user.config.preferredLanguage': 1,
			'user._id': 1,
			count: 1,
		},
	},
	{
		$unwind: {
			path: '$user',
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
			path: '$notification',
		},
	},
	{ $project: { _id: 1, count: 1, user: 1, 'notification.fcmTokens': 1 } },
	{
		$skip: skip,
	},
	{
		$limit: limit,
	},
];
