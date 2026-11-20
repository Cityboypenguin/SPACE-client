import { mutate } from 'swr';

export const COMMUNITY_INVITATION_TYPE = 'community_invitation';
export const RECEIVED_INVITATIONS = '/community/invitations';
export const individualInvitationPath = (id: string) => `${RECEIVED_INVITATIONS}/${encodeURIComponent(id)}`;
export const sharedInvitationPath = (token: string) => `${RECEIVED_INVITATIONS}/link#${token}`;

export const invitationLoginReturn = (path: unknown) =>
  typeof path === 'string' && /^\/community\/invitations\/(?:link#[A-Za-z0-9_-]{43}|[A-Za-z0-9_-]+)$/.test(path)
    ? path
    : null;

export const receivedInvitationCountKey = (userID: string) => ['received-invitation-count', userID] as const;

// 有効期限を「あと3日」のような残り時間で表す。urgent は24時間を切ったとき。
export const invitationRemaining = (expiresAt: string, now = Date.now()) => {
  const ms = new Date(expiresAt).getTime() - now;
  const absolute = new Date(expiresAt).toLocaleString('ja-JP', {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  if (!(ms > 0)) return { label: '期限切れ', absolute, urgent: true };
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 60) return { label: `あと${minutes}分`, absolute, urgent: true };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { label: `あと${hours}時間`, absolute, urgent: true };
  return { label: `あと${Math.floor(hours / 24)}日`, absolute, urgent: false };
};

export const COMMUNITY_INVITATION_ACCEPTED_TYPE = 'community_invitation_accepted';

const invitationCacheRoots = new Set([
  'received-invitations',
  'received-invitation-count',
  'sent-community-invitations',
  'community-invitation',
  'community-invite-candidates',
]);

// 招待の一覧（届いた招待・送った招待・検索結果の状態）を開いている画面に取り直させる。
// サーバーからの community_invitations_changed や招待の通知を受けたときに呼ぶ。
export const refreshInvitationCaches = () =>
  mutate((key) => Array.isArray(key) && invitationCacheRoots.has(key[0] as string));
