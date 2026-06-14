import { request } from '../../../lib/graphql';
import { getUserToken } from './auth';
import { type Media, type MediaInput, getPresignedMediaUploadUrl, uploadFileToStorage } from './message';

export type { Media, MediaInput };
export { getPresignedMediaUploadUrl, uploadFileToStorage };

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

const POST_FIELDS = `
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
`;

const TOP_LEVEL_POSTS_QUERY = `
  query TopLevelPosts($limit: Int, $offset: Int) {
    topLevelPosts(limit: $limit, offset: $offset) {
      items {
        ${POST_FIELDS}
        replies {
          ID
        }
      }
      total
    }
  }
`;

const GET_POST_BY_ID_QUERY = `
  query GetPostByID($id: ID!) {
    getPostByID(id: $id) {
      ${POST_FIELDS}
      rootPost {
        ${POST_FIELDS}
      }
      replies {
        ${POST_FIELDS}
        replies {
          ${POST_FIELDS}
          replies {
            ${POST_FIELDS}
            replies {
              ${POST_FIELDS}
              replies {
                ID
              }
            }
          }
        }
      }
    }
  }
`;

const GET_POSTS_BY_USER_ID_QUERY = `
  query GetPostsByUserID($user_id: ID!, $limit: Int, $offset: Int) {
    getPostsByUserID(user_id: $user_id, limit: $limit, offset: $offset) {
      items {
        ${POST_FIELDS}
        replies {
          ID
        }
      }
      total
    }
  }
`;

const CREATE_POST_MUTATION = `
  mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
      ${POST_FIELDS}
      replies {
      ID
    }
  }
}
`;

const UPDATE_POST_MUTATION = `
  mutation UpdatePost($input: UpdatePostInput!) {
  updatePost(input: $input) {
      ${POST_FIELDS}
      replies {
      ID
    }
  }
}
`;

const DELETE_POST_MUTATION = `
  mutation DeletePost($id: ID!) {
  deletePost(id: $id)
}
`;

const CREATE_FAVORITE_MUTATION = `
  mutation CreateFavorite($input: CreateFavoriteInput!) {
  createFavorite(input: $input) {
    ID
      user {
      ID
    }
  }
}
`;

const DELETE_FAVORITE_MUTATION = `
  mutation DeleteFavorite($input: DeleteFavoriteInput!) {
  deleteFavorite(input: $input)
}
`;

export type PostPage = {
  items: Post[];
  total: number;
};

export const getTopLevelPosts = async (limit = 20, offset = 0): Promise<PostPage> => {
  const data = await request<{ topLevelPosts: PostPage }>(
    TOP_LEVEL_POSTS_QUERY,
    { limit, offset },
    getUserToken(),
  );
  return data.topLevelPosts;
};

export const getPostByID = async (id: string): Promise<Post | null> => {
  const data = await request<{ getPostByID: Post | null }>(
    GET_POST_BY_ID_QUERY,
    { id },
    getUserToken(),
  );
  return data.getPostByID;
};

export const createPost = async (content: string, parentId?: string, mediaInputs?: MediaInput[]): Promise<Post> => {
  const data = await request<{ createPost: Post }>(
    CREATE_POST_MUTATION,
    {
      input: {
        content,
        ...(parentId ? { parent_id: parentId } : {}),
        ...(mediaInputs && mediaInputs.length > 0 ? { mediaInputs } : {}),
      },
    },
    getUserToken(),
  );
  return data.createPost;
};

export const updatePost = async (
  id: string,
  content: string,
  newMediaInputs?: MediaInput[],
  deletedMediaIDs?: string[]
): Promise<Post> => {
  const data = await request<{ updatePost: Post }>(
    UPDATE_POST_MUTATION,
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
  return data.updatePost;
};

export const deletePost = async (id: string): Promise<void> => {
  await request<{ deletePost: boolean }>(
    DELETE_POST_MUTATION,
    { id },
    getUserToken(),
  );
};

export const createFavorite = async (postId: string): Promise<void> => {
  await request<{ createFavorite: PostFavorite }>(
    CREATE_FAVORITE_MUTATION,
    { input: { post_id: postId } },
    getUserToken(),
  );
};

export const getPostsByUserID = async (userId: string, limit = 20, offset = 0): Promise<{ items: Post[]; total: number }> => {
  const data = await request<{ getPostsByUserID: { items: Post[]; total: number } }>(
    GET_POSTS_BY_USER_ID_QUERY,
    { user_id: userId, limit, offset },
    getUserToken(),
  );
  return data.getPostsByUserID;
};

export const deleteFavorite = async (postId: string): Promise<void> => {
  await request<{ deleteFavorite: boolean }>(
    DELETE_FAVORITE_MUTATION,
    { input: { post_id: postId } },
    getUserToken(),
  );
};

const NEW_FEED_POSTS_COUNT_QUERY = `
  query NewFeedPostsCount($since: String!) {
    newFeedPostsCount(since: $since)
  }
`;

export const getNewFeedPostsCount = async (since: Date): Promise<number> => {
  const data = await request<{ newFeedPostsCount: number }>(
    NEW_FEED_POSTS_COUNT_QUERY,
    { since: since.toISOString() },
    getUserToken(),
  );
  return data.newFeedPostsCount;
};

const SEARCH_POSTS_QUERY = `
  query SearchPosts($keyword: String!) {
    searchPosts(keyword: $keyword) {
      ${POST_FIELDS}
      replies {
        ID
      }
    }
  }
`;

export const searchPosts = async (keyword: string): Promise<Post[]> => {
  const data = await request<{ searchPosts: Post[] }>(
    SEARCH_POSTS_QUERY,
    { keyword },
    getUserToken(),
  );
  return data.searchPosts;
};

const FOLLOWERS_TOP_LEVEL_POSTS_QUERY = `
  query FollowersTopLevelPosts($userID: ID!, $limit: Int, $offset: Int) {
    followersTopLevelPosts(userID: $userID, limit: $limit, offset: $offset) {
      items {
        ${POST_FIELDS}
        replies {
          ID
        }
      }
      total
    }
  }
`;

export const getFollowersTopLevelPosts = async (userID: string, limit = 20, offset = 0): Promise<PostPage> => {
  const data = await request<{ followersTopLevelPosts: PostPage }>(
    FOLLOWERS_TOP_LEVEL_POSTS_QUERY,
    { userID, limit, offset },
    getUserToken(),
  );
  return data.followersTopLevelPosts;
};