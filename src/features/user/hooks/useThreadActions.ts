import { useSearchParams } from 'react-router-dom';

export function useThreadActions() {
  const [, setParams] = useSearchParams();
  const show = (view: string) => setParams(previous => {
    const next = new URLSearchParams(previous);
    next.delete('thread');
    next.set('threadView', view);
    return next;
  });
  return { create: () => show('create'), list: () => show('list') };
}
