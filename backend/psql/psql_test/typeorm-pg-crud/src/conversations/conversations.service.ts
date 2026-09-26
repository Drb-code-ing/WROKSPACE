import { Injectable, NotFoundException } from '@nestjs/common'; // 注入服务
import { CreateConversationDto } from './dto/create-conversation.dto'; // 创建对话 dto
import { UpdateConversationDto } from './dto/update-conversation.dto'; // 更新对话 dto
// EntityManager 是TypeORM 的统一操作工具对象
import { EntityManager } from 'typeorm';
// 依赖注入 sql -> orm -> psql
import { InjectEntityManager } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectEntityManager()
    private readonly em: EntityManager,
  ) {}

  async findConversationsByUserId(userId: number) {
    const user = await this.em.findOne(User, {
      where: { id: userId },
      relations: { conversations: true }, // 加载对话关联
      order: { conversations: { createdAt: 'DESC' } }, // 按创建时间降序排序
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async searchSimilarMessages(
    conversationId: number,
    query: string,
    limit: number,
  ) {
    return {
      messages: [],
    };
  }

  create(createConversationDto: CreateConversationDto) {
    return 'This action adds a new conversation';
  }

  findAll() {
    return `This action returns all conversations`;
  }

  findOne(id: number) {
    return `This action returns a #${id} conversation`;
  }

  update(id: number, updateConversationDto: UpdateConversationDto) {
    return `This action updates a #${id} conversation`;
  }

  remove(id: number) {
    return `This action removes a #${id} conversation`;
  }
}
