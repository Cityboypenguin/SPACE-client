import { graphql } from '../../../generated';
import { requestDoc } from '../../../lib/graphql';
import { getUserToken } from './auth';

const ReceivedDocument = graphql(`
  query ReceivedCommunityInvitations($limit: Int, $offset: Int) {
    receivedCommunityInvitations(limit: $limit, offset: $offset) {
      total
      items { id communityName senderName expiresAt }
    }
  }
`);

const PreviewDocument = graphql(`
  query CommunityInvitationPreview($input: CommunityInvitationReference!) {
    communityInvitation(input: $input) {
      id roomID communityName communityDescription senderName isMember status expiresAt
    }
  }
`);

const SendDocument = graphql(`
  mutation InviteCommunityUser($communityID: ID!, $userID: ID!) {
    inviteCommunityUser(communityID: $communityID, userID: $userID) { id }
  }
`);

const LinkDocument = graphql(`
  mutation CreateCommunityInviteLink($communityID: ID!) {
    createCommunityInviteLink(communityID: $communityID) { token invitation { id expiresAt } }
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
  query SentCommunityInvitations($roomID: ID!, $limit: Int, $offset: Int) {
    sentCommunityInvitations(roomID: $roomID, limit: $limit, offset: $offset) {
      id isLink senderName recipientName expiresAt
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
export const inviteCommunityUser = (communityID: string, userID: string) =>
  requestDoc(SendDocument, { communityID, userID }, token());
export const createInvitationLink = async (communityID: string) =>
  (await requestDoc(LinkDocument, { communityID }, token())).createCommunityInviteLink;
export const acceptInvitation = async (input: InvitationReference) =>
  (await requestDoc(AcceptDocument, { input }, token())).acceptCommunityInvitation;
export const declineInvitation = (id: string) => requestDoc(DeclineDocument, { id }, token());
export const sentInvitations = async (roomID: string, limit = 20, offset = 0) =>
  (await requestDoc(SentDocument, { roomID, limit, offset }, token())).sentCommunityInvitations;
export const revokeInvitation = (id: string) => requestDoc(RevokeDocument, { id }, token());
export const getCommunityGreeting = async (roomID: string) =>
  (await requestDoc(GreetingDocument, { roomID }, token())).communityGreeting;
export const sendCommunityGreeting = async (roomID: string, welcomeMessageID: string, stampID: string) =>
  (await requestDoc(SendGreetingDocument, { roomID, welcomeMessageID, stampID }, token())).sendCommunityGreeting;
