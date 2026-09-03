import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import { ADMIN_TOKEN_KEY } from '../../../lib/authStorage';

const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;

export type Announcement = {
  ID: string;
  title: string;
  body: string;
  createdAt: string;
};

export type AnnouncementPage = { items: Announcement[]; total: number };

const GetAnnouncementDocument = graphql(`
  query GetAnnouncement($id: ID!) {
    announcement(id: $id) {
      ID
      title
      body
      createdAt
    }
  }
`);

const AdminListAnnouncementsDocument = graphql(`
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
`);

const CreateAnnouncementDocument = graphql(`
  mutation CreateAnnouncement($input: CreateAnnouncementInput!) {
    createAnnouncement(input: $input) {
      ID
      title
      body
      createdAt
    }
  }
`);

export const getAnnouncement = async (id: string): Promise<Announcement> => {
  const data = await requestDoc(GetAnnouncementDocument, { id }, getAdminToken());
  return data.announcement;
};

export const getAdminAnnouncements = async (limit = 20, offset = 0): Promise<AnnouncementPage> => {
  const data = await requestDoc(AdminListAnnouncementsDocument, { limit, offset }, getAdminToken());
  return data.adminListAnnouncements;
};

const UpdateAnnouncementDocument = graphql(`
  mutation UpdateAnnouncement($id: ID!, $input: UpdateAnnouncementInput!) {
    updateAnnouncement(id: $id, input: $input) {
      ID
      title
      body
      createdAt
      updatedAt
    }
  }
`);

const DeleteAnnouncementDocument = graphql(`
  mutation DeleteAnnouncement($id: ID!) {
    deleteAnnouncement(id: $id)
  }
`);

export const createAnnouncement = async (title: string, body: string): Promise<Announcement> => {
  const data = await requestDoc(CreateAnnouncementDocument, { input: { title, body } }, getAdminToken());
  return data.createAnnouncement;
};

export const updateAnnouncement = async (id: string, title: string, body: string): Promise<Announcement> => {
  const data = await requestDoc(UpdateAnnouncementDocument, { id, input: { title, body } }, getAdminToken());
  return data.updateAnnouncement;
};

export const deleteAnnouncement = async (id: string): Promise<boolean> => {
  const data = await requestDoc(DeleteAnnouncementDocument, { id }, getAdminToken());
  return data.deleteAnnouncement;
};
