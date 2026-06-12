import { request } from '../../../lib/graphql';
import { getUserToken } from './auth';

export type Announcement = {
  ID: string;
  title: string;
  body: string;
  createdAt: string;
};

export type AnnouncementPage = { items: Announcement[]; total: number };

const LIST_ANNOUNCEMENTS_QUERY = `
  query ListAnnouncements($limit: Int, $offset: Int) {
    announcements(limit: $limit, offset: $offset) {
      items {
        ID
        title
        body
        createdAt
      }
      total
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

export const listAnnouncements = async (limit = 20, offset = 0): Promise<AnnouncementPage> => {
  const data = await request<{ announcements: AnnouncementPage }>(
    LIST_ANNOUNCEMENTS_QUERY,
    { limit, offset },
    getUserToken(),
  );
  return data.announcements ?? { items: [], total: 0 };
};

export const getAnnouncement = async (id: string): Promise<Announcement> => {
  const data = await request<{ announcement: Announcement }>(
    GET_ANNOUNCEMENT_QUERY,
    { id },
    getUserToken(),
  );
  return data.announcement;
};
