import {
    BadRequestException,
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { extractToken, getUserFromToken } from 'src/utils/functions/auth.functions';


@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const isAuthenticated = this.reflector.get<boolean>(
            'isAuthenticated',
            context.getHandler(),
        );

        const request = context.switchToHttp().getRequest();

        const originalUrl = request.originalUrl;
        const method = request?.route?.['stack'][0].method;

        const token = extractToken(request.headers['authorization']);
        let errorName: string;

        if (token) {
            try {
                const user = getUserFromToken(token);
                if (user) {
                    request.user = user;
                    request.token = token;
                }
            } catch (err) {
                errorName = err.name;
            }
        }

        if (!isAuthenticated) {
            Logger.log(`UnAuthenticated: ${method} ${originalUrl}`);
            return true;
        }

        if (request.user) {
            Logger.log(`${method} ${originalUrl} authorized`);
            return true;
        }

        if (errorName === 'TokenExpiredError')
            throw new UnauthorizedException('Token expired');
        if (errorName === 'TypeError' || errorName === 'SyntaxError')
            throw new BadRequestException('Bad Token');

        Logger.log(
            `${method} ${originalUrl} the access to this resource has been forbidden`,
        );
        return false;
    }
}
