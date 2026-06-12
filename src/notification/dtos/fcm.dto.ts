import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddFcmTokenDto {
	@IsNotEmpty()
	@IsString()
	@ApiProperty()
	fcmToken: string;
}
