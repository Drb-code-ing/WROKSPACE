import { Injectable } from '@nestjs/common';
import { UserEntity } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
// 导出 UserService，方便auth 等模块鉴权使用
export class UserService {
  // 注入用户仓库
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async validateCredentials(username: string, password: string) {
    const user = await this.findByUsername(username);
    return {
      username,
      password,
    };
  }
  // ts 可以通过函数返回值约束 数据库操作 promise 一行用户记录
  async findByUsername(username: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({
      where: { username, deleted: false },
    });
  }
}
