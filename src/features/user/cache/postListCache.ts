import type { Post } from '../api/post';

type PostListCacheData = {
  posts: Post[];
  total: number;
  offset: number;
  scrollY: number;
  cachedAt: number;
};

const CACHE_TTL_MS = 15 * 60 * 1000;

let cache: PostListCacheData | null = null;
const userPostCaches = new Map<string, PostListCacheData>();

const isExpired = (data: PostListCacheData) => Date.now() - data.cachedAt > CACHE_TTL_MS;

export const getPostListCache = (): PostListCacheData | null => {
  if (!cache) return null;
  if (isExpired(cache)) { cache = null; return null; }
  return cache;
};

export const savePostListCache = (data: Omit<PostListCacheData, 'cachedAt'>) => {
  cache = { ...data, cachedAt: Date.now() };
};

export const updatePostInCache = (postId: string, updater: (post: Post) => Post) => {
  if (!cache) return;
  cache = { ...cache, posts: cache.posts.map(p => p.ID === postId ? updater(p) : p) };
};

export const clearPostListCache = () => { cache = null; };

const getCacheKey = (userId: string, scope: string = '') => scope ? `${userId}_${scope}` : userId;

export const getUserPostListCache = (userId: string, scope: string = ''): PostListCacheData | null => {
  const key = getCacheKey(userId, scope);
  const data = userPostCaches.get(key);
  if (!data) return null;
  if (isExpired(data)) { userPostCaches.delete(key); return null; }
  return data;
};

export const saveUserPostListCache = (
  userId: string, 
  data: Omit<PostListCacheData, 'cachedAt'>,
  scope: string = ''
) => {
  const key = getCacheKey(userId, scope);
  userPostCaches.set(key, { ...data, cachedAt: Date.now() });
};

export const updatePostInUserPostListCache = (userId: string, postId: string, updater: (post: Post) => Post) => {
  // Mapの全キーと値を取得してループ
  for (const [key, data] of userPostCaches.entries()) {
    // ⭕️ 前方一致の確認：キーが "userId" または "userId_xxx" で始まる場合のみ処理
    if (key === userId || key.startsWith(`${userId}_`)) {
      userPostCaches.set(key, { 
        ...data, 
        posts: data.posts.map(p => p.ID === postId ? updater(p) : p) 
      });
    }
  }
};

export const clearAllUserPostListCaches = () => { userPostCaches.clear(); };

