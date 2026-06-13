import { useEffect, useRef } from 'react';

/**
 * onLoadMore が呼ばれるべき条件（hasMore, enabled など）は呼び出し側が判断して渡す。
 * isLoading が true の間は onLoadMore を呼ばない。
 */
export const useInfiniteScroll = (
  onLoadMore: () => void,
  isLoading: boolean,
  enabled: boolean = true,
) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(isLoading);
  useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !enabled) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingRef.current) {
          onLoadMore();
        }
      },
      { rootMargin: '400px', threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onLoadMore, enabled]);

  return sentinelRef;
};
