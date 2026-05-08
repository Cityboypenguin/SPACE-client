import { request } from '../../../lib/graphql';

const ADMIN_TOKEN_KEY = 'space_admin_token';
const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;

export type PostUser = {
  ID: string;
  accountID: string;
  name: string;
};

export type Post = {
  ID: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: PostUser;
};

const POSTS_QUERY = `
  query {
    posts {
      ID
      content
      createdAt
      updatedAt
      user {
        ID
        accountID
        name
      }
    }
  }
`;

const SEARCH_POSTS_QUERY = `
  query SearchPosts($content: String!) {
    searchPosts(content: $content) {
      ID
      content
      createdAt
      updatedAt
      user {
        ID
        accountID
        name
      }
    }
  }
`;

const ADMIN_DELETE_POST_MUTATION = `
  mutation AdminDeletePost($id: ID!) {
    adminDeletePost(id: $id)
  }
`;

export const getPosts = async () => {
  return await request<{ posts: Post[] }>(POSTS_QUERY, undefined, getAdminToken());
};

export const searchPosts = async (content: string) => {
  return await request<{ searchPosts: Post[] }>(SEARCH_POSTS_QUERY, { content }, getAdminToken());
};

export const adminDeletePost = async (id: string) => {
  return await request<{ adminDeletePost: boolean }>(ADMIN_DELETE_POST_MUTATION, { id }, getAdminToken());
};
