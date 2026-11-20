import { graphql } from '../../../generated';
import { requestDoc } from '../../../lib/graphql';
import { getUserToken } from './auth';

const ReceivedDocument = graphql(`
  query ReceivedCommunityInvitations($limit: Int, $offset: Int) {
    receivedCommunityInvitations(limit: $limit, offset: $offset) {
      total
      items { id communityName communityDescription communityAvatarURL memberCount senderName message createdAt expiresAt }
    }
  }
`);

const PreviewDocument = graphql(`
  query CommunityInvitationPreview($input: CommunityInvitationReference!) {
    communityInvitation(input: $input) {
      id roomID communityName communityDescription communityAvatarURL memberCount senderName message isMember status createdAt expiresAt
    }
  }
`);

const SendManyDocument = graphql(`
  mutation InviteCommunityUsers($communityID: ID!, $userIDs: [ID!]!, $message: String) {
    inviteCommunityUsers(communityID: $communityID, userIDs: $userIDs, message: $message) {
      userID error invitation { id }
    }
  }
`);

const CandidatesDocument = graphql(`
  query CommunityInviteCandidates($communityID: ID!, $keyword: String!, $limit: Int, $offset: Int) {
    communityInviteCandidates(communityID: $communityID, keyword: $keyword, limit: $limit, offset: $offset) {
      total
      items { status user { ID accountID name avatarUrl } }
    }
  }
`);

const LinkDocument = graphql(`
  mutation CreateCommunityInviteLink($communityID: ID!, $expiresInHours: Int, $message: String) {
    createCommunityInviteLink(communityID: $communityID, expiresInHours: $expiresInHours, message: $message) {
      token invitation { id expiresAt }
    }
  }
`);

const AcceptDocument = graphql(`
  mutation AcceptCommunityInvitation($input: CommunityInvitationReference!) {
    acceptCommunityInvitation(input: $input)
  }
`);

const DeclineDocument = graphql(`
  mutation DeclineCommunityInvitation($id: ID!) { declineCommunityInvitation(id: $id) }
`);

const SentDocument = graphql(`
  query SentCommunityInvitations($roomID: ID!, $history: Boolean, $limit: Int, $offset: Int) {
    sentCommunityInvitations(roomID: $roomID, history: $history, limit: $limit, offset: $offset) {
      id isLink senderName recipientName recipientAccountID status message useCount createdAt expiresAt respondedAt
    }
  }
`);

const RevokeDocument = graphql(`
  mutation RevokeCommunityInvitation($id: ID!) { revokeCommunityInvitation(id: $id) }
`);

const GreetingDocument = graphql(`
  query CommunityGreetingOptions($roomID: ID!) {
    communityGreeting(roomID: $roomID) {
      welcomeMessageID
      joinedUserName
      stamps { id label imageUrl }
    }
  }
`);

const SendGreetingDocument = graphql(`
  mutation SendCommunityGreeting($roomID: ID!, $welcomeMessageID: ID!, $stampID: String!) {
    sendCommunityGreeting(roomID: $roomID, welcomeMessageID: $welcomeMessageID, stampID: $stampID) {
      ID roomID content stampID createdAt updatedAt isMine isCommunityWelcome
      user { ID name accountID avatarUrl }
    }
  }
`);

export type InvitationReference = { id: string } | { token: string };

const token = () => getUserToken() ?? undefined;
export const receivedInvitations = async (limit = 20, offset = 0) =>
  (await requestDoc(ReceivedDocument, { limit, offset }, token())).receivedCommunityInvitations;
export const previewInvitation = async (input: InvitationReference) =>
  (await requestDoc(PreviewDocument, { input }, token())).communityInvitation;
export const inviteCommunityUsers = async (communityID: string, userIDs: string[], message?: string) =>
  (await requestDoc(SendManyDocument, { communityID, userIDs, message: message || null }, token())).inviteCommunityUsers;
export const inviteCandidates = async (communityID: string, keyword: string, limit = 20, offset = 0) =>
  (await requestDoc(CandidatesDocument, { communityID, keyword, limit, offset }, token())).communityInviteCandidates;
export type InviteCandidate = Awaited<ReturnType<typeof inviteCandidates>>['items'][number];
export type InviteLinkOptions = { expiresInHours: number; message: string };
export const createInvitationLink = async (communityID: string, options: InviteLinkOptions) =>
  (await requestDoc(LinkDocument, {
    communityID,
    expiresInHours: options.expiresInHours,
    message: options.message || null,
  }, token())).createCommunityInviteLink;
export const acceptInvitation = async (input: InvitationReference) =>
  (await requestDoc(AcceptDocument, { input }, token())).acceptCommunityInvitation;
export const declineInvitation = (id: string) => requestDoc(DeclineDocument, { id }, token());
export const sentInvitations = async (roomID: string, history: boolean, limit = 20, offset = 0) =>
  (await requestDoc(SentDocument, { roomID, history, limit, offset }, token())).sentCommunityInvitations;
export type SentInvitation = Awaited<ReturnType<typeof sentInvitations>>[number];
export const revokeInvitation = (id: string) => requestDoc(RevokeDocument, { id }, token());
export const getCommunityGreeting = async (roomID: string) =>
  (await requestDoc(GreetingDocument, { roomID }, token())).communityGreeting;
export const sendCommunityGreeting = async (roomID: string, welcomeMessageID: string, stampID: string) =>
  (await requestDoc(SendGreetingDocument, { roomID, welcomeMessageID, stampID }, token())).sendCommunityGreeting;
