import { useEffect, useRef, type RefObject } from 'react';

export const useClickOutside = <T extends HTMLElement>(
  active: boolean,
  onOutside: () => void,
): RefObject<T | null> => {
  const ref = useRef<T | null>(null);
  const onOutsideRef = useRef(onOutside);

  useEffect(() => {
    onOutsideRef.current = onOutside;
  });

  useEffect(() => {
    if (!active) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOutsideRef.current();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [active]);

  return ref;
};
