export enum Genders {
	male,
	female,
	other,
}

export const pendingJwtConstants = {
	secret: 'lovester',
};

export enum Role {
	User = 'user',
	Admin = 'admin',
}

export enum AdminRole {
	Operational = 'operational',
	Financial = 'financial',
	Marketing = 'marketing',
	CustomerSupport = 'customer-support',
	Features = 'features',
	PlansCoupons = 'plans-coupons',
	Content = 'content',
	SuperAdmin = 'super-admin',
}
