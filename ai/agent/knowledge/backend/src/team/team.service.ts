import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TeamEntity } from './entities/team.entity';
import { TeamMemberEntity } from './entities/team-member.entity';

@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(TeamEntity)
    private readonly teamRepo: Repository<TeamEntity>,
    @InjectRepository(TeamMemberEntity)
    private readonly teamMemberRepo: Repository<TeamMemberEntity>,
  ) {}

  // 获得用户可访问的团队ID列表
  async listAccessibleTeamIds(userId: string): Promise<string[]> {
    const [memberRows, ledRows] = await Promise.all([
      // 查出用户在`kh_team_member` 表里加入的所有团队 ID 列表
      this.teamMemberRepo
        .createQueryBuilder('tm')
        .select('tm.team_id', 'teamId')
        .where('tm.user_id = :userId', { userId })
        .getRawMany<{ teamId: string | number }>(),
      // 查出用户作为负责人（`leader_id = userId` ）且未被删除的团队 ID 列表
      // 因为用户可以作为leader，可能不是团队的成员
      this.teamRepo.find({
        where: { leaderId: userId, deleted: false },
        select: ['id'],
      }),
    ]);
    // 去重
    const ids = [
      ...new Set([
        ...memberRows.map((item) => item.teamId),
        ...ledRows.map((item) => item.id),
      ]),
    ];
    if (ids.length === 0) return [];
    // 筛选出未被删除（解散）的团队列表
    // 因为member 只能查出加入的团队，不能确保团队是否已经解散
    const teams = await this.teamRepo.find({
      where: { id: In(ids), deleted: false },
      select: ['id', 'teamName'],
    });

    return teams.map((item) => String(item.id));
  }
}
