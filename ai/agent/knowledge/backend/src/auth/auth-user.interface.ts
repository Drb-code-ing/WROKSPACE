// 接口文件 定义用户认证信息
// 多处需要用到
// 独立出来 方便维护
export interface AuthUser {
  userId: string;
  username: string;
  realName?: string | null;
  email?: string | null;
  avatar?: string | null;
  roles: string[];
  permissions: string[];
  teamIds: string[];
}
