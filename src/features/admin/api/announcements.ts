import { request } from '../../../lib/graphql';

const ADMIN_TOKEN_KEY = 'space_admin_token';
const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;

export type Announcement = {
  ID: string;
  title: string;
  body: string;
  createdAt: string;
};

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

export type AnnouncementPage = { items: Announcement[]; total: number };

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

const ADMIN_ANNOUNCEMENTS_QUERY = `
  query AdminListAnnouncements($limit: Int, $offset: Int) {
    adminListAnnouncements(limit: $limit, offset: $offset) {
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

export const getAnnouncement = async (id: string): Promise<Announcement> => {
  const data = await request<{ announcement: Announcement }>(
    GET_ANNOUNCEMENT_QUERY,
    { id },
    getAdminToken(),
  );
  return data.announcement;
};

export const getAnnouncements = async (limit = 50): Promise<Announcement[]> => {
  const data = await request<{ announcements: Announcement[] }>(
    ANNOUNCEMENTS_QUERY,
    { limit },
    getAdminToken(),
  );
  return data.announcements ?? [];
};

export const getAdminAnnouncements = async (limit = 20, offset = 0): Promise<AnnouncementPage> => {
  const data = await request<{ adminListAnnouncements: AnnouncementPage }>(
    ADMIN_ANNOUNCEMENTS_QUERY,
    { limit, offset },
    getAdminToken(),
  );
  return data.adminListAnnouncements;
};

const UPDATE_ANNOUNCEMENT_MUTATION = `
  mutation UpdateAnnouncement($id: ID!, $input: UpdateAnnouncementInput!) {
    updateAnnouncement(id: $id, input: $input) {
      ID
      title
      body
      createdAt
      updatedAt
    }
  }
`;

const DELETE_ANNOUNCEMENT_MUTATION = `
  mutation DeleteAnnouncement($id: ID!) {
    deleteAnnouncement(id: $id)
  }
`;

export const createAnnouncement = async (title: string, body: string): Promise<Announcement> => {
  const data = await request<{ createAnnouncement: Announcement }>(
    CREATE_ANNOUNCEMENT_MUTATION,
    { input: { title, body } },
    getAdminToken(),
  );
  return data.createAnnouncement;
};

export const updateAnnouncement = async (id: string, title: string, body: string): Promise<Announcement> => {
  const data = await request<{ updateAnnouncement: Announcement }>(
    UPDATE_ANNOUNCEMENT_MUTATION,
    { id, input: { title, body } },
    getAdminToken(),
  );
  return data.updateAnnouncement;
};

export const deleteAnnouncement = async (id: string): Promise<boolean> => {
  const data = await request<{ deleteAnnouncement: boolean }>(
    DELETE_ANNOUNCEMENT_MUTATION,
    { id },
    getAdminToken(),
  );
  return data.deleteAnnouncement;
};
