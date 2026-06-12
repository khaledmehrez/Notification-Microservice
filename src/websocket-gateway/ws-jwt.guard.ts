import { Observable } from 'rxjs';
import { CanActivate, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsGuard implements CanActivate {
	constructor(private jwtService: JwtService) {}

	canActivate(context: any): boolean | any | Promise<boolean | any> | Observable<boolean | any> {
		const bearerToken = context.args[0].handshake.auth.token;
		try {
			const decoded = this.jwtService.verify(bearerToken, {
				secret: process.env.JWT_ACCESS_TOKEN_SECRET,
			});
			if (!decoded.user) {
				return false;
			}
			context.switchToWs().getClient().handshake.auth = { user: decoded.user };
			return true;
		} catch (ex) {
			throw new WsException({ status: 401, error: 'unauthorized' });
		}
	}
}
