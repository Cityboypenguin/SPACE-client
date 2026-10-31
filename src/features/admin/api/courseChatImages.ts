import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import type { CourseChatImageSource } from '../../../generated/graphql';
import { ADMIN_TOKEN_KEY } from './auth';

const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;

export type { CourseChatImageSource };

export type CourseChatImage = {
  ID: string;
  source: CourseChatImageSource;
  url: string;
  width?: number | null;
  height?: number | null;
  roomID: string;
  courseName: string;
  uploaderID: string;
  uploaderName: string;
  uploaderAccountID: string;
  targetDeleted: boolean;
  createdAt: string;
};

export type CourseChatImagePage = { items: CourseChatImage[]; total: number };

const CourseChatImagesDocument = graphql(`
  query AdminListCourseChatImages($roomID: ID, $source: CourseChatImageSource, $limit: Int, $offset: Int) {
    adminListCourseChatImages(roomID: $roomID, source: $source, limit: $limit, offset: $offset) {
      total
      items {
        ID
        source
        url
        width
        height
        roomID
        courseName
        uploaderID
        uploaderName
        uploaderAccountID
        targetDeleted
        createdAt
      }
    }
  }
`);

const DeleteCourseChatImageDocument = graphql(`
  mutation AdminDeleteCourseChatImage($mediaID: ID!) {
    adminDeleteCourseChatImage(mediaID: $mediaID)
  }
`);

export const listCourseChatImages = async (
  roomID: string | undefined,
  source: CourseChatImageSource | undefined,
  limit: number,
  offset: number,
): Promise<CourseChatImagePage> => {
  const data = await requestDoc(CourseChatImagesDocument, { roomID, source, limit, offset }, getAdminToken());
  return data.adminListCourseChatImages;
};

export const deleteCourseChatImage = async (mediaID: string): Promise<boolean> => {
  const data = await requestDoc(DeleteCourseChatImageDocument, { mediaID }, getAdminToken());
  return data.adminDeleteCourseChatImage;
};
