import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import { ADMIN_TOKEN_KEY } from '../../../lib/authStorage';

export type PageViewStat = {
  pagePath: string;
  avgDurationSeconds: number;
  avgMaxScrollDepth: number;
  totalViews: number;
};

export type AnalyticsSummary = {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  frozenUsersCount: number;
  totalPosts: number;
  totalComments: number;
  totalDeletedPosts: number;
  totalLikes: number;
  totalCommunities: number;
  totalMessages: number;
  totalReports: number;
  totalBlocks: number;
  totalInquiries: number;
  currentActiveUsers: number;
  dau: number;
  wau: number;
  mau: number;
  dauMauRatio: number;
  postsToday: number;
  commentsToday: number;
  messagesToday: number;
  avgLikesPerPost: number;
  avgCommentsPerPost: number;
  postsTextOnly: number;
  postsWithImage: number;
  postsWithVideo: number;
  uniqueDMSenders: number;
  activeCommunitiesLast30Days: number;
  avgCommunityMembers: number;
  avgCommunitiesPerUser: number;
  totalFollows: number;
  avgFollowersPerUser: number;
  avgFollowingPerUser: number;
  usersWithProfile: number;
  usersWithAvatar: number;
  usersWithPost: number;
  onboardingCompleteRate: number;
  avgTimeToFirstPostMinutes: number;
  totalNotifications: number;
  readNotifications: number;
  notificationReadRate: number;
  pendingReports: number;
  resolvedReports: number;
  webSocketConnections: number;
  sseConnections: number;
  errorRate5xx: number;
  p50ResponseTimeMs: number;
  p95ResponseTimeMs: number;
  p99ResponseTimeMs: number;
  avgSessionDurationSeconds: number;
  avgSessionsPerDay: number;
  avgScrollDepth: number;
  pageViewStats: PageViewStat[];
};

export type CommunityStatItem = {
  communityID: string;
  name: string;
  memberCount: number;
  messageCount: number;
};

export type CommunityStatsPage = {
  items: CommunityStatItem[];
  total: number;
};

const AdminGetAnalyticsDocument = graphql(`
  query AdminGetAnalytics {
    adminGetAnalytics {
      totalUsers newUsersToday newUsersThisWeek newUsersThisMonth frozenUsersCount
      totalPosts totalComments totalDeletedPosts totalLikes totalCommunities
      totalMessages totalReports totalBlocks totalInquiries
      currentActiveUsers dau wau mau dauMauRatio
      postsToday commentsToday messagesToday
      avgLikesPerPost avgCommentsPerPost
      postsTextOnly postsWithImage postsWithVideo
      uniqueDMSenders
      activeCommunitiesLast30Days avgCommunityMembers avgCommunitiesPerUser
      totalFollows avgFollowersPerUser avgFollowingPerUser
      usersWithProfile usersWithAvatar usersWithPost
      onboardingCompleteRate avgTimeToFirstPostMinutes
      totalNotifications readNotifications notificationReadRate
      pendingReports resolvedReports
      webSocketConnections sseConnections errorRate5xx p50ResponseTimeMs p95ResponseTimeMs p99ResponseTimeMs
      avgSessionDurationSeconds avgSessionsPerDay avgScrollDepth
      pageViewStats { pagePath avgDurationSeconds avgMaxScrollDepth totalViews }
    }
  }
`);

const AdminGetCommunityAnalyticsDocument = graphql(`
  query AdminGetCommunityAnalytics($limit: Int, $offset: Int) {
    adminGetCommunityAnalytics(limit: $limit, offset: $offset) {
      items { communityID name memberCount messageCount }
      total
    }
  }
`);

export async function getAnalytics(): Promise<AnalyticsSummary> {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;
  const data = await requestDoc(AdminGetAnalyticsDocument, {}, token);
  return data.adminGetAnalytics;
}

export type TimeSeriesGranularity = 'day' | 'hour';

export type TimeSeriesPoint = {
  label: string;
  posts: number;
  comments: number;
  messages: number;
  newUsers: number;
  likes: number;
  activeUsers: number;
};

const AdminGetTimeSeriesDocument = graphql(`
  query AdminGetTimeSeries($granularity: TimeSeriesGranularity!, $from: String!, $to: String!) {
    adminGetTimeSeries(granularity: $granularity, from: $from, to: $to) {
      points { label posts comments messages newUsers likes activeUsers }
    }
  }
`);

export async function getTimeSeries(granularity: TimeSeriesGranularity, from: string, to: string): Promise<TimeSeriesPoint[]> {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;
  const data = await requestDoc(AdminGetTimeSeriesDocument, { granularity, from, to }, token);
  return data.adminGetTimeSeries.points;
}

export async function getCommunityAnalytics(limit = 20, offset = 0): Promise<CommunityStatsPage> {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;
  const data = await requestDoc(AdminGetCommunityAnalyticsDocument, { limit, offset }, token);
  return data.adminGetCommunityAnalytics;
}
