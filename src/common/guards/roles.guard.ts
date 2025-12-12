import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from 'src/common/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
	public constructor(private readonly reflector: Reflector) {}

	public canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (!requiredRoles || requiredRoles.length === 0) {
			return true;
		}

		const req = context.switchToHttp().getRequest();

		if (!req.userSession) {
			throw new UnauthorizedException('Unauthenticated');
		}

		const role = req.userSession.role;

		if (!requiredRoles.includes(role)) {
			throw new ForbiddenException('Insufficient role');
		}

		return true;
	}
}
