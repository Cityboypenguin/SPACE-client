/**
 * k6 負荷テストスクリプト
 *
 * 実行方法:
 *   brew install k6          # インストール
 *   k6 run perf/k6-load.js   # デフォルト（10VU × 30秒）
 *
 * 環境変数で制御できる:
 *   BASE_URL  : テスト対象URL (デフォルト: http://localhost:8080)
 *   USER_EMAIL, USER_PASSWORD: テスト用ユーザー認証情報
 *   VUS       : 同時接続数 (デフォルト: 10)
 *   DURATION  : 実行時間 (デフォルト: 30s)
 *
 * 例:
 *   BASE_URL=http://localhost:8080 \
 *   USER_EMAIL=ne241099@senshu-u.jp \
 *   USER_PASSWORD=somasoma \
 *   VUS=20 DURATION=60s \
 *   k6 run perf/k6-load.js
 *
 * Docker で実行する場合:
 *   docker run --rm -v $(pwd)/perf:/perf --network host \
 *     grafana/k6 run /perf/k6-load.js
 */

// @ts-check
import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// カスタムメトリクス
const errorRate = new Rate('error_rate');
const queryDuration = new Trend('graphql_query_duration', true);
const mutationDuration = new Trend('graphql_mutation_duration', true);

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const GRAPHQL_URL = `${BASE_URL}/query`;

export const options = {
  scenarios: {
    // 通常負荷: 段階的にVUを増やして定常状態を計測
    steady_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: parseInt(__ENV.VUS || '10') },  // ランプアップ
        { duration: __ENV.DURATION || '30s', target: parseInt(__ENV.VUS || '10') },  // 定常
        { duration: '10s', target: 0 },                             // ランプダウン
      ],
    },
  },
  thresholds: {
    // p95 が 500ms 以内
    http_req_duration: ['p(95)<500'],
    // エラー率 1% 未満
    error_rate: ['rate<0.01'],
    // GraphQL クエリの p95 が 500ms 以内
    graphql_query_duration: ['p(95)<500'],
    // GraphQL ミューテーションの p95 が 1000ms 以内
    graphql_mutation_duration: ['p(95)<1000'],
  },
};

/** GraphQL リクエストを送信してレスポンスをチェック */
const gql = (token, query, variables = {}, isMutation = false) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = http.post(
    GRAPHQL_URL,
    JSON.stringify({ query, variables }),
    { headers },
  );

  const ok = check(res, {
    'status is 200': (r) => r.status === 200,
    'no GraphQL errors': (r) => {
      try {
        const body = JSON.parse(r.body);
        return !body.errors || body.errors.length === 0;
      } catch {
        return false;
      }
    },
  });
  errorRate.add(!ok);

  if (isMutation) {
    mutationDuration.add(res.timings.duration);
  } else {
    queryDuration.add(res.timings.duration);
  }

  return res;
};

// セッション状態を保持するオブジェクト（VU ごと）
let userToken = null;

/** セットアップ: ログイン */
export const setup = () => {
  const email = __ENV.USER_EMAIL || 'ne241099@senshu-u.jp';
  const password = __ENV.USER_PASSWORD || 'somasoma';

  const res = http.post(
    GRAPHQL_URL,
    JSON.stringify({
      query: `mutation LoginUser($input: LoginInput!) {
        loginUser(input: $input) { token refreshToken user { ID } }
      }`,
      variables: { input: { email, password } },
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  const body = JSON.parse(res.body);
  if (body.errors || !body.data?.loginUser?.token) {
    console.error('ログイン失敗:', res.body);
    return { token: null, userID: null };
  }
  return {
    token: body.data.loginUser.token,
    userID: body.data.loginUser.user.ID,
  };
};

/** メインシナリオ */
export default function (data) {
  const token = data?.token;

  group('フィードの取得', () => {
    gql(
      token,
      `query GetPosts($limit: Int, $offset: Int) {
        topLevelPosts(limit: $limit, offset: $offset) {
          items {
            ID content createdAt
            user { ID name accountID }
            replyCount
          }
          total
        }
      }`,
      { limit: 20, offset: 0 },
    );
    sleep(0.5);
  });

  group('ユーザー検索', () => {
    gql(
      token,
      `query SearchUsers($keyword: String!) {
        searchUsers(keyword: $keyword) {
          items { ID name accountID }
        }
      }`,
      { keyword: 'test' },
    );
    sleep(0.3);
  });

  group('投稿検索', () => {
    gql(
      token,
      `query SearchPosts($keyword: String!) {
        searchPosts(keyword: $keyword) {
          ID content createdAt
          user { ID name }
        }
      }`,
      { keyword: 'test' },
    );
    sleep(0.3);
  });

  group('通知一覧の取得', () => {
    gql(
      token,
      `query MyNotifications($limit: Int) {
        myNotifications(limit: $limit) {
          items { ID type isRead createdAt }
          total
        }
      }`,
      { limit: 20 },
    );
    sleep(0.5);
  });

  // シナリオ間のスリープ（実際のユーザー行動を模倣）
  sleep(Math.random() * 2 + 1);
}
