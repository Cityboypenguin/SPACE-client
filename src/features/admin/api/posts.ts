import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
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

export const AdminPostFieldsFragment = graphql(`
  fragment AdminPostFields on Post {
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
  }
`);

export type PostPage = { items: Post[]; total: number };

const GetAdminPostsDocument = graphql(`
  query GetAdminPosts($limit: Int, $offset: Int) {
    posts(limit: $limit, offset: $offset) {
      items {
        ...AdminPostFields
        replies {
          ID
        }
      }
      total
    }
  }
`);

const GetPostByIDIncludeDeletedDocument = graphql(`
  query GetPostByIDIncludeDeleted($id: ID!) {
    getPostByIDIncludeDeleted(id: $id) {
      ...AdminPostFields
      rootPost {
        ...AdminPostFields
      }
      replies {
        ...AdminPostFields
        replies {
          ...AdminPostFields
          replies {
            ...AdminPostFields
            replies {
              ...AdminPostFields
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

const AdminDeletePostDocument = graphql(`
  mutation AdminDeletePost($id: ID!) {
    adminDeletePost(id: $id)
  }
`);

export const getPosts = async (limit = 20, offset = 0): Promise<PostPage> => {
  const data = await requestDoc(GetAdminPostsDocument, { limit, offset }, getAdminToken());
  return data.posts as PostPage;
};

export const getPostByID = async (id: string): Promise<Post | null> => {
  const data = await requestDoc(GetPostByIDIncludeDeletedDocument, { id }, getAdminToken());
  return (data.getPostByIDIncludeDeleted as Post | null) ?? null;
};

export const adminDeletePost = async (id: string): Promise<void> => {
  await requestDoc(AdminDeletePostDocument, { id }, getAdminToken());
};
