import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

// accessToken 解析出来的载荷
export interface AccessTokenPayload {
  sub: string;
  username: string;
  type: 'access' | 'refresh';
}

// 认证过的请求：挂上 user
export type AuthedRequest = Request & { user?: AccessTokenPayload };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // @Public() 标记的接口直接放行（登录、刷新、健康检查）
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthedRequest>();
    // 只接受 Authorization: Bearer <token>
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) {
      throw new UnauthorizedException('未登录');
    }

    let payload: AccessTokenPayload;
    try {
      // 验签 + 过期校验，失败统一 401
      payload = this.jwtService.verify<AccessTokenPayload>(token);
    } catch {
      throw new UnauthorizedException('登录状态已失效');
    }

    // 防止 refreshToken 被当成 accessToken 调用业务接口
    if (payload.type !== 'access') {
      throw new UnauthorizedException('令牌类型错误');
    }

    request.user = payload;
    return true;
  }
}
