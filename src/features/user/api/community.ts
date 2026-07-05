import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import { getUserToken } from './auth';

export type Community = {
  ID: string;
  roomID: string;
  name: string;
  description: string;
  avatarURL: string;
  memberCount: number;
  isMember: boolean;
  // myCommunities のみが返す値。検索・作成・更新・ランダム取得では取得していない。
  unreadCount?: number;
  lastMessage?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CommunityMember = {
  user: {
    ID: string;
    accountID: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  role: string;
};

const MyCommunitiesDocument = graphql(`
  query MyCommunities($limit: Int, $offset: Int) {
    myCommunities(limit: $limit, offset: $offset) {
      items {
        ID
        roomID
        name
        description
        avatarURL
        memberCount
        isMember
        unreadCount
        lastMessage
        createdAt
        updatedAt
      }
      total
    }
  }
`);

const SearchCommunitiesDocument = graphql(`
  query SearchCommunities($name: String!, $limit: Int, $offset: Int) {
    searchCommunities(name: $name, limit: $limit, offset: $offset) {
      items {
        ID
        roomID
        name
        description
        avatarURL
        memberCount
        isMember
        createdAt
        updatedAt
      }
      total
    }
  }
`);

const CreateCommunityDocument = graphql(`
  mutation CreateCommunity($input: CreateCommunityInput!) {
    createCommunity(input: $input) {
      ID
      roomID
      name
      description
      avatarURL
      memberCount
      isMember
      createdAt
      updatedAt
    }
  }
`);

const JoinRoomDocument = graphql(`
  mutation JoinRoom($roomID: ID!) {
    joinRoom(roomID: $roomID)
  }
`);

const RemoveUserFromRoomDocument = graphql(`
  mutation RemoveUserFromRoom($input: RemoveUserFromRoomInput!) {
    removeUserFromRoom(input: $input)
  }
`);

const GetMyRoleInCommunityDocument = graphql(`
  query GetMyRoleInCommunity($communityID: ID!) {
    getMyRoleInCommunity(communityID: $communityID)
  }
`);

const GetCommunityMembersDocument = graphql(`
  query GetCommunityMembers($communityID: ID!) {
    getCommunityMembers(communityID: $communityID) {
      user {
        ID
        accountID
        name
        email
        avatarUrl
      }
      role
    }
  }
`);

const UpdateCommunityDocument = graphql(`
  mutation UpdateCommunity($id: ID!, $input: UpdateCommunityInput!) {
    updateCommunity(id: $id, input: $input) {
      ID
      roomID
      name
      description
      avatarURL
      memberCount
      isMember
      createdAt
      updatedAt
    }
  }
`);

const KickUserFromCommunityDocument = graphql(`
  mutation KickUserFromCommunity($communityID: ID!, $userID: ID!) {
    kickUserFromCommunity(communityID: $communityID, userID: $userID)
  }
`);

const PromoteToCommunityOwnerDocument = graphql(`
  mutation PromoteToCommunityOwner($communityID: ID!, $userID: ID!) {
    promoteToCommunityOwner(communityID: $communityID, userID: $userID)
  }
`);

const DemoteFromCommunityOwnerDocument = graphql(`
  mutation DemoteFromCommunityOwner($communityID: ID!, $userID: ID!) {
    demoteFromCommunityOwner(communityID: $communityID, userID: $userID)
  }
`);

const UpdateCommunityMembersDocument = graphql(`
  mutation UpdateCommunityMembers($communityID: ID!, $updates: [CommunityMemberUpdateInput!]!) {
    updateCommunityMembers(communityID: $communityID, updates: $updates)
  }
`);

const RandomCommunitiesDocument = graphql(`
  query RandomCommunities($limit: Int!) {
    randomCommunities(limit: $limit) {
      ID
      roomID
      name
      description
      avatarURL
      memberCount
      isMember
      createdAt
      updatedAt
    }
  }
`);

const PresignedCommunityIconUploadUrlDocument = graphql(`
  query PresignedCommunityIconUploadUrl($contentType: String!) {
    presignedCommunityIconUploadUrl(contentType: $contentType) {
      uploadUrl
      objectKey
    }
  }
`);

export type CommunityMemberAction = 'PROMOTE' | 'DEMOTE' | 'KICK';

export type CommunityMemberUpdateInput = {
  userID: string;
  action: CommunityMemberAction;
};

export type CommunityPage = {
  items: Community[];
  total: number;
};

export const listMyCommunities = async (limit = 20, offset = 0): Promise<CommunityPage> => {
  const data = await requestDoc(MyCommunitiesDocument, { limit, offset }, getUserToken());
  return data.myCommunities;
};

export const searchCommunities = async (name: string, limit = 20, offset = 0): Promise<CommunityPage> => {
  const data = await requestDoc(SearchCommunitiesDocument, { name, limit, offset }, getUserToken());
  return data.searchCommunities;
};

export const createCommunity = async (name: string, description: string, avatarKey: string): Promise<Community> => {
  const data = await requestDoc(CreateCommunityDocument, { input: { name, description, avatarKey } }, getUserToken());
  return data.createCommunity;
};

export const joinCommunity = async (roomID: string): Promise<void> => {
  await requestDoc(JoinRoomDocument, { roomID }, getUserToken());
};

export const leaveCommunity = async (roomID: string, userID: string): Promise<void> => {
  await requestDoc(RemoveUserFromRoomDocument, { input: { roomID, userID } }, getUserToken());
};

export const getMyRoleInCommunity = async (communityID: string): Promise<string> => {
  const data = await requestDoc(GetMyRoleInCommunityDocument, { communityID }, getUserToken());
  return data.getMyRoleInCommunity;
};

export const getCommunityMembers = async (communityID: string): Promise<CommunityMember[]> => {
  const data = await requestDoc(GetCommunityMembersDocument, { communityID }, getUserToken());
  return data.getCommunityMembers;
};

export const updateCommunityInfo = async (
  id: string,
  input: { name?: string; description?: string; avatarKey?: string },
): Promise<Community> => {
  const data = await requestDoc(UpdateCommunityDocument, { id, input }, getUserToken());
  return data.updateCommunity;
};

export const kickUserFromCommunity = async (communityID: string, userID: string): Promise<void> => {
  await requestDoc(KickUserFromCommunityDocument, { communityID, userID }, getUserToken());
};

export const promoteToCommunityOwner = async (communityID: string, userID: string): Promise<void> => {
  await requestDoc(PromoteToCommunityOwnerDocument, { communityID, userID }, getUserToken());
};

export const demoteFromCommunityOwner = async (communityID: string, userID: string): Promise<void> => {
  await requestDoc(DemoteFromCommunityOwnerDocument, { communityID, userID }, getUserToken());
};

export const updateCommunityMembers = async (
  communityID: string,
  updates: CommunityMemberUpdateInput[],
): Promise<void> => {
  await requestDoc(UpdateCommunityMembersDocument, { communityID, updates }, getUserToken());
};

export const getRandomCommunities = async (limit: number): Promise<Community[]> => {
  const data = await requestDoc(RandomCommunitiesDocument, { limit }, getUserToken());
  return data.randomCommunities;
};

const MyUnreadCommunityCountDocument = graphql(`
  query MyUnreadCommunityCount {
    myUnreadCommunityCount
  }
`);

export const getUnreadCommunityCount = async (): Promise<number> => {
  const data = await requestDoc(MyUnreadCommunityCountDocument, {}, getUserToken());
  return data.myUnreadCommunityCount;
};

export const getPresignedCommunityIconUploadUrl = async (contentType: string) => {
  const token = getUserToken();
  if (!token) throw new Error('認証が必要です。');

  return await requestDoc(PresignedCommunityIconUploadUrlDocument, { contentType }, token);
};
