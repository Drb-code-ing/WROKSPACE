import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { compare } from 'bcryptjs';
import { UserEntity } from './entities/user.entity';
import { UserRoleEntity } from './entities/user-role.entity';
import { RoleEntity } from './entities/role.entity';
import { PermissionEntity } from './entities/permission.entity';
import { RolePermissionEntity } from './entities/role-permission.entity';
import { UserPermissionEntity } from './entities/user-permission.entity';
import { PermissionService } from './permission.service';

@Injectable()
// 导出 UserService，方便auth 等模块鉴权使用
export class UserService {
  // 注入用户仓库 服务等依赖
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepo: Repository<UserRoleEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity)
    private readonly permissionRepo: Repository<PermissionEntity>,
    @InjectRepository(RolePermissionEntity)
    private readonly rolePermissionRepo: Repository<RolePermissionEntity>,
    @InjectRepository(UserPermissionEntity)
    private readonly userPermissionRepo: Repository<UserPermissionEntity>,
    private readonly permissionService: PermissionService,
  ) {}

  async validateCredentials(username: string, password: string) {
    const user = await this.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    // 校验用户状态 1 正常 0 禁用
    if (user.status !== 1) {
      throw new UnauthorizedException('用户已被禁用');
    }
    if (user.emailVerified === 0) {
      throw new UnauthorizedException('用户邮箱未验证');
    }
    // 校验密码（实体里 password 允许为 null，先兜底避免 compare 收到 null）
    if (!user.password) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    const ok = await compare(password, user.password);
    if (!ok) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    // 获得用户角色编码
    const roles = await this.getRoleCodes(user.id);
    // 获取用户权限编码
    const permissions = await this.permissionService.getUserPermissionCodes(
      user.id,
    );
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
  // 获得用户角色编码
  async getRoleCodes(userId: string): Promise<string[]> {
    const rows = await this.userRoleRepo
      // 复杂查询，手动拼SQL?
      // ur 是user-role 实体类的别名
      .createQueryBuilder('ur')
      // 内联
      .innerJoin(RoleEntity, 'r', 'r.id = ur.role_id')
      // :userId 是占位符，防止SQL注入
      .where('ur.user_id = :userId', { userId })
      // andWhere 附加条件，只查询正常状态的角色
      .andWhere('r.status = 1')
      // 只要角色编码，不要其他字段，roleCode 是角色编码的别名，方便后续使用
      .select('r.role_code', 'roleCode')
      .getRawMany<{ roleCode: string }>();

    return rows.map((item) => item.roleCode);
  }
}
