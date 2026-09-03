import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import { getUserToken } from './auth';

export type Announcement = {
  ID: string;
  title: string;
  body: string;
  createdAt: string;
};

export type AnnouncementPage = { items: Announcement[]; total: number };

const ListAnnouncementsDocument = graphql(`
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
`);

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

export const listAnnouncements = async (limit = 20, offset = 0): Promise<AnnouncementPage> => {
  const data = await requestDoc(ListAnnouncementsDocument, { limit, offset }, getUserToken());
  return data.announcements ?? { items: [], total: 0 };
};

export const getAnnouncement = async (id: string): Promise<Announcement> => {
  const data = await requestDoc(GetAnnouncementDocument, { id }, getUserToken());
  return data.announcement;
};
