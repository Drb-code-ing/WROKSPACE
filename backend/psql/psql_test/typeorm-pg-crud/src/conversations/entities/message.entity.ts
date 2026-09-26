import {
  Entity, // 标记：这个类对应一张表
  Column, // 普通列
  CreateDateColumn, // 创建时间列，插入时自动填 now()，不用手动传
  JoinColumn, // 指定关系外键的物理列名
  ManyToOne, // 多对一：多条对话 → 同一个 user
  PrimaryGeneratedColumn, // 自增主键，等价于 id SERIAL PRIMARY KEY
} from 'typeorm';
import { Conversation } from './conversation.entity';

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ name: 'conversation_id' })
  conversationId: number;
  @Column({ type: 'text', enum: MessageRole })
  role: MessageRole;
  @Column({ type: 'text' })
  content: string;
  @Column('vector', { length: 1024, nullable: true })
  embedding: number[] | null;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;
}
