import { request } from './graphql';
import { USER_TOKEN_KEY } from './authStorage';

const RECORD_SESSION_MUTATION = `
  mutation RecordSessionData($input: RecordSessionDataInput!) {
    recordSessionData(input: $input)
  }
`;

interface PageViewData {
  path: string;
  startTime: number;
  maxScrollDepth: number;
  // タブへ戻って同じ画面の続きを見ているぶん。閲覧数には数えない。
  resumed?: boolean;
}

interface PreparedPageView {
  path: string;
  durationSeconds: number;
  maxScrollDepth: number;
  resumed: boolean;
}

// keepalive で送れる本文は64KBまで。超えそうなときは通常の送信にする。
const KEEPALIVE_MAX_PAGE_VIEWS = 200;

interface Tracker {
  sessionStart: number;
  currentPage: PageViewData | null;
  completedPages: PageViewData[];
  // 送信に失敗したぶん。次の送信で一緒に送る。
  unsentPageViews: PreparedPageView[];
  unsentDurationSeconds: number;
}

const state: Tracker = {
  sessionStart: Date.now(),
  currentPage: null,
  completedPages: [],
  unsentPageViews: [],
  unsentDurationSeconds: 0,
};

function getCurrentScrollDepth(): number {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (docHeight <= 0) return 100;
  return Math.min(100, Math.round((scrollTop / docHeight) * 100));
}

function onScroll() {
  if (!state.currentPage) return;
  const depth = getCurrentScrollDepth();
  if (depth > state.currentPage.maxScrollDepth) {
    state.currentPage.maxScrollDepth = depth;
  }
}

export function trackPageEnter(path: string, resumed = false) {
  if (state.currentPage) {
    state.completedPages.push({ ...state.currentPage });
  }
  state.currentPage = { path, startTime: Date.now(), maxScrollDepth: getCurrentScrollDepth(), resumed };
}

export function trackPageLeave() {
  if (state.currentPage) {
    state.completedPages.push({ ...state.currentPage });
    state.currentPage = null;
  }
}

// サーバーは受け取った値を足し込むので、送ったぶんはここで手放す。残すと、タブを切り替えるたびや
// 離脱時（visibilitychange と beforeunload の両方が来る）に同じ閲覧を二重に数えてしまう。
async function flush() {
  if (state.currentPage) {
    state.completedPages.push({ ...state.currentPage });
    state.currentPage = null;
  }

  const token = localStorage.getItem(USER_TOKEN_KEY);
  if (!token || (state.completedPages.length === 0 && state.unsentPageViews.length === 0)) return;

  const now = Date.now();
  const pages = state.completedPages;
  state.completedPages = [];

  // 各ページの滞在時間は、次のページへ移った時刻までで数える。
  const pageViews = [
    ...state.unsentPageViews,
    ...pages.map((p, i) => {
      const next = pages[i + 1];
      const end = next ? next.startTime : now;
      return {
        path: p.path,
        durationSeconds: Math.round((end - p.startTime) / 1000),
        maxScrollDepth: p.maxScrollDepth,
        resumed: !!p.resumed,
      };
    }),
  ];
  const sessionDurationSeconds = state.unsentDurationSeconds + Math.round((now - state.sessionStart) / 1000);
  state.unsentPageViews = [];
  state.unsentDurationSeconds = 0;
  state.sessionStart = now;

  try {
    // 閉じるときも届くように keepalive を付ける。付けないとブラウザが送信を取り消すことがある。
    await request(
      RECORD_SESSION_MUTATION,
      { input: { sessionDurationSeconds, pageViews } },
      token,
      false,
      { keepalive: pageViews.length <= KEEPALIVE_MAX_PAGE_VIEWS },
    );
  } catch {
    state.unsentPageViews = pageViews;
    state.unsentDurationSeconds = sessionDurationSeconds;
  }
}

let initialized = false;

export function initSessionTracker() {
  if (initialized) return;
  initialized = true;
  window.addEventListener('scroll', onScroll, { passive: true });

  // タブ非表示・ページ離脱時にデータ送信
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void flush();
    } else {
      // 戻ってきたら、開いているページの記録と時間の計測をやり直す。
      state.sessionStart = Date.now();
      trackPageEnter(window.location.pathname, true);
    }
  });

  // navigator.sendBeacon より request を優先（JWTが必要なため）
  window.addEventListener('beforeunload', () => {
    void flush();
  });
}
