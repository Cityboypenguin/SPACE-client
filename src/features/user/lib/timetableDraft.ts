import type { Course } from '../api/course';
import { USER_ID_KEY } from '../../../lib/authStorage';

export type DraftSlot = { course: Course; entryID?: string; isProfileVisible?: boolean };
export type TimetableDraft = Record<string, DraftSlot>;

export type StoredTimetableDraft = {
  baselineEntryIDs: string[];
  draft: TimetableDraft;
};

export const slotKey = (dayOfWeek: string, period: number): string => `${dayOfWeek}:${period}`;

const draftStorageKey = (year: number, semester: string): string => {
  const userId = localStorage.getItem(USER_ID_KEY) ?? 'anon';
  return `space:timetable-draft:${userId}:${year}:${semester}`;
};

export const loadTimetableDraft = (year: number, semester: string): StoredTimetableDraft | null => {
  const raw = localStorage.getItem(draftStorageKey(year, semester));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredTimetableDraft;
  } catch {
    return null;
  }
};

export const saveTimetableDraft = (year: number, semester: string, stored: StoredTimetableDraft): void => {
  localStorage.setItem(draftStorageKey(year, semester), JSON.stringify(stored));
};

export const clearTimetableDraft = (year: number, semester: string): void => {
  localStorage.removeItem(draftStorageKey(year, semester));
};
