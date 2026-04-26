const DM_ROOMS_KEY = 'space_dm_recent';

export type RecentDM = {
  roomID: string;
  partnerName: string;
  partnerAccountID: string;
};

export const getRecentDMs = (): RecentDM[] => {
  try {
    return JSON.parse(localStorage.getItem(DM_ROOMS_KEY) || '[]');
  } catch {
    return [];
  }
};

export const saveRecentDM = (dm: RecentDM) => {
  const existing = getRecentDMs().filter((d) => d.roomID !== dm.roomID);
  localStorage.setItem(DM_ROOMS_KEY, JSON.stringify([dm, ...existing].slice(0, 20)));
};

export const replaceRecentDMs = (dms: RecentDM[]) => {
  localStorage.setItem(DM_ROOMS_KEY, JSON.stringify(dms.slice(0, 20)));
};