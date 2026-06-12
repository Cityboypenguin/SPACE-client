import { useState } from 'react';

const STORAGE_PREFIX = 'admin_page_size_';

export const usePersistedPageSize = (key: string, defaultValue = 20) => {
  const storageKey = `${STORAGE_PREFIX}${key}`;

  const [pageSize, setPageSizeState] = useState<number>(() => {
    const stored = localStorage.getItem(storageKey);
    return stored ? Number(stored) : defaultValue;
  });

  const setPageSize = (size: number) => {
    localStorage.setItem(storageKey, String(size));
    setPageSizeState(size);
  };

  return [pageSize, setPageSize] as const;
};
