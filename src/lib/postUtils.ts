type PostWithReplies = {
  replies: PostWithReplies[];
};

export const countAllReplies = (post: PostWithReplies): number => {
  if (!post.replies) return 0;
  let count = post.replies.length;
  for (const reply of post.replies) {
    count += countAllReplies(reply);
  }
  return count;
};
