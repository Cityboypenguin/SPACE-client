// デスクトップアプリ（SPACE-client-desktop リポジトリ）の preload が公開する bridge の型。
// 向こうの shared/desktop.ts と同じ形に保つこと。変更するときは両方のリポジトリを直す。
type DesktopNotification = { title: string; body: string; link: string };
type UpdateState = {
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error' | 'required';
  version?: string;
};
type DesktopBridge = {
  version: string;
  notify: (notification: DesktopNotification) => void;
  setUnreadCount: (count: number) => void;
  onNavigate: (listener: (link: string) => void) => () => void;
  onUpdateState: (listener: (state: UpdateState) => void) => () => void;
};

declare global {
  interface Window { spaceDesktop?: DesktopBridge }
}

export const isDesktop = () => Boolean(window.spaceDesktop);

type BadgePolicy = 'notifications' | 'dm' | 'total';
// 未読数の扱いを変更するときは、この1か所を変更する。
export const DESKTOP_BADGE_POLICY: BadgePolicy = 'total';
export const desktopBadgeCount = (notifications: number, dm: number, policy: BadgePolicy = DESKTOP_BADGE_POLICY) =>
  policy === 'notifications' ? notifications : policy === 'dm' ? dm : notifications + dm;

const unread = { notifications: 0, dm: 0 };
export function updateDesktopUnread(parts: Partial<typeof unread>): void {
  if (!window.spaceDesktop) return;
  Object.assign(unread, parts);
  window.spaceDesktop.setUnreadCount(Math.min(999999, Math.max(0, desktopBadgeCount(unread.notifications, unread.dm))));
}

export function notifyDesktop(payload: DesktopNotification): void {
  // 常駐中の Electron は、非表示でも document.hasFocus() が true のままになる場合がある。
  // 実際のフォーカスは main の BrowserWindow.isFocused() で判定する。
  window.spaceDesktop?.notify(payload);
}
