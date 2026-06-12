import { Global, Module } from '@nestjs/common';
import { FcmService } from '../../src/fcm/fcm.service';

@Global()
@Module({
	providers: [FcmService],
	exports: [FcmService],
})
export class FcmModuleMock {}
