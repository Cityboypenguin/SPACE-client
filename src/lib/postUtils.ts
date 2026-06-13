type PostWithReplies = {
  replies: PostWithReplies[];
};

export const countAllReplies = (post: PostWithReplies): number => {
  let count = post.replies.length;
  for (const reply of post.replies) {
    count += countAllReplies(reply);
  }
  return count;
};
