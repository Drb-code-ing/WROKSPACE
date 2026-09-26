// 实体（Entity）= 数据库表 conversations 的代码化身
// 相当于你之前手敲的 CREATE TABLE conversations (...)，只是换成了类 + 装饰器
import {
  Entity, // 标记：这个类对应一张表
  Column, // 普通列
  CreateDateColumn, // 创建时间列，插入时自动填 now()，不用手动传
  JoinColumn, // 指定关系外键的物理列名
  ManyToOne, // 多对一：多条对话 → 同一个 user
  OneToMany, // 一对多：一个 user → 多条对话（用在 user.entity 的反向字段上）
  PrimaryGeneratedColumn, // 自增主键，等价于 id SERIAL PRIMARY KEY
} from 'typeorm';
import { User } from './user.entity';
import { Message } from './message.entity';

@Entity('conversations') // 对应表名 conversations
export class Conversation {
  // id SERIAL PRIMARY KEY：自增主键（序列只进不退）
  @PrimaryGeneratedColumn()
  id: number;

  // TS 属性 userId ↔ 物理列 user_id：name 负责"驼峰 → 下划线"的映射
  @Column({ name: 'user_id' })
  userId: number;

  // title TEXT 可空：TS 类型 string | null，数据库里存 NULL
  @Column({ type: 'text', nullable: true })
  title: string | null;

  // created_at TIMESTAMPTZ DEFAULT now()：插入时自动填
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // 多对一关系：本表的 user_id 指向 users.id
  // 第二个参数指向 User 实体里的反向字段（user.conversations），两边要互相指名
  // onDelete: 'CASCADE' = 删除用户时，把他的所有对话一起删掉
  @ManyToOne(() => User, (user) => user.conversations, { onDelete: 'CASCADE' })
  // 这条关系的外键落库时叫 user_id 列
  @JoinColumn({ name: 'user_id' })
  user: User;

  // 一对多关系：本表的 id 指向 messages.conversation_id
  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];
}
