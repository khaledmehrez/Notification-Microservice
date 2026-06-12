import { Global, Module } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import { FcmService } from './fcm.service';

@Global()
@Module({
	providers: [FcmService],
	exports: [FcmService],
})
export class FcmModule {
	constructor() {
		const fcmCredentials = JSON.parse(fs.readFileSync(process.env.FCM_CONFIGURATION_PATH).toString());
		admin.initializeApp({
			credential: admin.credential.cert(fcmCredentials),
		});
	}
}
