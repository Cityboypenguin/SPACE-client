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
}

interface Tracker {
  sessionStart: number;
  currentPage: PageViewData | null;
  completedPages: PageViewData[];
}

const state: Tracker = {
  sessionStart: Date.now(),
  currentPage: null,
  completedPages: [],
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

export function trackPageEnter(path: string) {
  if (state.currentPage) {
    state.completedPages.push({ ...state.currentPage });
  }
  state.currentPage = { path, startTime: Date.now(), maxScrollDepth: getCurrentScrollDepth() };
}

export function trackPageLeave() {
  if (state.currentPage) {
    state.completedPages.push({ ...state.currentPage });
    state.currentPage = null;
  }
}

async function flush() {
  if (state.currentPage) {
    state.completedPages.push({ ...state.currentPage });
    state.currentPage = null;
  }

  const token = localStorage.getItem(USER_TOKEN_KEY);
  if (!token || state.completedPages.length === 0) return;

  const sessionDurationSeconds = Math.round((Date.now() - state.sessionStart) / 1000);
  const pageViews = state.completedPages.map((p) => ({
    path: p.path,
    durationSeconds: Math.round((Date.now() - p.startTime) / 1000),
    maxScrollDepth: p.maxScrollDepth,
  }));

  // completedPagesの各ページの実際の滞在時間を計算
  const now = Date.now();
  const pvWithDuration = state.completedPages.map((p, i) => {
    const next = state.completedPages[i + 1];
    const end = next ? next.startTime : now;
    return {
      path: p.path,
      durationSeconds: Math.round((end - p.startTime) / 1000),
      maxScrollDepth: p.maxScrollDepth,
    };
  });

  try {
    await request(RECORD_SESSION_MUTATION, {
      input: { sessionDurationSeconds, pageViews: pvWithDuration.length > 0 ? pvWithDuration : pageViews },
    }, token);
  } catch {
    // セッションデータ送信失敗は無視
  }
}

export function initSessionTracker() {
  window.addEventListener('scroll', onScroll, { passive: true });

  // タブ非表示・ページ離脱時にデータ送信
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void flush();
    }
  });

  // navigator.sendBeacon より request を優先（JWTが必要なため）
  window.addEventListener('beforeunload', () => {
    void flush();
  });
}
