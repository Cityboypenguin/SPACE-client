import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import { type Media } from '../../../lib/media';
import { ADMIN_TOKEN_KEY } from '../../../lib/authStorage';

const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;

export type MessageUser = {
  ID: string;
  name: string;
  accountID: string;
  avatarUrl?: string | null;
};

export type Message = {
  ID: string;
  roomID: string;
  user: MessageUser;
  content: string;
  media: Media[];
  createdAt: string;
  updatedAt: string;
};

export type CommunityUser = {
  ID: string;
  name: string;
  accountID?: string;
};

export type Community = {
  ID: string;
  id?: string;
  roomID: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  owner?: CommunityUser | null;
};

export type CommunityPage = {
  communities: {
    items: Community[];
    total: number;
  };
};

export type RoomUser = {
  ID: string;
  accountID: string;
  name: string;
};

export type CommunityMember = {
  user: RoomUser;
  role: string;
};

export type Room = {
  ID: string;
  name: string;
  user: RoomUser[];
};

const CommunitiesDocument = graphql(`
  query Communities($limit: Int, $offset: Int) {
    communities(limit: $limit, offset: $offset) {
      items {
        ID
        roomID
        name
        description
        createdAt
        updatedAt
      }
      total
    }
  }
`);

const UpdateCommunityDocument = graphql(`
  mutation AdminUpdateCommunity($id: ID!, $input: UpdateCommunityInput!) {
    updateCommunity(id: $id, input: $input) {
      ID
      roomID
      name
      description
      createdAt
      updatedAt
    }
  }
`);

const UpdateCommunityMembersDocument = graphql(`
  mutation AdminUpdateCommunityMembers($communityID: ID!, $updates: [CommunityMemberUpdateInput!]!) {
    updateCommunityMembers(communityID: $communityID, updates: $updates)
  }
`);

const AdminGetCommunityAnalyticsDocument = graphql(`
  query AdminGetCommunityAnalytics($limit: Int, $offset: Int) {
    adminGetCommunityAnalytics(limit: $limit, offset: $offset) {
      items {
        communityID
        memberCount
      }
    }
  }
`);

const GetCommunityMembersDocument = graphql(`
  query AdminCommunityMembers($communityID: ID!, $limit: Int!, $offset: Int!) {
    communityMembers(communityID: $communityID, limit: $limit, offset: $offset) {
      items {
        user {
          ID
          accountID
          name
        }
        role
      }
      total
    }
  }
`);

export const getCommunities = async (limit = 20, offset = 0): Promise<CommunityPage> => {
  // 1. 基本一覧の取得
  const baseRes: any = await requestDoc(CommunitiesDocument as any, { limit, offset }, getAdminToken());

  const rawItems = baseRes?.communities?.items || [];
  const total = baseRes?.communities?.total || 0;

  // 2. 各コミュニティの「オーナー情報」と「実際のメンバー総数(total)」を同時に取得
  const items = await Promise.all(
    rawItems.map(async (item: any) => {
      let owner: CommunityUser | null = null;
      let memberCount = 0;

      try {
        const membersRes: any = await requestDoc(
          GetCommunityMembersDocument as any,
          { communityID: item.ID, limit: 50, offset: 0 },
          getAdminToken()
        );

        memberCount = membersRes?.communityMembers?.total ?? 0;

        const memberItems: CommunityMember[] = membersRes?.communityMembers?.items || [];
        const ownerMember = memberItems.find((m) => m.role === 'owner');
        if (ownerMember) {
          owner = {
            ID: ownerMember.user.ID,
            name: ownerMember.user.name,
            accountID: ownerMember.user.accountID,
          };
        }
      } catch {
        // エラーが発生した場合は、owner は null のまま、memberCount は 0 のままにする
      }

      return {
        ...item,
        id: item.ID,
        memberCount,
        owner,
      };
    })
  );

  return {
    communities: {
      items: items as Community[],
      total,
    },
  };
};

export const updateCommunity = async (
  id: string,
  input: { name?: string; description?: string },
) => {
  return await requestDoc(UpdateCommunityDocument as any, { id, input }, getAdminToken());
};

export const kickUserFromCommunity = async (communityID: string, userID: string) => {
  return await requestDoc(UpdateCommunityMembersDocument as any, { communityID, updates: [{ userID, action: 'KICK' }] }, getAdminToken());
};

export const getCommunityMembers = async (communityID: string, limit = 50, offset = 0) => {
  return await requestDoc(GetCommunityMembersDocument as any, { communityID, limit, offset }, getAdminToken());
};

const ListRoomMessagesDocument = graphql(`
  query AdminListMessages($roomID: ID!, $limit: Int, $before: ID) {
    messages(roomID: $roomID, limit: $limit, before: $before) {
      items {
        ID
        roomID
        user {
          ID
          name
          accountID
          avatarUrl
        }
        content
        media {
          ...MediaFields
        }
        createdAt
        updatedAt
      }
      hasMoreBefore
    }
  }
`);

export const promoteToCommunityOwner = async (communityID: string, userID: string) => {
  return await requestDoc(UpdateCommunityMembersDocument as any, { communityID, updates: [{ userID, action: 'PROMOTE' }] }, getAdminToken());
};

export const demoteFromCommunityOwner = async (communityID: string, userID: string) => {
  return await requestDoc(UpdateCommunityMembersDocument as any, { communityID, updates: [{ userID, action: 'DEMOTE' }] }, getAdminToken());
};

const DeleteMessageDocument = graphql(`
  mutation DeleteMessage($roomID: ID!, $id: ID!) {
    deleteMessage(roomID: $roomID, id: $id)
  }
`);

export const adminMessagePageSize = 50;

export const listRoomMessages = async (
  roomID: string,
  limit = adminMessagePageSize,
  before?: string,
): Promise<{ messages: { items: Message[]; hasMoreBefore: boolean } }> => {
  const data = await requestDoc(
    ListRoomMessagesDocument as any,
    { roomID, limit, ...(before ? { before } : {}) },
    getAdminToken(),
  );
  return data as { messages: { items: Message[]; hasMoreBefore: boolean } };
};

export const adminDeleteMessage = async (roomID: string, messageID: string) => {
  return await requestDoc(DeleteMessageDocument as any, { roomID, id: messageID }, getAdminToken());
};
