import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TranslationMapDto } from '../types/translation-map';
import { PaginationDto } from '../abstract/pagination-sort.dto';
import { NotificationNameEnum } from '../config/notification-config';

export class CreateNotificationContentDto {
	@IsEnum(NotificationNameEnum)
	@ApiProperty({ example: 'string', enum: NotificationNameEnum })
	name: string;

	@ValidateNested()
	@ApiProperty()
	@IsNotEmpty()
	@Type(() => TranslationMapDto)
	contentForOne: TranslationMapDto;

	@ValidateNested()
	@ApiProperty()
	@IsOptional()
	@Type(() => TranslationMapDto)
	contentForMany: TranslationMapDto;
}

export class UpdateNotificationContent {
	@ValidateNested()
	@ApiPropertyOptional()
	@Type(() => TranslationMapDto)
	@IsOptional()
	contentForOne: TranslationMapDto;

	@ValidateNested()
	@ApiPropertyOptional()
	@Type(() => TranslationMapDto)
	@IsOptional()
	contentForMany: TranslationMapDto;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional({ example: 'string', enum: NotificationNameEnum })
	name: string;
}
export class FilterDto extends PaginationDto {
	@IsString()
	@ApiPropertyOptional({ enum: NotificationNameEnum })
	@ValidateIf((object, value) => value !== undefined)
	name: string;

	@IsString()
	@ApiPropertyOptional()
	@ValidateIf((object, value) => value !== undefined)
	preferredLanguage: string;
}
