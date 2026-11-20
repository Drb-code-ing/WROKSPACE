import { SetMetadata } from '@nestjs/common';

// 标记不需要登录即可访问的接口（登录、刷新、健康检查等）
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
