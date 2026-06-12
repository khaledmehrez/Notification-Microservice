import { plainToClass } from 'class-transformer';
import { validateSync, ValidateIf, IsDefined } from 'class-validator';

class EnvironmentVariables {
	@IsDefined()
	MONGO_URL;

	@IsDefined()
	MONGO_SERVER_URL;

	@IsDefined()
	JWT_ACCESS_TOKEN_SECRET;

	@IsDefined()
	JWT_ACCESS_TOKEN_EXPIRATION_TIME;

	@IsDefined()
	USER_MS_URL;

	@IsDefined()
	AUTH_MS_URL;

	@IsDefined()
	PERSONALITY_MS_URL;

	@IsDefined()
	MATCH_MS_URL;

	@IsDefined()
	CHAT_MS_URL;

	@IsDefined()
	NOTIFICATION_MS_URL;

	@IsDefined()
	MEDIA_MS_URL;

	@IsDefined()
	SUGGESTIONS_MS_URL;

	@IsDefined()
	PAYMENT_MS_URL;

	@IsDefined()
	BILLING_MS_URL;

	@IsDefined()
	@ValidateIf((object) => object.NOTIFICATION_MS_PORT === undefined)
	DEFAULT_PORT;

	@IsDefined()
	@ValidateIf((object) => object.DEFAULT_PORT === undefined)
	NOTIFICATION_MS_PORT;

	@IsDefined()
	WEBSOCKET_PORT;

	@IsDefined()
	FCM_CONFIGURATION_PATH;

	@IsDefined()
	NOTIFICATION_REDIS_HOST;

	@IsDefined()
	NOTIFICATION_REDIS_PORT;

	@IsDefined()
	NOTIFICATION_SENTINEL_NAME;

	@IsDefined()
	BULL_REDIS_HOST;

	@IsDefined()
	BULL_REDIS_PORT;

	@IsDefined()
	BULL_SENTINEL_NAME;
}

export function validateEnv(config: Record<string, unknown>) {
	const validatedConfig = plainToClass(EnvironmentVariables, config, { enableImplicitConversion: true });
	const errors = validateSync(validatedConfig, { skipNullProperties: false, skipMissingProperties: false });

	if (errors.length > 0) {
		throw new Error(errors.toString());
	}
	return validatedConfig;
}
