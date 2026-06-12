import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SchemaTypes } from 'mongoose';

export const TranslationMapSchema = {
	en: {
		type: SchemaTypes.String,
		required: true,
	},
	fr: {
		type: SchemaTypes.String,
		required: true,
	},
	ar: {
		type: SchemaTypes.String,
		required: false,
	},
};

export type TranslationMap = {
	en: string;
	fr: string;
	ar: string;
};

export class TranslationMapDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ example: 'text' })
	en: string;

	@IsNotEmpty()
	@IsString()
	@ApiProperty({ example: 'text' })
	fr: string;

	@IsOptional()
	@IsString()
	@ApiPropertyOptional({ example: 'text' })
	ar: string;
}
