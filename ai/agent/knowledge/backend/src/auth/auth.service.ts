import { Injectable } from '@nestjs/common';
import { LoginDto } from './auth.dto';
import { UserService } from '../user/user.service';

// 登录结果
export interface LoginResult {
  accessToken: string; // 访问令牌
  refreshToken: string; // 刷新令牌
  tokenType: 'Bearer'; // 令牌类型
  expiresIn: number; // 过期时间（秒）
}

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async login(dto: LoginDto): Promise<LoginResult> {
    // 验证用户凭证
    const user = await this.userService.validateCredentials(
      dto.username,
      dto.password,
    );
    // 更新用户最后登录时间
    await this.userService.touchLastLogin(user.userId);

    return {
      accessToken: '123456',
      refreshToken: '123456',
      tokenType: 'Bearer',
      expiresIn: 3600, // 1 小时过期
    };
  }
}
