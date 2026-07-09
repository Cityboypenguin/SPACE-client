import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import { getUserToken } from './auth';
import { type Media, type MediaInput } from './message';

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
  replies: Post[];
  media: Media[];
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
      ID
      url
      contentType
    }
  }
`);

const TopLevelPostsDocument = graphql(`
  query TopLevelPosts($limit: Int, $offset: Int) {
    topLevelPosts(limit: $limit, offset: $offset) {
      items {
        ...PostFields
        replies {
          ID
        }
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
      replies {
        ...PostFields
        replies {
          ...PostFields
          replies {
            ...PostFields
            replies {
              ...PostFields
              replies {
                ID
              }
            }
          }
        }
      }
    }
  }
`);

const GetPostsByUserIDDocument = graphql(`
  query GetPostsByUserID($user_id: ID!, $limit: Int, $offset: Int) {
    getPostsByUserID(user_id: $user_id, limit: $limit, offset: $offset) {
      items {
        ...PostFields
        replies {
          ID
        }
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
        replies {
          ID
        }
      }
      total
    }
  }
`);

const CreatePostDocument = graphql(`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      ...PostFields
      replies {
        ID
      }
    }
  }
`);

const UpdatePostDocument = graphql(`
  mutation UpdatePost($input: UpdatePostInput!) {
    updatePost(input: $input) {
      ...PostFields
      replies {
        ID
      }
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

const SearchPostsDocument = graphql(`
  query SearchPosts($keyword: String!) {
    searchPosts(keyword: $keyword) {
      ...PostFields
      replies {
        ID
      }
    }
  }
`);

export const searchPosts = async (keyword: string): Promise<Post[]> => {
  const data = await requestDoc(SearchPostsDocument, { keyword }, getUserToken());
  return data.searchPosts as Post[];
};

const SearchPostsByHashtagDocument = graphql(`
  query SearchPostsByHashtag($tag: String!) {
    searchPostsByHashtag(tag: $tag) {
      ...PostFields
      replies {
        ID
      }
    }
  }
`);

export const searchPostsByHashtag = async (tag: string): Promise<Post[]> => {
  const data = await requestDoc(SearchPostsByHashtagDocument, { tag }, getUserToken());
  return data.searchPostsByHashtag as Post[];
};

const FollowersTopLevelPostsDocument = graphql(`
  query FollowersTopLevelPosts($userID: ID!, $limit: Int, $offset: Int) {
    followersTopLevelPosts(userID: $userID, limit: $limit, offset: $offset) {
      items {
        ...PostFields
        replies {
          ID
        }
      }
      total
    }
  }
`);

export const getFollowersTopLevelPosts = async (userID: string, limit = 20, offset = 0): Promise<PostPage> => {
  const data = await requestDoc(FollowersTopLevelPostsDocument, { userID, limit, offset }, getUserToken());
  return data.followersTopLevelPosts as PostPage;
};
