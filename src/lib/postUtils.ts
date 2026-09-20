type PostWithReplies = {
  replies?: PostWithReplies[];
};

export const countAllReplies = (post: PostWithReplies): number => {
  if (!post.replies) return 0;
  let count = post.replies.length;
  for (const reply of post.replies) {
    count += countAllReplies(reply);
  }
  return count;
};

type Likeable = {
  favoriteCount: number;
  isFavoritedByMe: boolean;
};

/**
 * いいねの切り替えを、手元の投稿へ即座に反映する（サーバーの応答を待たずに
 * 表示を更新するため）。
 *
 * wasLiked は「押す前にいいね済みだったか」。押した結果は必ずその反転になる。
 *
 * 以前は favorites の配列へ仮の行を足し引きしていた。表示に使うのは件数と
 * 自分の有無だけなので、その2つを直接動かす。5か所に同じ足し引きが写経されて
 * いたので、1か所へ集めてある。
 *
 * 件数が負にならないようにしているのは、手元の件数が古い（他の人のいいねが
 * まだ届いていない）ときに 0 から引くと -1 が表示されてしまうため。
 */
export const withLikeToggled = <T extends Likeable>(post: T, wasLiked: boolean): T => ({
  ...post,
  favoriteCount: Math.max(0, post.favoriteCount + (wasLiked ? -1 : 1)),
  isFavoritedByMe: !wasLiked,
});
