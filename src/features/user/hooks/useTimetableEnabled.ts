import useSWR, { mutate } from 'swr';
import { getTimetableEnabled } from '../api/course';

const KEY = 'timetable-enabled';

export const applyTimetableStatus = (enabled: boolean) => {
  void mutate(KEY, enabled, { revalidate: false });
};

export const refreshTimetableStatus = () => {
  void mutate(KEY);
};

export const useTimetableEnabled = () => {
  const { data, isLoading } = useSWR(KEY, getTimetableEnabled);
  return { enabled: data !== false, isLoading: isLoading && data === undefined };
};