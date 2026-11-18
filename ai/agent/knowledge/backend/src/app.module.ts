import { Module, ValidationPipe } from '@nestjs/common';
// 全局 DTO 校验：通过 APP_PIPE 注册，等效于 app.useGlobalPipes()
import { APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserEntity } from './user/entities/user.entity';
import { UserModule } from './user/user.module';
import { UserRoleEntity } from './user/entities/user-role.entity';
import { RoleEntity } from './user/entities/role.entity';
import { PermissionEntity } from './user/entities/permission.entity';
import { RolePermissionEntity } from './user/entities/role-permission.entity';
import { UserPermissionEntity } from './user/entities/user-permission.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // 全局配置模块
    TypeOrmModule.forRootAsync({
      inject: [ConfigService], // 从配置服务中获取数据库配置
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('POSTGRES_HOST', 'localhost'),
        port: config.get<number>('POSTGRES_PORT', 5432),
        username: config.get<string>('POSTGRES_USER', 'user'),
        password: config.get<string>('POSTGRES_PASSWORD', '123456'),
        database: config.get<string>('POSTGRES_DB', 'knowledge_hub'),
        // 实体类数组，用于自动加载实体类
        entities: [
          UserEntity,
          UserRoleEntity,
          RoleEntity,
          PermissionEntity,
          RolePermissionEntity,
          UserPermissionEntity,
        ],
        // 是否自动同步数据库表结构
        synchronize: false,
        // 是否开启日志记录
        logging: true,
      }),
    }),
    AuthModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 全局 DTO 校验：通过 APP_PIPE 注册，等效于 app.useGlobalPipes()
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true, // 按 DTO 类型自动转换（如字符串转数字）
        whitelist: true, // 剔除 DTO 中未声明的字段
        forbidNonWhitelisted: true, // 出现多余字段直接报 400
        transformOptions: { enableImplicitConversion: true },
      }),
    },
  ],
})
export class AppModule {}
