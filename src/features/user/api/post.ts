import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import { getUserToken } from './auth';
import { type Media, type MediaInput } from '../../../lib/media';
import { type Mention } from '../../../lib/mentions';

export type { Media, MediaInput };

export type PostUser = {
  ID: string;
  name: string;
  accountID: string;
  avatarUrl?: string | null;
};

export type PostFavorite = {
  ID: string;
  user: {
    ID: string;
  };
};

export type Post = {
  ID: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  replyCount: number;
  rootPost: Post | null;
  user: PostUser;
  favorites: PostFavorite[];
  parent?: Post | null;
  replies?: Post[];
  media: Media[];
  // 本文中のメンション。表示側は text を本文と突き合わせて着色・リンク化する。
  mentions: Mention[];
};

// PostFields は投稿ツリー(返信の再帰的な入れ子)全体で繰り返し使われる共通フィールド選択。
// GraphQL フラグメントとして定義し、各クエリから ...PostFields で参照する。
// export しているのは JS 上の未使用変数警告を避けるためだけではなく、
// codegen がこのフラグメント定義をドキュメント集合として認識するために必要。
export const PostFieldsFragment = graphql(`
  fragment PostFields on Post {
    ID
    content
    createdAt
    replyCount
    deletedAt
    user {
      ID
      name
      accountID
      avatarUrl
    }
    favorites {
      ID
      user {
        ID
      }
    }
    media {
      ...MediaFields
    }
    mentions {
      user {
        ID
        name
        accountID
        avatarUrl
      }
      text
    }
  }
`);

const TopLevelPostsDocument = graphql(`
  query TopLevelPosts($limit: Int, $offset: Int) {
    topLevelPosts(limit: $limit, offset: $offset) {
      items {
        ...PostFields
      }
      total
    }
  }
`);

const GetPostByIDDocument = graphql(`
  query GetPostByID($id: ID!) {
    getPostByID(id: $id) {
      ...PostFields
      rootPost {
        ...PostFields
      }
      replies(limit: 50) {
        ...PostFields
      }
    }
  }
`);

const GetPostRepliesDocument = graphql(`
  query GetPostReplies($id: ID!, $limit: Int!, $offset: Int!) {
    getPostByID(id: $id) {
      replies(limit: $limit, offset: $offset) {
        ...PostFields
      }
    }
  }
`);

const GetPostsByUserIDDocument = graphql(`
  query GetPostsByUserID($user_id: ID!, $limit: Int, $offset: Int) {
    getPostsByUserID(user_id: $user_id, limit: $limit, offset: $offset) {
      items {
        ...PostFields
      }
      total
    }
  }
`);

const GetFavoritePostsByUserIDDocument = graphql(`
  query GetFavoritePostsByUserID($user_id: ID!, $limit: Int, $offset: Int) {
    getFavoritePostsByUserID(user_id: $user_id, limit: $limit, offset: $offset) {
      items {
        ...PostFields
      }
      total
    }
  }
`);

const CreatePostDocument = graphql(`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      ...PostFields
    }
  }
`);

const UpdatePostDocument = graphql(`
  mutation UpdatePost($input: UpdatePostInput!) {
    updatePost(input: $input) {
      ...PostFields
    }
  }
`);

const DeletePostDocument = graphql(`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id)
  }
`);

const CreateFavoriteDocument = graphql(`
  mutation CreateFavorite($input: CreateFavoriteInput!) {
    createFavorite(input: $input) {
      ID
      user {
        ID
      }
    }
  }
`);

const DeleteFavoriteDocument = graphql(`
  mutation DeleteFavorite($input: DeleteFavoriteInput!) {
    deleteFavorite(input: $input)
  }
`);

export type PostPage = {
  items: Post[];
  total: number;
};

export const getTopLevelPosts = async (limit = 20, offset = 0): Promise<PostPage> => {
  const data = await requestDoc(TopLevelPostsDocument, { limit, offset }, getUserToken());
  return data.topLevelPosts as PostPage;
};

export const getPostByID = async (id: string): Promise<Post | null> => {
  const data = await requestDoc(GetPostByIDDocument, { id }, getUserToken());
  return (data.getPostByID as Post | null) ?? null;
};

export const getPostReplies = async (id: string, limit = 50, offset = 0): Promise<Post[]> => {
  const data = await requestDoc(GetPostRepliesDocument, { id, limit, offset }, getUserToken());
  return (data.getPostByID?.replies as Post[] | undefined) ?? [];
};

export const createPost = async (content: string, parentId?: string, mediaInputs?: MediaInput[]): Promise<Post> => {
  const data = await requestDoc(
    CreatePostDocument,
    {
      input: {
        content,
        ...(parentId ? { parent_id: parentId } : {}),
        ...(mediaInputs && mediaInputs.length > 0 ? { mediaInputs } : {}),
      },
    },
    getUserToken(),
  );
  return data.createPost as Post;
};

export const updatePost = async (
  id: string,
  content: string,
  newMediaInputs?: MediaInput[],
  deletedMediaIDs?: string[]
): Promise<Post> => {
  const data = await requestDoc(
    UpdatePostDocument,
    {
      input: {
        id,
        content,
        ...(newMediaInputs && newMediaInputs.length > 0 ? { newMediaInputs } : {}),
        ...(deletedMediaIDs && deletedMediaIDs.length > 0 ? { deletedMediaIDs } : {}),
      },
    },
    getUserToken(),
  );
  return data.updatePost as Post;
};

export const deletePost = async (id: string): Promise<void> => {
  await requestDoc(DeletePostDocument, { id }, getUserToken());
};

