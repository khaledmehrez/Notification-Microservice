import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole } from './constants';
import { ROLES_KEY } from './admin-roles.decorator';
import { getEnumValues } from '@nestjs/swagger/dist/utils/enum.utils';

@Injectable()
export class AdminRolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.getAllAndOverride<AdminRole[]>(ROLES_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		const req = context.switchToHttp().getRequest();
		if (requiredRoles.length === 0) {
			const newRequiredRoles = getEnumValues(AdminRole);
			return newRequiredRoles.some((role) => req.user.roles?.includes(role));
		}
		return requiredRoles.some((role) => req.user.roles?.includes(role));
	}
}
