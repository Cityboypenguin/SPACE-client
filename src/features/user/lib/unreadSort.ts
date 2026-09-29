type WithUnreadCount = {
  unreadCount?: number | null;
};

export const sortUnreadFirst = <T extends WithUnreadCount>(items: T[]): T[] => {
  return [...items].sort((a, b) => Number((b.unreadCount ?? 0) > 0) - Number((a.unreadCount ?? 0) > 0));
};
