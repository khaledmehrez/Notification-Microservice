import { SetMetadata } from '@nestjs/common';
import { AdminRole } from './constants';

export const ROLES_KEY = 'roles';
export const AdminRoles = (...roles: AdminRole[]) => SetMetadata(ROLES_KEY, roles);
