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

export const getPostListCache = (): PostListCacheData | null => {
  if (!cache) return null;
  if (Date.now() - cache.cachedAt > CACHE_TTL_MS) {
    cache = null;
    return null;
  }
  return cache;
};

export const savePostListCache = (data: Omit<PostListCacheData, 'cachedAt'>) => {
  cache = { ...data, cachedAt: Date.now() };
};

export const updatePostInCache = (postId: string, updater: (post: Post) => Post) => {
  if (!cache) return;
  cache = { ...cache, posts: cache.posts.map(p => p.ID === postId ? updater(p) : p) };
};

export const clearPostListCache = () => {
  cache = null;
};
