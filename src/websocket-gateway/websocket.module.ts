import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { JwtModule } from '@nestjs/jwt';

@Module({
	imports: [
		JwtModule.register({
			secret: process.env.JWT_ACCESS_TOKEN_SECRET,
			signOptions: { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME },
		}),
	],
	providers: [WebsocketGateway],
	exports: [WebsocketGateway],
})
export class WebsocketModule {}
