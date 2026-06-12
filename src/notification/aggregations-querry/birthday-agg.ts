export const birthdayAgg = (skip, limit, isFebruary) => [
	{
		$match: {
			$expr: {
				$and: [
					isFebruary
						? {
								$or: [
									{
										$eq: ['$dayOfBirth', 28],
									},
									{
										$eq: ['$dayOfBirth', 29],
									},
								],
						  }
						: {
								$eq: ['$dayOfBirth', new Date().getUTCDate()],
						  },
					{
						$eq: ['$monthOfBirth', new Date().getUTCMonth() + 1],
					},
				],
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
	{
		$project: {
			_id: 1,
			'config.preferredLanguage': 1,
			birthday: 1,
			firstName: 1,
			'notification.fcmTokens': 1,
		},
	},
	{
		$skip: skip,
	},
	{
		$limit: limit,
	},
];
