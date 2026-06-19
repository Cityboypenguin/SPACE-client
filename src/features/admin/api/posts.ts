import { request } from '../../../lib/graphql';
import { ADMIN_TOKEN_KEY } from '../../../lib/authStorage';

const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;

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

export type Media = {
  ID: string;
  url: string;
  contentType: string;
  createdAt: string;
};

export type Post = {
  ID: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  replyCount: number;
  user: PostUser;
  favorites: PostFavorite[];
  rootPost?: Post | null;
  parent?: Post | null;
  replies: Post[];
  media: Media[];
};

const POST_FIELDS = `
  ID
  content
  createdAt
  updatedAt
  deletedAt
  replyCount
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
    createdAt
  }
`;

export type PostPage = { items: Post[]; total: number };

const POSTS_QUERY = `
  query GetAdminPosts($limit: Int, $offset: Int) {
    posts(limit: $limit, offset: $offset) {
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
  query GetPostByIDIncludeDeleted($id: ID!) {
    getPostByIDIncludeDeleted(id: $id) {
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

const ADMIN_DELETE_POST_MUTATION = `
  mutation AdminDeletePost($id: ID!) {
    adminDeletePost(id: $id)
  }
`;

export const getPosts = async (limit = 20, offset = 0): Promise<PostPage> => {
  const data = await request<{ posts: PostPage }>(POSTS_QUERY, { limit, offset }, getAdminToken());
  return data.posts;
};

export const getPostByID = async (id: string): Promise<Post | null> => {
  const data = await request<{ getPostByIDIncludeDeleted: Post | null }>(
    GET_POST_BY_ID_QUERY,
    { id },
    getAdminToken(),
  );
  return data.getPostByIDIncludeDeleted;
};

export const adminDeletePost = async (id: string): Promise<void> => {
  await request<{ adminDeletePost: boolean }>(ADMIN_DELETE_POST_MUTATION, { id }, getAdminToken());
};
