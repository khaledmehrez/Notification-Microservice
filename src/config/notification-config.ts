export const maxNotificationsCount = 50;
export const limit = 1000;
export const maxUserPictures = 8;
export const absentTime = 7;
export const personalityTestTime = 300;
export const birthdayCoupon = 'happy-birthday';
export const daysLeft = 3;
export const NotificationEvents = {
	Match: 'new-match',
	Chat: 'chat',
	Like: 'new-like',
	Welcome: 'welcome',
	DefaultConfig: 'default-config',
	Nsfw: 'nsfw',
	IdVerification: 'id-verification',
};
export enum NotificationNameEnum {
	Match = 'match',
	Like = 'like',
	Message = 'message',
	Welcome = 'welcome',
	DefaultConfig = 'default-config',
	PeakDay = 'peak-day',
	Birthday = 'birthday',
	GoBack = 'go-back',
	Tips = 'tips',
	ShareLovester = 'share-lovester',
	Gift = 'gift',
	PlanExpiration = 'plan-expiration',
	RetakingPersonalityTest = 'retaking-personality-test',
	MondayLikes = 'monday-likes',
	NotTextedMatches = 'not-texted-matches',
	Nsfw = 'nsfw',
	IdVerificationDeclined = 'id-verification-declined',
	IdVerificationPending = 'id-verification-pending',
	IdVerificationAccepted = 'id-verification-accepted',
}

export enum IdVerificationStatusStringEnum {
	Declined = 'declined',
	Pending = 'pending',
	Accepted = 'accepted',
}

export enum InteractionStateEnum {
	Match = 5,
}
