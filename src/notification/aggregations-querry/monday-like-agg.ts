export const mondayLikeAgg = (skip, limit) => [
	{
		$match: {
			state: { $lte: 1 },
		},
	},
	{
		$lookup: {
			from: 'users',
			as: 'users',
			let: {
				user: '$user2',
				createdAt: '$createdAt',
			},
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [
								{
									$eq: ['$_id', '$$user'],
								},
								{
									$lt: ['$lastActiveAt', '$$createdAt'],
								},
							],
						},
					},
				},
			],
		},
	},
	{
		$addFields: {
			users: {
				$first: '$users',
			},
		},
	},

	{
		$group: {
			_id: '$users._id',
			preferredLanguage: {
				$first: '$users.config.preferredLanguage',
			},
			count: {
				$sum: 1,
			},
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
	{ $project: { _id: 1, preferredLanguage: 1, count: 1, 'notification.fcmTokens': 1 } },
	{
		$skip: skip,
	},
	{
		$limit: limit,
	},
];
