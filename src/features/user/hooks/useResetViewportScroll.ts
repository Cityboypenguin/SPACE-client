import { useLayoutEffect } from 'react';

export const useResetViewportScroll = (deps: readonly unknown[]) => {
  useLayoutEffect(() => {
    const reset = () => {
      window.scrollTo({ top: 0, left: 0 });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    reset();
    const frame = window.requestAnimationFrame(reset);
    const timeout = window.setTimeout(reset, 120);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
