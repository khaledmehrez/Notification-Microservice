import { registerDecorator, ValidationOptions } from 'class-validator';
import { isValidCron } from 'cron-validator';

export function IsCron(validationOptions?: ValidationOptions) {
	return function (object: object, propertyName: string) {
		if (!validationOptions) validationOptions = { message: `${propertyName} must be a valid cron string` };
		if (!validationOptions.message) validationOptions.message = `${propertyName} must be a valid cron string`;

		registerDecorator({
			name: 'IsCron',
			target: object.constructor,
			propertyName: propertyName,
			options: validationOptions,
			validator: {
				validate(value: any) {
					return (
						value && isValidCron(value, { seconds: true, alias: true, allowBlankDay: true, allowSevenAsSunday: true })
					);
				},
			},
		});
	};
}
