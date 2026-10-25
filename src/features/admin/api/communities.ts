import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import { type Media } from '../../../lib/media';
import { ADMIN_TOKEN_KEY } from '../../../lib/authStorage';
import type { AdminCommunitySortField, SortOrder } from '../../../generated/graphql';

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

// 検索・並び替え・ページングはすべてサーバー側で行う。以前は検索のたびに
// communities(limit: 1000) を全件取り、さらに1件ごとに communityMembers を
// 引いてオーナーと人数を出していた（1000件なら1000リクエスト）。
const AdminListCommunitiesDocument = graphql(`
  query AdminListCommunities(
    $keyword: String
    $sortBy: AdminCommunitySortField
    $sortOrder: SortOrder
    $limit: Int
    $offset: Int
  ) {
    adminListCommunities(keyword: $keyword, sortBy: $sortBy, sortOrder: $sortOrder, limit: $limit, offset: $offset) {
      items {
        community {
          ID
          roomID
          name
          description
          memberCount
          createdAt
          updatedAt
        }
        owner {
          ID
          name
          accountID
        }
      }
      total
    }
  }
`);

const AdminGetCommunityDocument = graphql(`
  query AdminGetCommunity($id: ID!) {
    adminGetCommunity(id: $id) {
      community {
        ID
        roomID
        name
        description
        memberCount
        createdAt
        updatedAt
      }
      owner {
        ID
        name
        accountID
      }
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

export type CommunitySortField = AdminCommunitySortField;
export type { SortOrder };

export type CommunityListParams = {
  keyword?: string;
  sortBy?: CommunitySortField;
  sortOrder?: SortOrder;
  limit?: number;
  offset?: number;
};

type AdminCommunityItem = {
  community: Omit<Community, 'id' | 'owner'>;
  owner?: CommunityUser | null;
};

const toCommunity = ({ community, owner }: AdminCommunityItem): Community => ({
  ...community,
  id: community.ID,
  owner: owner ?? null,
});

export const getCommunities = async ({
  keyword,
  sortBy = 'CREATED_AT',
  sortOrder = 'DESC',
  limit = 20,
  offset = 0,
}: CommunityListParams = {}): Promise<CommunityPage> => {
  const data = await requestDoc(
    AdminListCommunitiesDocument,
    { keyword: keyword?.trim() || undefined, sortBy, sortOrder, limit, offset },
    getAdminToken(),
  );
  return {
    communities: {
      items: data.adminListCommunities.items.map(toCommunity),
      total: data.adminListCommunities.total,
    },
  };
};

export const getCommunity = async (id: string): Promise<Community | null> => {
  const data = await requestDoc(AdminGetCommunityDocument, { id }, getAdminToken());
  return data.adminGetCommunity ? toCommunity(data.adminGetCommunity) : null;
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
