import { request } from '../../../lib/graphql';
import { USER_TOKEN_KEY } from './auth';
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
  user: PostUser;
  favorites: PostFavorite[];
  parent?: Post | null;
  replies: Post[];
  media: Media[];
};

const getUserToken = () => localStorage.getItem(USER_TOKEN_KEY) ?? undefined;

const POST_FIELDS = `
  ID
  content
  createdAt
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
  query TopLevelPosts {
    topLevelPosts {
      ${POST_FIELDS}
      replies {
        ID
      }
    }
  }
`;

const GET_POST_BY_ID_QUERY = `
  query GetPostByID($id: ID!) {
    getPostByID(id: $id) {
      ${POST_FIELDS}
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

export const getTopLevelPosts = async (): Promise<Post[]> => {
  const data = await request<{ topLevelPosts: Post[] }>(
    TOP_LEVEL_POSTS_QUERY,
    undefined,
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

export const createFavorite = async (postId: string): Promise<void> => {
  await request<{ createFavorite: PostFavorite }>(
    CREATE_FAVORITE_MUTATION,
    { input: { post_id: postId } },
    getUserToken(),
  );
};

export const deleteFavorite = async (postId: string): Promise<void> => {
  await request<{ deleteFavorite: boolean }>(
    DELETE_FAVORITE_MUTATION,
    { input: { post_id: postId } },
    getUserToken(),
  );
};
