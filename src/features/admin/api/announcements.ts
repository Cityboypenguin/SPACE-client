import { request } from '../../../lib/graphql';

const ADMIN_TOKEN_KEY = 'space_admin_token';
const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;

export type Announcement = {
  ID: string;
  title: string;
  body: string;
  createdAt: string;
};

const ANNOUNCEMENTS_QUERY = `
  query Announcements($limit: Int) {
    announcements(limit: $limit) {
      ID
      title
      body
      createdAt
    }
  }
`;

const CREATE_ANNOUNCEMENT_MUTATION = `
  mutation CreateAnnouncement($input: CreateAnnouncementInput!) {
    createAnnouncement(input: $input) {
      ID
      title
      body
      createdAt
    }
  }
`;

export const getAnnouncements = async (limit = 50): Promise<Announcement[]> => {
  const data = await request<{ announcements: Announcement[] }>(
    ANNOUNCEMENTS_QUERY,
    { limit },
    getAdminToken(),
  );
  return data.announcements ?? [];
};

export const createAnnouncement = async (title: string, body: string): Promise<Announcement> => {
  const data = await request<{ createAnnouncement: Announcement }>(
    CREATE_ANNOUNCEMENT_MUTATION,
    { input: { title, body } },
    getAdminToken(),
  );
  return data.createAnnouncement;
};
