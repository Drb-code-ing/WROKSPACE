export interface Capsule {
  id: number;
  content: string;
  author: string;
  unlock_time: Date;
  created_at: Date;
}

export interface CapsuleResponse {
  id: number;
  content: string | null;
  author: string;
  unlock_time: string;
  created_at: string;
  is_unlocked: boolean;
}

export interface CreateCapsuleRequest {
  content: string;
  author?: string;
  unlock_time: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  total: number;
}
