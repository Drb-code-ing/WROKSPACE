import { Injectable } from '@nestjs/common';
import { LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { UserService } from '../user/user.service';
import { AuthUser } from './auth-user.interface';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

// 登录结果
export interface LoginResult {
  accessToken: string; // 访问令牌
  refreshToken: string; // 刷新令牌
  tokenType: 'Bearer'; // 令牌类型
  expiresIn: number; // 过期时间（秒）
  userInfo: AuthUser; // 用户信息
}

// JWT 令牌里载荷的结构、约束类型
interface TokenPayload {
  // 不变的用户ID
  sub: string;
  username: string;
  type: 'access' | 'refresh';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResult> {
    // 验证用户凭证
    const user = await this.userService.validateCredentials(
      dto.username,
      dto.password,
    );
    // 更新用户最后登录时间
    await this.userService.touchLastLogin(user.userId);

    return {
      accessToken: this.signAccessToken(user), // 签发访问令牌 身份 时间短 15 分钟
      refreshToken: this.signRefreshToken(user), // 签发刷新令牌 续期 时间长 7 天
      tokenType: 'Bearer',
      userInfo: user,
      expiresIn: Number(this.accessExpiresSeconds()),
    };
  }

  // 签发accessToken
  private signAccessToken(user: AuthUser): string {
    const payload: TokenPayload = {
      sub: user.userId,
      username: user.username,
      type: 'access',
    };
    return this.jwtService.sign(payload, {
      expiresIn: this.accessExpires() as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });
  }

  // 签发refreshToken
  private signRefreshToken(user: AuthUser): string {
    const payload: TokenPayload = {
      sub: user.userId,
      username: user.username,
      type: 'refresh',
    };
    return this.jwtService.sign(payload, {
      expiresIn: this.refreshExpires() as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });
  }

  private accessExpires(): string {
    return this.config.get<string>('JWT_ACCESS_EXPIRES', '15m');
  }
  private refreshExpires(): string {
    return this.config.get<string>('JWT_REFRESH_EXPIRES', '7d');
  }
  private accessExpiresSeconds(): number {
    const raw = this.accessExpires();
    const match = /^(\d+)([smhd])$/.exec(raw);
    if (!match) return 7200;
    const n = Number(match[1]);
    const unit = match[2];
    if (unit === 's') return n;
    if (unit === 'm') return n * 60;
    if (unit === 'h') return n * 3600;
    return n * 86400;
  }

  // RefreshToken 刷新accessToken
  async refresh(dto: RefreshTokenDto): Promise<LoginResult> {
    let payload: TokenPayload;
    try {
      // 验证RefreshToken，拿到payload 对象
      payload = this.jwtService.verify<TokenPayload>(dto.refreshToken);
    } catch (error) {
      throw new UnauthorizedException('refresh token 无效或已过期');
    }
    // 重新拿到用户信息，包含角色、权限、团队等
    const user = await this.userService.buildAuthUser(payload.sub);
    // 重新签发 accessToken、refreshToken、过期时间等
    return this.buildLoginResult(user);
  }

  private buildLoginResult(user: AuthUser): LoginResult {
    return {
      accessToken: this.signAccessToken(user),
      refreshToken: this.signRefreshToken(user),
      tokenType: 'Bearer',
      userInfo: user,
      expiresIn: Number(this.accessExpiresSeconds()),
    };
  }
}
