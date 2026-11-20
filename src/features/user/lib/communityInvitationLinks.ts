export const COMMUNITY_INVITATION_TYPE = 'community_invitation';
export const RECEIVED_INVITATIONS = '/community/invitations';
export const individualInvitationPath = (id: string) => `${RECEIVED_INVITATIONS}/${encodeURIComponent(id)}`;
export const notificationInvitationPath = (id: string) => `${individualInvitationPath(id)}?from=notifications`;
export const sharedInvitationPath = (token: string) => `${RECEIVED_INVITATIONS}/link#${token}`;

export const invitationLoginReturn = (path: unknown) =>
  typeof path === 'string' && /^\/community\/invitations\/(?:link#[A-Za-z0-9_-]{43}|[A-Za-z0-9_-]+(?:\?from=notifications)?)$/.test(path)
    ? path
    : null;

export const receivedInvitationCountKey = (userID: string) => ['received-invitation-count', userID] as const;
