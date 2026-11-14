import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { bigintTransformer } from '../../common/transformers/bigint.transformer';

@Entity('kh_user')
export class UserEntity {
  // js 无法直接处理 bigint 类型，需要使用 transformer 转换成字符串
  // 入库再转回 bigint 类型，避免精度丢失
  @PrimaryColumn({ type: 'bigint', transformer: bigintTransformer })
  id: string;

  @Column({ type: 'varchar', length: 50 })
  username: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', name: 'real_name', length: 500, nullable: true })
  realName?: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar?: string | null;
  // 邮箱是否验证
  // 0: 未验证
  // 1: 已验证
  @Column({ type: 'smallint', name: 'email_verified', default: 0 })
  emailVerified: number;
  // 用户状态
  // 0: 禁用
  // 1: 正常
  @Column({ type: 'smallint', default: 1 })
  status: number;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt?: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'boolean', default: false })
  deleted: boolean;
}