export const createFavorite = async (postId: string): Promise<void> => {
  await requestDoc(CreateFavoriteDocument, { input: { post_id: postId } }, getUserToken());
};

export const getPostsByUserID = async (userId: string, limit = 20, offset = 0): Promise<{ items: Post[]; total: number }> => {
  const data = await requestDoc(GetPostsByUserIDDocument, { user_id: userId, limit, offset }, getUserToken());
  return data.getPostsByUserID as { items: Post[]; total: number };
};

export const getFavoritePostsByUserID = async (userId: string, limit = 20, offset = 0): Promise<{ items: Post[]; total: number }> => {
  const data = await requestDoc(GetFavoritePostsByUserIDDocument, { user_id: userId, limit, offset }, getUserToken());
  return data.getFavoritePostsByUserID as { items: Post[]; total: number };
};

export const deleteFavorite = async (postId: string): Promise<void> => {
  await requestDoc(DeleteFavoriteDocument, { input: { post_id: postId } }, getUserToken());
};

const NewFeedPostsCountDocument = graphql(`
  query NewFeedPostsCount($since: String!) {
    newFeedPostsCount(since: $since)
  }
`);

export const getNewFeedPostsCount = async (since: Date): Promise<number> => {
  const data = await requestDoc(NewFeedPostsCountDocument, { since: since.toISOString() }, getUserToken());
  return data.newFeedPostsCount;
};

// 投稿検索はサーバー側でページングする。以前は引数が無く、条件に当たった投稿が
// 全件返ってきたのを画面側が slice して出していた（＝ヒットが増えるほど、見えない
// ぶんまで毎回転送していた）。
//
// searchPosts は PostPage ではなく [Post!]! を返すので total が無い。「次がまだ
// あるか」は「返ってきた件数が limit と同じか」で判断すること（SEARCH_PAGE_SIZE
// 未満なら最後のページ）。
const SearchPostsDocument = graphql(`
  query SearchPosts($keyword: String!, $limit: Int!, $offset: Int!) {
    searchPosts(keyword: $keyword, limit: $limit, offset: $offset) {
      ...PostFields
    }
  }
`);

export const searchPosts = async (keyword: string, limit: number, offset: number): Promise<Post[]> => {
  const data = await requestDoc(SearchPostsDocument, { keyword, limit, offset }, getUserToken());
  return data.searchPosts as Post[];
};

const SearchPostsByHashtagDocument = graphql(`
  query SearchPostsByHashtag($tag: String!, $limit: Int!, $offset: Int!) {
    searchPostsByHashtag(tag: $tag, limit: $limit, offset: $offset) {
      ...PostFields
    }
  }
`);

export const searchPostsByHashtag = async (tag: string, limit: number, offset: number): Promise<Post[]> => {
  const data = await requestDoc(SearchPostsByHashtagDocument, { tag, limit, offset }, getUserToken());
  return data.searchPostsByHashtag as Post[];
};

export type HashtagSuggestion = {
  tag: string;
  count: number;
};

const PopularHashtagsDocument = graphql(`
  query PopularHashtags {
    popularHashtags {
      items {
        tag
        count
      }
      total
    }
  }
`);

// 先読み（人気タグ一括取得）。items は人気上位・最大500件、total はタグ種類数。
// complete = total <= items.length のとき全タグを取得できている（サーバー補完が不要）。
export const getPopularHashtags = async (): Promise<{ items: HashtagSuggestion[]; total: number }> => {
  const data = await requestDoc(PopularHashtagsDocument, {}, getUserToken());
  return {
    items: data.popularHashtags.items as HashtagSuggestion[],
    total: data.popularHashtags.total,
  };
};

const SuggestUsersDocument = graphql(`
  query SuggestUsers($prefix: String!, $limit: Int) {
    suggestUsers(prefix: $prefix, limit: $limit) {
      ID
      name
      accountID
      avatarUrl
    }
  }
`);

// メンションのサジェスト候補1件。ハッシュタグの HashtagSuggestion に対応する。
export type UserSuggestion = {
  ID: string;
  name: string;
  accountID: string;
  avatarUrl?: string | null;
};

export const suggestUsers = async (prefix: string, limit = 8): Promise<UserSuggestion[]> => {
  const data = await requestDoc(SuggestUsersDocument, { prefix, limit }, getUserToken());
  return data.suggestUsers as UserSuggestion[];
};

const SuggestHashtagsDocument = graphql(`
  query SuggestHashtags($prefix: String!, $limit: Int) {
    suggestHashtags(prefix: $prefix, limit: $limit) {
      tag
      count
    }
  }
`);

// プレフィックス前方一致のサジェスト（先読みで足りないときの補完）。
export const suggestHashtags = async (prefix: string, limit = 8): Promise<HashtagSuggestion[]> => {
  const data = await requestDoc(SuggestHashtagsDocument, { prefix, limit }, getUserToken());
  return data.suggestHashtags as HashtagSuggestion[];
};

const FollowersTopLevelPostsDocument = graphql(`
  query FollowersTopLevelPosts($userID: ID!, $limit: Int, $offset: Int) {
    followersTopLevelPosts(userID: $userID, limit: $limit, offset: $offset) {
      items {
        ...PostFields
      }
      total
    }
  }
`);

export const getFollowersTopLevelPosts = async (userID: string, limit = 20, offset = 0): Promise<PostPage> => {
  const data = await requestDoc(FollowersTopLevelPostsDocument, { userID, limit, offset }, getUserToken());
  return data.followersTopLevelPosts as PostPage;
};
