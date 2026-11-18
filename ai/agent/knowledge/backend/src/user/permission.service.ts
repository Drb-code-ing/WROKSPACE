import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPermissionEntity } from './entities/user-permission.entity';
import { UserRoleEntity } from './entities/user-role.entity';
import { PermissionEntity } from './entities/permission.entity';
import { RolePermissionEntity } from './entities/role-permission.entity';
import { RoleEntity } from './entities/role.entity';
import { ADMIN_ROLES } from '../common/constants/permissions';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(UserPermissionEntity)
    private readonly userPermissionRepo: Repository<UserPermissionEntity>,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepo: Repository<UserRoleEntity>,
  ) {}

  async getUserPermissionCodes(userId: string) {
    // 直接获取用户权限，user-permission 和 permission 表关联查询
    // 对于某个用户可能单独分配了权限，而不是通过角色分配
    const direct = await this.userPermissionRepo
      .createQueryBuilder('up')
      .innerJoin(PermissionEntity, 'p', 'up.permissionId = p.id')
      .where('up.userId = :userId', { userId })
      .andWhere('p.status = 1')
      .andWhere('p.deleted = false')
      .select('p.permission_code', 'code')
      .getRawMany<{ code: string }>();

    // 基于角色权限 code
    const viaRole = await this.userRoleRepo
      .createQueryBuilder('ur')
      .innerJoin(RolePermissionEntity, 'rp', 'ur.roleId = rp.roleId')
      .innerJoin(PermissionEntity, 'p', 'rp.permissionId = p.id')
      .where('ur.userId = :userId', { userId })
      .andWhere('p.status = 1')
      .andWhere('p.deleted = false')
      // DISTINCT 去重
      // 一个用户可能有多个角色，不同角色可能有相同的权限
      .select('DISTINCT p.permission_code', 'code')
      .getRawMany<{ code: string }>();

    const set = new Set<string>([
      ...direct.map((item) => item.code),
      ...viaRole.map((item) => item.code),
    ]);

    // 检查用户是管理员角色，专门配置特殊权限
    // 获取用户角色编码
    const roleCodes = await this.userRoleRepo
      .createQueryBuilder('ur')
      .innerJoin(RoleEntity, 'r', 'ur.roleId = r.id')
      .where('ur.userId = :userId', { userId })
      .andWhere('r.status = 1')
      .select('r.role_code', 'roleCode')
      .getRawMany<{ roleCode: string }>();
    // some() 方法，只要有一个角色是管理员，就返回 true，否则返回 false
    const isAdmin = roleCodes.some((r) =>
      // 验证是否有一项roleCode在ADMIN_ROLES数组中
      (ADMIN_ROLES as readonly string[]).includes(r.roleCode),
    );

    return [...set];
  }
}
