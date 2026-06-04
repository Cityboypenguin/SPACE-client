import { request } from '../../../lib/graphql';
import { getUserToken } from './auth';

export type Announcement = {
  ID: string;
  title: string;
  body: string;
  createdAt: string;
};

const LIST_ANNOUNCEMENTS_QUERY = `
  query ListAnnouncements($limit: Int) {
    announcements(limit: $limit) {
      ID
      title
      body
      createdAt
    }
  }
`;

const GET_ANNOUNCEMENT_QUERY = `
  query GetAnnouncement($id: ID!) {
    announcement(id: $id) {
      ID
      title
      body
      createdAt
    }
  }
`;

export const listAnnouncements = async (limit = 50): Promise<Announcement[]> => {
  const data = await request<{ announcements: Announcement[] }>(
    LIST_ANNOUNCEMENTS_QUERY,
    { limit },
    getUserToken(),
  );
  return data.announcements;
};

export const getAnnouncement = async (id: string): Promise<Announcement> => {
  const data = await request<{ announcement: Announcement }>(
    GET_ANNOUNCEMENT_QUERY,
    { id },
    getUserToken(),
  );
  return data.announcement;
};
