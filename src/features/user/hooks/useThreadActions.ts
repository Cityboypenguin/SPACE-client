import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

type Origin = 'chat' | 'list' | 'thread';
type BackTarget = {
  pathname: string;
  search: string;
  origin: Origin;
  previous?: BackTarget;
};

const getBackTarget = (value: unknown, pathname: string): BackTarget | undefined => {
  if (!value || typeof value !== 'object') return undefined;
  const target = value as BackTarget;
  // Older entries only stored an origin. Without a URL, fall back to the parent chat.
  if (target.pathname !== pathname || typeof target.search !== 'string') return undefined;
  const params = new URLSearchParams(target.search);
  const origin: Origin = params.get('thread') ? 'thread' : params.get('threadView') === 'list' ? 'list' : 'chat';
  return target.origin === origin ? target : undefined;
};

export function useThreadActions() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const state = (location.state ?? {}) as Record<string, unknown>;
  const backTarget = getBackTarget(state.threadBack, location.pathname);
  const backLabel = backTarget?.origin === 'list' ? 'スレッド一覧に戻る' : backTarget?.origin === 'thread' ? 'スレッドに戻る' : '親チャットに戻る';

  const parentParams = () => {
    const next = new URLSearchParams(params);
    next.delete('thread');
    next.delete('threadView');
    next.delete('threadOrigin');
    return next;
  };

  const go = (id: string | null, view?: 'list' | 'create', completingCreation = false, fromChat = false) => {
    if (!id && params.get('threadView') === view) return;
    const next = parentParams();
    if (id) next.set('thread', id);
    if (view) next.set('threadView', view);
    const origin: Origin = params.get('thread') ? 'thread' : params.get('threadView') === 'list' ? 'list' : 'chat';
    const target: BackTarget = fromChat
      ? { pathname: location.pathname, search: parentParams().toString(), origin: 'chat' }
      : { pathname: location.pathname, search: location.search, origin, previous: backTarget };
    navigate({ pathname: location.pathname, search: next.toString() }, {
      replace: completingCreation || (!!id && !!params.get('thread')),
      state: { ...state, threadBack: completingCreation ? backTarget : target },
    });
  };

  const back = () => {
    const nextState = { ...state };
    delete nextState.threadBack;
    if (backTarget?.previous) nextState.threadBack = backTarget.previous;
    // The previous browser entry may belong to another thread or a query change.
    // Return to the saved view, including its own back destination after reload.
    navigate({ pathname: location.pathname, search: backTarget?.search ?? parentParams().toString() }, {
      replace: true,
      state: nextState,
    });
  };

  return {
    create: () => go(null, 'create'),
    list: () => go(null, 'list'),
    open: (id: string) => go(id, undefined, params.get('threadView') === 'create'),
    openFromChat: (id: string) => go(id, undefined, false, true),
    back,
    backLabel,
  };
}
