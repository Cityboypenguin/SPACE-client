import type { Post } from '../api/post';

type PostListCacheData = {
  posts: Post[];
  total: number;
  offset: number;
  scrollY: number;
  cachedAt: number;
  searchQuery?: string;
  searchResults?: Post[];
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

export const removePostFromCache = (postId: string) => {
  if (!cache) return;
  cache = { ...cache, posts: cache.posts.filter(p => p.ID !== postId), total: Math.max(0, cache.total - 1) };
};

export const clearPostListCache = () => { cache = null; };

export const getUserPostListCache = (userId: string): PostListCacheData | null => {
  const data = userPostCaches.get(userId);
  if (!data) return null;
  if (isExpired(data)) { userPostCaches.delete(userId); return null; }
  return data;
};

export const saveUserPostListCache = (userId: string, data: Omit<PostListCacheData, 'cachedAt'>) => {
  userPostCaches.set(userId, { ...data, cachedAt: Date.now() });
};

export const updatePostInUserPostListCache = (userId: string, postId: string, updater: (post: Post) => Post) => {
  const data = userPostCaches.get(userId);
  if (!data) return;
  userPostCaches.set(userId, { ...data, posts: data.posts.map(p => p.ID === postId ? updater(p) : p) });
};

export const removePostFromUserPostListCache = (userId: string, postId: string) => {
  const data = userPostCaches.get(userId);
  if (!data) return;
  userPostCaches.set(userId, { ...data, posts: data.posts.filter(p => p.ID !== postId), total: Math.max(0, data.total - 1) });
};

export const clearAllUserPostListCaches = () => { userPostCaches.clear(); };
