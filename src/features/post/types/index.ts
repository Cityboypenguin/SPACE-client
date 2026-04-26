import type { User } from "../../user/api/auth";

export type Post = {
  ID: String;
  content: String;
  createdAt: String;
  updatedAt: String;
  user: User;
  favorites: Favorite[];
  parent?: Post;
  replies: Post[];
}

type Favorite = {
  ID: String;
  user: User;
  post: Post;
}