import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { env } from 'process';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor() {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			signOptions: { expiresIn: env.JWT_ACCESS_TOKEN_EXPIRATION_TIME },
			secretOrKey: env.JWT_ACCESS_TOKEN_SECRET,
		});
	}

	async validate(payload: any) {
		if (payload.exp > Date.now()) {
			throw new UnauthorizedException();
		} else {
			delete payload.exp;
			delete payload.iat;
			return payload;
		}
	}
}
