import type { Post } from '../api/post';

export const countAllReplies = (post: Post): number => {
  if (!post.replies) {
    return 0;
  }
  let count = post.replies.length;
  for (const reply of post.replies) {
    count += countAllReplies(reply);
  }
  return count;
};