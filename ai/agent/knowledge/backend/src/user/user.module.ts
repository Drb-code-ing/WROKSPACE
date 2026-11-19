import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { RoleEntity } from './entities/role.entity';
import { UserRoleEntity } from './entities/user-role.entity';
import { RolePermissionEntity } from './entities/role-permission.entity';
import { UserPermissionEntity } from './entities/user-permission.entity';
import { PermissionEntity } from './entities/permission.entity';
import { PermissionService } from './permission.service';
import { TeamModule } from '../team/team.module';
// 因为已经导入了整个团队模块，所以这里不需要再重复导入团队服务了
// import { TeamService } from '../team/team.service';

@Module({
  imports: [
    // 导入团队模块，提供团队服务
    TeamModule,
    // 注册实体类，提供Repository 实例
    TypeOrmModule.forFeature([
      UserEntity,
      UserRoleEntity,
      RoleEntity,
      RolePermissionEntity,
      UserPermissionEntity,
      PermissionEntity,
    ]),
  ],
  controllers: [UserController],
  // 当前模块中使用的服务类
  providers: [UserService, PermissionService],
  exports: [UserService], // 导出 UserService，方便在其他模块中使用
})
export class UserModule {}
