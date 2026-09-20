import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import { type Media as SharedMedia } from '../../../lib/media';
import { ADMIN_TOKEN_KEY } from '../../../lib/authStorage';

const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;

export type PostUser = {
  ID: string;
  name: string;
  accountID: string;
  avatarUrl?: string | null;
};

// 管理画面では作成日時も表示するため、共有の Media に足して使う。
export type Media = SharedMedia & {
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
  // 件数と「自分がいいねしたか」だけ（理由は user 側の Post と同じ）。
  favoriteCount: number;
  isFavoritedByMe: boolean;
  rootPost?: Post | null;
  parent?: Post | null;
  replies?: Post[];
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
    favoriteCount
    isFavoritedByMe
    media {
      ...MediaFields
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
      replies(limit: 50) {
        ...AdminPostFields
      }
    }
  }
`);

const GetAdminPostRepliesDocument = graphql(`
  query GetAdminPostReplies($id: ID!, $limit: Int!, $offset: Int!) {
    getPostByIDIncludeDeleted(id: $id) {
      replies(limit: $limit, offset: $offset) {
        ...AdminPostFields
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

export const getPostReplies = async (id: string, limit = 50, offset = 0): Promise<Post[]> => {
  const data = await requestDoc(GetAdminPostRepliesDocument, { id, limit, offset }, getAdminToken());
  return (data.getPostByIDIncludeDeleted?.replies as Post[] | undefined) ?? [];
};

export const adminDeletePost = async (id: string): Promise<void> => {
  await requestDoc(AdminDeletePostDocument, { id }, getAdminToken());
};
