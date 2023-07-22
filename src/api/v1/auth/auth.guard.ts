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
import { getUserFromIdToken } from 'src/utils/functions/auth.functions';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    private _extractToken(token: string): string {
        if (!token) return null;
        if (token.split(' ')[0] !== 'Bearer') return null;
        return token.split(' ')[1];
    }

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {

        // Get http or graphql request :
        const request = context.switchToHttp().getRequest();
        const originalUrl = request.originalUrl;
        const method = request?.route?.['stack'][0].method;
        Logger.log(`Call : ${method} ${originalUrl} `);

        const token = this._extractToken(request.cookies['idToken']);

        if (Boolean(token)) {
            try {
                const user = getUserFromIdToken(token);

                if (!user) throw new UnauthorizedException('Unauthorized');

                if (user) {
                    Logger.log(`${method} ${originalUrl} authorized`);
                    request.user = user;
                    request.token = token;
                    return true;
                }
            } catch (err) {
                Logger.error(`${method} ${originalUrl} unauthorized bad token`);
                Logger.error(err.message);
                if (err.name === 'TokenExpiredError') throw new UnauthorizedException();
                if (err.name === 'TypeError' || err.name === 'SyntaxError')
                    throw new BadRequestException('Bad Token');
            }
        }

        return false;
    }
}
