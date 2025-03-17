import { RedisStore } from "cache-manager-redis-store";

export interface RedisCache extends RedisStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, data: T, ttl?: { ttl?: number }): Promise<void>;
}

export interface DefaultRequestReponseTypedef<T = any> {
  code: number,
  data: T,
  message: string
}