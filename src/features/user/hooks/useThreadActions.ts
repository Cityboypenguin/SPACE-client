import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

type Origin = 'chat' | 'list' | 'thread';
type BackTarget = { pathname: string; origin: Origin };

export function useThreadActions() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const state = (location.state ?? {}) as Record<string, unknown>;
  const candidate = state.threadBack as BackTarget | undefined;
  const backTarget = candidate?.pathname === location.pathname && ['chat', 'list', 'thread'].includes(candidate.origin) ? candidate : undefined;
  const backLabel = backTarget?.origin === 'list' ? 'スレッド一覧に戻る' : backTarget?.origin === 'thread' ? 'スレッドに戻る' : '親チャットに戻る';

  const go = (id: string | null, view?: 'list' | 'create', completingCreation = false) => {
    const next = new URLSearchParams(params);
    next.delete('thread');
    next.delete('threadView');
    next.delete('threadOrigin');
    if (id) next.set('thread', id);
    if (view) next.set('threadView', view);
    const origin: Origin = params.get('thread') ? 'thread' : params.get('threadView') === 'list' ? 'list' : 'chat';
    navigate({ pathname: location.pathname, search: next.toString() }, {
      replace: completingCreation,
      state: { ...state, threadBack: completingCreation ? backTarget : { pathname: location.pathname, origin } },
    });
  };

  const back = () => {
    if (backTarget) {
      navigate(-1);
      return;
    }
    // Direct links have no in-app entry to return to. Stay in the parent chat.
    const next = new URLSearchParams(params);
    next.delete('thread');
    next.delete('threadView');
    next.delete('threadOrigin');
    const nextState = { ...state };
    delete nextState.threadBack;
    navigate({ pathname: location.pathname, search: next.toString() }, { replace: true, state: nextState });
  };

  return {
    create: () => go(null, 'create'),
    list: () => go(null, 'list'),
    open: (id: string) => go(id, undefined, params.get('threadView') === 'create'),
    back,
    backLabel,
  };
}
