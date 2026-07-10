/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type CommunityMemberAction =
  | 'DEMOTE'
  | 'KICK'
  | 'PROMOTE';

export type CommunityMemberUpdateInput = {
  action: CommunityMemberAction;
  userID: string | number;
};

export type CreateAdministratorInput = {
  email: string;
  name: string;
  password: string;
};

export type CreateAnnouncementInput = {
  body: string;
  title: string;
};

export type CreateCommunityInput = {
  avatarKey?: string | null | undefined;
  description: string;
  name: string;
};

export type CreateFavoriteInput = {
  post_id: string | number;
};

export type CreateInquiryInput = {
  category: InquiryCategory;
  content: string;
  email: string;
  name: string;
  subject: string;
};

export type CreatePostInput = {
  content: string;
  mediaInputs?: Array<MediaUploadInput> | null | undefined;
  parent_id?: string | number | null | undefined;
};

export type CreateReportInput = {
  customReason?: string | null | undefined;
  reason: string;
  targetID: string | number;
  targetType: ReportTargetType;
};

export type CreateTermsOfServiceInput = {
  effectiveDate: string;
  objectKey: string;
  version: string;
};

export type CreateUserInput = {
  accountID: string;
  email: string;
  name: string;
  otp: string;
  password: string;
};

export type DeleteFavoriteInput = {
  post_id: string | number;
};

export type InquiryCategory =
  | 'COMMUNITY'
  | 'DM'
  | 'LOGIN'
  | 'OTHER'
  | 'PASSWORD'
  | 'POST';

export type InquiryStatus =
  | 'IN_PROGRESS'
  | 'PENDING'
  | 'RESOLVED';

export type LoginInput = {
  email: string;
  password: string;
};

export type MediaUploadInput = {
  contentType: string;
  objectKey: string;
};

export type RemoveUserFromRoomInput = {
  roomID: string | number;
  userID: string | number;
};

export type ReportSearchFilter = {
  reporterID?: string | number | null | undefined;
  status?: ReportStatus | null | undefined;
  targetType?: ReportTargetType | null | undefined;
};

export type ReportStatus =
  | 'DISMISSED'
  | 'PENDING'
  | 'RESOLVED'
  | 'REVIEWING';

export type ReportTargetType =
  | 'COMMUNITY'
  | 'POST'
  | 'USER';

export type TimeSeriesGranularity =
  | 'day'
  | 'hour';

export type UpdateAdministratorInput = {
  email?: string | null | undefined;
  name?: string | null | undefined;
  password?: string | null | undefined;
};

export type UpdateAnnouncementInput = {
  body: string;
  title: string;
};

export type UpdateCommunityInput = {
  avatarKey?: string | null | undefined;
  description?: string | null | undefined;
  name?: string | null | undefined;
};

export type UpdatePostInput = {
  content: string;
  deletedMediaIDs?: Array<string | number> | null | undefined;
  id: string | number;
  newMediaInputs?: Array<MediaUploadInput> | null | undefined;
};

export type UpdateProfileInput = {
  bio?: string | null | undefined;
  username?: string | null | undefined;
};

export type UpdateUserInput = {
  accountID?: string | null | undefined;
  currentPassword?: string | null | undefined;
  email?: string | null | undefined;
  name?: string | null | undefined;
  password?: string | null | undefined;
};

export type CreateAdministratorMutationVariables = Exact<{
  input: CreateAdministratorInput;
}>;


export type CreateAdministratorMutation = { createAdministrator: { ID: string, name: string, email: string } };

export type GetAdministratorByIdQueryVariables = Exact<{
  id: string | number;
}>;


export type GetAdministratorByIdQuery = { getAdministratorByID: { ID: string, name: string, email: string } | null };

export type SearchAdministratorsQueryVariables = Exact<{
  name: string;
}>;


export type SearchAdministratorsQuery = { searchAdministrators: Array<{ ID: string, name: string, email: string }> };

export type AdministratorsQueryVariables = Exact<{
  limit?: number | null | undefined;
  offset?: number | null | undefined;
}>;


export type AdministratorsQuery = { administrators: { total: number, items: Array<{ ID: string, name: string, email: string }> } };

export type DeleteAdministratorMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteAdministratorMutation = { deleteAdministrator: boolean };

export type UpdateAdministratorMutationVariables = Exact<{
  id: string | number;
  input: UpdateAdministratorInput;
}>;


export type UpdateAdministratorMutation = { updateAdministrator: { ID: string, name: string, email: string } };

export type AdminGetAnalyticsQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminGetAnalyticsQuery = { adminGetAnalytics: { totalUsers: number, newUsersToday: number, newUsersThisWeek: number, newUsersThisMonth: number, frozenUsersCount: number, totalPosts: number, totalComments: number, totalDeletedPosts: number, totalLikes: number, totalCommunities: number, totalMessages: number, totalReports: number, totalBlocks: number, totalInquiries: number, currentActiveUsers: number, dau: number, wau: number, mau: number, dauMauRatio: number, postsToday: number, commentsToday: number, messagesToday: number, avgLikesPerPost: number, avgCommentsPerPost: number, postsTextOnly: number, postsWithImage: number, postsWithVideo: number, uniqueDMSenders: number, activeCommunitiesLast30Days: number, avgCommunityMembers: number, avgCommunitiesPerUser: number, totalFollows: number, avgFollowersPerUser: number, avgFollowingPerUser: number, usersWithProfile: number, usersWithAvatar: number, usersWithPost: number, onboardingCompleteRate: number, avgTimeToFirstPostMinutes: number, totalNotifications: number, readNotifications: number, notificationReadRate: number, pendingReports: number, resolvedReports: number, webSocketConnections: number, sseConnections: number, errorRate5xx: number, p50ResponseTimeMs: number, p95ResponseTimeMs: number, p99ResponseTimeMs: number, avgSessionDurationSeconds: number, avgSessionsPerDay: number, avgScrollDepth: number, pageViewStats: Array<{ pagePath: string, avgDurationSeconds: number, avgMaxScrollDepth: number, totalViews: number }> } };

export type AdminGetCommunityAnalyticsQueryVariables = Exact<{
  limit?: number | null | undefined;
  offset?: number | null | undefined;
}>;


export type AdminGetCommunityAnalyticsQuery = { adminGetCommunityAnalytics: { total: number, items: Array<{ communityID: string, name: string, memberCount: number, messageCount: number }> } };

export type AdminGetTimeSeriesQueryVariables = Exact<{
  granularity: TimeSeriesGranularity;
  from: string;
  to: string;
}>;


export type AdminGetTimeSeriesQuery = { adminGetTimeSeries: { points: Array<{ label: string, posts: number, comments: number, messages: number, newUsers: number, likes: number, activeUsers: number }> } };

export type GetAnnouncementQueryVariables = Exact<{
  id: string | number;
}>;


export type GetAnnouncementQuery = { announcement: { ID: string, title: string, body: string, createdAt: string } };

export type AdminListAnnouncementsQueryVariables = Exact<{
  limit?: number | null | undefined;
  offset?: number | null | undefined;
}>;


export type AdminListAnnouncementsQuery = { adminListAnnouncements: { total: number, items: Array<{ ID: string, title: string, body: string, createdAt: string }> } };

export type CreateAnnouncementMutationVariables = Exact<{
  input: CreateAnnouncementInput;
}>;


export type CreateAnnouncementMutation = { createAnnouncement: { ID: string, title: string, body: string, createdAt: string } };

export type UpdateAnnouncementMutationVariables = Exact<{
  id: string | number;
  input: UpdateAnnouncementInput;
}>;


export type UpdateAnnouncementMutation = { updateAnnouncement: { ID: string, title: string, body: string, createdAt: string, updatedAt: string } };

export type DeleteAnnouncementMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteAnnouncementMutation = { deleteAnnouncement: boolean };

export type LoginAdminMutationVariables = Exact<{
  input: LoginInput;
}>;


export type LoginAdminMutation = { loginAdministrator: { token: string, refreshToken: string, administrator: { ID: string, name: string, email: string } } };

export type LogoutAdminMutationVariables = Exact<{
  token: string;
}>;


export type LogoutAdminMutation = { logoutAdministrator: boolean };

export type CommunitiesQueryVariables = Exact<{
  limit?: number | null | undefined;
  offset?: number | null | undefined;
}>;


export type CommunitiesQuery = { communities: { total: number, items: Array<{ ID: string, roomID: string, name: string, description: string, createdAt: string, updatedAt: string }> } };

export type AdminUpdateCommunityMutationVariables = Exact<{
  id: string | number;
  input: UpdateCommunityInput;
}>;


export type AdminUpdateCommunityMutation = { updateCommunity: { ID: string, roomID: string, name: string, description: string, createdAt: string, updatedAt: string } };

export type KickUserFromCommunityMutationVariables = Exact<{
  communityID: string | number;
  userID: string | number;
}>;


export type KickUserFromCommunityMutation = { kickUserFromCommunity: boolean };

export type AdminGetRoomQueryVariables = Exact<{
  id: string | number;
}>;


export type AdminGetRoomQuery = { room: { ID: string, name: string, user: Array<{ ID: string, accountID: string, name: string, email: string }> } | null };

export type AdminGetCommunityMembersQueryVariables = Exact<{
  communityID: string | number;
}>;


export type AdminGetCommunityMembersQuery = { getCommunityMembers: Array<{ role: string, user: { ID: string, accountID: string, name: string, email: string } }> };

export type AdminListMessagesQueryVariables = Exact<{
  roomID: string | number;
  limit?: number | null | undefined;
}>;


export type AdminListMessagesQuery = { messages: { items: Array<{ ID: string, roomID: string, content: string, createdAt: string, updatedAt: string, user: { ID: string, name: string, accountID: string, avatarUrl: string | null }, media: Array<{ ID: string, url: string, contentType: string }> }> } };

export type PromoteToCommunityOwnerMutationVariables = Exact<{
  communityID: string | number;
  userID: string | number;
}>;


export type PromoteToCommunityOwnerMutation = { promoteToCommunityOwner: boolean };

export type DemoteFromCommunityOwnerMutationVariables = Exact<{
  communityID: string | number;
  userID: string | number;
}>;


export type DemoteFromCommunityOwnerMutation = { demoteFromCommunityOwner: boolean };

export type DeleteMessageMutationVariables = Exact<{
  roomID: string | number;
  id: string | number;
}>;


export type DeleteMessageMutation = { deleteMessage: boolean };

export type SearchInquiriesQueryVariables = Exact<{
  status?: InquiryStatus | null | undefined;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
}>;


export type SearchInquiriesQuery = { searchInquiries: { total: number, items: Array<{ id: string, name: string, email: string, category: InquiryCategory, subject: string, content: string, status: InquiryStatus, createdAt: string, updatedAt: string }> } };

export type GetInquiryQueryVariables = Exact<{
  id: string | number;
}>;


export type GetInquiryQuery = { getInquiry: { id: string, name: string, email: string, category: InquiryCategory, subject: string, content: string, status: InquiryStatus, createdAt: string, updatedAt: string } | null };

export type UpdateInquiryStatusMutationVariables = Exact<{
  id: string | number;
  status: InquiryStatus;
}>;


export type UpdateInquiryStatusMutation = { updateInquiryStatus: { id: string, status: InquiryStatus } };

export type ToggleMaintenanceModeMutationVariables = Exact<{
  enabled: boolean;
}>;


export type ToggleMaintenanceModeMutation = { toggleMaintenanceMode: boolean };

export type MaintenanceModeQueryVariables = Exact<{ [key: string]: never; }>;


export type MaintenanceModeQuery = { maintenanceMode: boolean };

export type AdminPostFieldsFragment = { ID: string, content: string, createdAt: string, updatedAt: string, deletedAt: string | null, replyCount: number, user: { ID: string, name: string, accountID: string, avatarUrl: string | null }, favorites: Array<{ ID: string, user: { ID: string } }>, media: Array<{ ID: string, url: string, contentType: string, createdAt: string }> };

export type GetAdminPostsQueryVariables = Exact<{
  limit?: number | null | undefined;
  offset?: number | null | undefined;
}>;


export type GetAdminPostsQuery = { posts: { total: number, items: Array<{ ID: string, content: string, createdAt: string, updatedAt: string, deletedAt: string | null, replyCount: number, replies: Array<{ ID: string }>, user: { ID: string, name: string, accountID: string, avatarUrl: string | null }, favorites: Array<{ ID: string, user: { ID: string } }>, media: Array<{ ID: string, url: string, contentType: string, createdAt: string }> }> } };

export type GetPostByIdIncludeDeletedQueryVariables = Exact<{
  id: string | number;
}>;


export type GetPostByIdIncludeDeletedQuery = { getPostByIDIncludeDeleted: { ID: string, content: string, createdAt: string, updatedAt: string, deletedAt: string | null, replyCount: number, rootPost: { ID: string, content: string, createdAt: string, updatedAt: string, deletedAt: string | null, replyCount: number, user: { ID: string, name: string, accountID: string, avatarUrl: string | null }, favorites: Array<{ ID: string, user: { ID: string } }>, media: Array<{ ID: string, url: string, contentType: string, createdAt: string }> } | null, replies: Array<{ ID: string, content: string, createdAt: string, updatedAt: string, deletedAt: string | null, replyCount: number, replies: Array<{ ID: string, content: string, createdAt: string, updatedAt: string, deletedAt: string | null, replyCount: number, replies: Array<{ ID: string, content: string, createdAt: string, updatedAt: string, deletedAt: string | null, replyCount: number, replies: Array<{ ID: string, content: string, createdAt: string, updatedAt: string, deletedAt: string | null, replyCount: number, replies: Array<{ ID: string }>, user: { ID: string, name: string, accountID: string, avatarUrl: string | null }, favorites: Array<{ ID: string, user: { ID: string } }>, media: Array<{ ID: string, url: string, contentType: string, createdAt: string }> }>, user: { ID: string, name: string, accountID: string, avatarUrl: string | null }, favorites: Array<{ ID: string, user: { ID: string } }>, media: Array<{ ID: string, url: string, contentType: string, createdAt: string }> }>, user: { ID: string, name: string, accountID: string, avatarUrl: string | null }, favorites: Array<{ ID: string, user: { ID: string } }>, media: Array<{ ID: string, url: string, contentType: string, createdAt: string }> }>, user: { ID: string, name: string, accountID: string, avatarUrl: string | null }, favorites: Array<{ ID: string, user: { ID: string } }>, media: Array<{ ID: string, url: string, contentType: string, createdAt: string }> }>, user: { ID: string, name: string, accountID: string, avatarUrl: string | null }, favorites: Array<{ ID: string, user: { ID: string } }>, media: Array<{ ID: string, url: string, contentType: string, createdAt: string }> } | null };

export type AdminDeletePostMutationVariables = Exact<{
  id: string | number;
}>;


export type AdminDeletePostMutation = { adminDeletePost: boolean };

export type AdminGetBlockersQueryVariables = Exact<{
  userID: string | number;
}>;


export type AdminGetBlockersQuery = { adminGetBlockers: Array<{ ID: string, name: string, accountID: string, avatarUrl: string | null }> };

export type AdminGetFavoriteUsersQueryVariables = Exact<{
  userID: string | number;
}>;


export type AdminGetFavoriteUsersQuery = { adminGetFavoriteUsers: Array<{ ID: string, name: string, accountID: string, avatarUrl: string | null }> };

export type SearchReportsQueryVariables = Exact<{
  filter?: ReportSearchFilter | null | undefined;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
}>;


export type SearchReportsQuery = { searchReports: { total: number, items: Array<{ ID: string, targetType: ReportTargetType, targetID: string, reason: string, customReason: string | null, content: string | null, status: ReportStatus, createdAt: string }> } };

export type UpdateReportStatusMutationVariables = Exact<{
  id: string | number;
  status: ReportStatus;
}>;


export type UpdateReportStatusMutation = { updateReportStatus: { ID: string, status: ReportStatus } };

export type AdminCreateReportMutationVariables = Exact<{
  input: CreateReportInput;
}>;


export type AdminCreateReportMutation = { createReport: { ID: string, status: ReportStatus } };

export type GetReportServiceStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type GetReportServiceStatusQuery = { isReportServiceEnabled: boolean };

export type SetReportServiceStatusMutationVariables = Exact<{
  enabled: boolean;
}>;


export type SetReportServiceStatusMutation = { setReportServiceStatus: boolean };

export type PresignedTermsDocumentUploadUrlQueryVariables = Exact<{ [key: string]: never; }>;


export type PresignedTermsDocumentUploadUrlQuery = { presignedTermsDocumentUploadUrl: { uploadUrl: string, objectKey: string } };

export type AdminListTermsQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminListTermsQuery = { adminListTerms: Array<{ ID: string, version: string, documentUrl: string, effectiveDate: string, createdAt: string }> };

export type AdminListConsentsQueryVariables = Exact<{
  termsID: string | number;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
}>;


export type AdminListConsentsQuery = { adminListConsents: { total: number, items: Array<{ ID: string, consentedAt: string, user: { ID: string, accountID: string, name: string, email: string } }> } };

export type CreateTermsOfServiceMutationVariables = Exact<{
  input: CreateTermsOfServiceInput;
}>;


export type CreateTermsOfServiceMutation = { createTermsOfService: { ID: string, version: string, documentUrl: string, effectiveDate: string, createdAt: string } };

export type UsersQueryVariables = Exact<{
  limit?: number | null | undefined;
  offset?: number | null | undefined;
}>;


export type UsersQuery = { users: { total: number, items: Array<{ ID: string, accountID: string, name: string, email: string, role: string, status: string, createdAt: string, updatedAt: string }> } };

export type AdminSearchUsersQueryVariables = Exact<{
  keyword: string;
}>;


export type AdminSearchUsersQuery = { searchUsers: { total: number, items: Array<{ ID: string, accountID: string, name: string, email: string, role: string, status: string, createdAt: string, updatedAt: string }> } };

export type GetUserByIdQueryVariables = Exact<{
  id: string | number;
}>;


export type GetUserByIdQuery = { getUserByID: { ID: string, accountID: string, name: string, email: string, role: string, status: string, createdAt: string, updatedAt: string } | null };

export type DeleteUserMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteUserMutation = { deleteUser: boolean };

export type FreezeUserMutationVariables = Exact<{
  id: string | number;
}>;


export type FreezeUserMutation = { freezeUser: boolean };

export type UnfreezeUserMutationVariables = Exact<{
  id: string | number;
}>;


export type UnfreezeUserMutation = { unfreezeUser: boolean };

export type AdminUpdateUserMutationVariables = Exact<{
  id: string | number;
  input: UpdateUserInput;
}>;


export type AdminUpdateUserMutation = { adminUpdateUser: { ID: string, accountID: string, name: string, email: string, role: string, status: string, createdAt: string, updatedAt: string } };

export type AdminUpdateProfileMutationVariables = Exact<{
  userID: string | number;
  input: UpdateProfileInput;
}>;


export type AdminUpdateProfileMutation = { adminUpdateProfile: { username: string, bio: string | null, avatarUrl: string | null, createdAt: string, updatedAt: string, user: { ID: string, accountID: string, name: string, email: string, role: string, status: string } } };

export type AdminGetProfileByUserIdQueryVariables = Exact<{
  userID: string | number;
}>;


export type AdminGetProfileByUserIdQuery = { getProfileByUserID: { username: string, bio: string | null, avatarUrl: string | null, createdAt: string, updatedAt: string, user: { ID: string, accountID: string, name: string, email: string, role: string, status: string } } | null };

export type ListAnnouncementsQueryVariables = Exact<{
  limit?: number | null | undefined;
  offset?: number | null | undefined;
}>;


export type ListAnnouncementsQuery = { announcements: { total: number, items: Array<{ ID: string, title: string, body: string, createdAt: string }> } };

export type LoginUserMutationVariables = Exact<{
  input: LoginInput;
}>;


export type LoginUserMutation = { loginUser: { token: string, refreshToken: string, user: { ID: string, accountID: string, name: string, email: string, role: string, status: string } } };

export type LogoutUserMutationVariables = Exact<{
  token: string;
}>;


export type LogoutUserMutation = { logoutUser: boolean };

export type SendEmailOtpMutationVariables = Exact<{
  email: string;
}>;


export type SendEmailOtpMutation = { sendEmailOTP: boolean };

export type VerifyEmailOtpMutationVariables = Exact<{
  email: string;
  otp: string;
}>;


export type VerifyEmailOtpMutation = { verifyEmailOTP: boolean };

export type CreateUserMutationVariables = Exact<{
  input: CreateUserInput;
}>;


export type CreateUserMutation = { createUser: { ID: string, accountID: string, name: string, email: string, role: string, status: string } };

export type RequestPasswordResetMutationVariables = Exact<{
  email: string;
}>;


export type RequestPasswordResetMutation = { requestPasswordReset: boolean };

export type VerifyPasswordResetOtpMutationVariables = Exact<{
  email: string;
  otp: string;
}>;


export type VerifyPasswordResetOtpMutation = { verifyPasswordResetOTP: string };

export type ResetPasswordMutationVariables = Exact<{
  resetToken: string;
  newPassword: string;
}>;


export type ResetPasswordMutation = { resetPassword: boolean };

export type GetBlockersByUserIdQueryVariables = Exact<{
  userID: string | number;
}>;


export type GetBlockersByUserIdQuery = { GetBlockersByUserID: Array<{ ID: string, name: string, accountID: string, avatarUrl: string | null }> };

export type CreateBlockerMutationVariables = Exact<{
  blockedUserID: string | number;
}>;


export type CreateBlockerMutation = { createBlocker: { ID: string, userID: string, blockedUserID: string, createdAt: string } };

export type DeleteBlockerMutationVariables = Exact<{
  blockedUserID: string | number;
}>;


export type DeleteBlockerMutation = { deleteBlocker: boolean };

export type ListBlockedUsersQueryVariables = Exact<{
  limit?: number | null | undefined;
  offset?: number | null | undefined;
}>;


export type ListBlockedUsersQuery = { listBlockedUsers: { total: number, items: Array<{ ID: string, name: string, accountID: string, avatarUrl: string | null }> } };

export type MyCommunitiesQueryVariables = Exact<{
  limit?: number | null | undefined;
  offset?: number | null | undefined;
}>;


export type MyCommunitiesQuery = { myCommunities: { total: number, items: Array<{ ID: string, roomID: string, name: string, description: string, avatarURL: string, memberCount: number, isMember: boolean, unreadCount: number, lastMessage: string | null, createdAt: string, updatedAt: string }> } };

export type SearchCommunitiesQueryVariables = Exact<{
  name: string;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
}>;


export type SearchCommunitiesQuery = { searchCommunities: { total: number, items: Array<{ ID: string, roomID: string, name: string, description: string, avatarURL: string, memberCount: number, isMember: boolean, createdAt: string, updatedAt: string }> } };

export type CreateCommunityMutationVariables = Exact<{
  input: CreateCommunityInput;
}>;


export type CreateCommunityMutation = { createCommunity: { ID: string, roomID: string, name: string, description: string, avatarURL: string, memberCount: number, isMember: boolean, createdAt: string, updatedAt: string } };

export type JoinRoomMutationVariables = Exact<{
  roomID: string | number;
}>;


export type JoinRoomMutation = { joinRoom: boolean };

export type RemoveUserFromRoomMutationVariables = Exact<{
  input: RemoveUserFromRoomInput;
}>;


export type RemoveUserFromRoomMutation = { removeUserFromRoom: boolean };

export type GetMyRoleInCommunityQueryVariables = Exact<{
  communityID: string | number;
}>;


export type GetMyRoleInCommunityQuery = { getMyRoleInCommunity: string };

export type GetCommunityMembersQueryVariables = Exact<{
  communityID: string | number;
}>;


export type GetCommunityMembersQuery = { getCommunityMembers: Array<{ role: string, user: { ID: string, accountID: string, name: string, email: string, avatarUrl: string | null } }> };

export type UpdateCommunityMutationVariables = Exact<{
  id: string | number;
  input: UpdateCommunityInput;
}>;


export type UpdateCommunityMutation = { updateCommunity: { ID: string, roomID: string, name: string, description: string, avatarURL: string, memberCount: number, isMember: boolean, createdAt: string, updatedAt: string } };

export type UpdateCommunityMembersMutationVariables = Exact<{
  communityID: string | number;
  updates: Array<CommunityMemberUpdateInput> | CommunityMemberUpdateInput;
}>;


export type UpdateCommunityMembersMutation = { updateCommunityMembers: boolean };

export type RandomCommunitiesQueryVariables = Exact<{
  limit: number;
}>;


export type RandomCommunitiesQuery = { randomCommunities: Array<{ ID: string, roomID: string, name: string, description: string, avatarURL: string, memberCount: number, isMember: boolean, createdAt: string, updatedAt: string }> };

export type PresignedCommunityIconUploadUrlQueryVariables = Exact<{
  contentType: string;
}>;


export type PresignedCommunityIconUploadUrlQuery = { presignedCommunityIconUploadUrl: { uploadUrl: string, objectKey: string } };

export type MyUnreadCommunityCountQueryVariables = Exact<{ [key: string]: never; }>;


export type MyUnreadCommunityCountQuery = { myUnreadCommunityCount: number };

export type GetFavoriteUsersByUserIdQueryVariables = Exact<{
  userID: string | number;
}>;


export type GetFavoriteUsersByUserIdQuery = { GetFavoriteUsersByUserID: Array<{ ID: string, name: string, accountID: string, avatarUrl: string | null }> };

export type CreateFavoriteUserMutationVariables = Exact<{
  favoriteUserID: string | number;
}>;


export type CreateFavoriteUserMutation = { createFavoriteUser: { ID: string, userID: string, favoriteUserID: string, createdAt: string } };

export type DeleteFavoriteUserMutationVariables = Exact<{
  favoriteUserID: string | number;
}>;


export type DeleteFavoriteUserMutation = { deleteFavoriteUser: boolean };

export type ListFavoriteUsersQueryVariables = Exact<{
  limit?: number | null | undefined;
  offset?: number | null | undefined;
}>;


export type ListFavoriteUsersQuery = { listFavoriteUsers: { total: number, items: Array<{ ID: string, name: string, accountID: string, avatarUrl: string | null }> } };

export type MyFollowersQueryVariables = Exact<{
  limit?: number | null | undefined;
  offset?: number | null | undefined;
}>;


export type MyFollowersQuery = { myFollowers: { total: number, items: Array<{ ID: string, name: string, accountID: string, avatarUrl: string | null }> } };

export type CreateInquiryMutationVariables = Exact<{
  input: CreateInquiryInput;
}>;


export type CreateInquiryMutation = { createInquiry: { id: string, name: string, email: string, category: InquiryCategory, subject: string, content: string, createdAt: string } };

export type MarkRoomAsReadMutationVariables = Exact<{
  roomID: string | number;
}>;


export type MarkRoomAsReadMutation = { markRoomAsRead: boolean };

export type GetOrCreateDmRoomMutationVariables = Exact<{
  targetUserID: string | number;
}>;


export type GetOrCreateDmRoomMutation = { getOrCreateDMRoom: { ID: string, name: string, type: string, isMessagingDisabled: boolean, lastReadAt: string | null, unreadCount: number, partnerLastReadAt: string | null, content: string | null, user: Array<{ ID: string, name: string, accountID: string, avatarUrl: string | null }> } };

export type SendMessageMutationVariables = Exact<{
  roomID: string | number;
  content: string;
  mediaInputs?: Array<MediaUploadInput> | MediaUploadInput | null | undefined;
}>;


export type SendMessageMutation = { sendMessage: { ID: string, roomID: string, content: string, createdAt: string, updatedAt: string, user: { ID: string, name: string, accountID: string, avatarUrl: string | null }, media: Array<{ ID: string, url: string, contentType: string }> } };

export type UpdateMessageMutationVariables = Exact<{
  roomID: string | number;
  id: string | number;
  content: string;
}>;


export type UpdateMessageMutation = { updateMessage: { ID: string, roomID: string, content: string, createdAt: string, updatedAt: string, user: { ID: string, name: string, accountID: string, avatarUrl: string | null }, media: Array<{ ID: string, url: string, contentType: string }> } };

export type DeleteRoomMutationVariables = Exact<{
  roomID: string | number;
}>;


export type DeleteRoomMutation = { deleteRoom: boolean };

export type ListMessagesQueryVariables = Exact<{
  roomID: string | number;
  limit?: number | null | undefined;
  before?: string | number | null | undefined;
  after?: string | number | null | undefined;
  afterTime?: string | null | undefined;
}>;


export type ListMessagesQuery = { messages: { hasMoreBefore: boolean, hasMoreAfter: boolean, items: Array<{ ID: string, roomID: string, content: string, createdAt: string, updatedAt: string, user: { ID: string, name: string, accountID: string, avatarUrl: string | null }, media: Array<{ ID: string, url: string, contentType: string }> }> } };

export type GetRoomQueryVariables = Exact<{
  id: string | number;
}>;


export type GetRoomQuery = { room: { ID: string, name: string, type: string, isMessagingDisabled: boolean, lastReadAt: string | null, unreadCount: number, partnerLastReadAt: string | null, content: string | null, user: Array<{ ID: string, name: string, accountID: string, avatarUrl: string | null }> } | null };

export type MyDmRoomsQueryVariables = Exact<{
  limit?: number | null | undefined;
  offset?: number | null | undefined;
}>;


export type MyDmRoomsQuery = { myDMRooms: { total: number, items: Array<{ ID: string, name: string, type: string, isMessagingDisabled: boolean, lastReadAt: string | null, unreadCount: number, partnerLastReadAt: string | null, content: string | null, user: Array<{ ID: string, name: string, accountID: string, avatarUrl: string | null }> }> } };

export type PresignedMediaUploadUrlQueryVariables = Exact<{
  contentType: string;
}>;


export type PresignedMediaUploadUrlQuery = { presignedMediaUploadUrl: { uploadUrl: string, objectKey: string } };

export type MyUnreadDmCountQueryVariables = Exact<{ [key: string]: never; }>;


export type MyUnreadDmCountQuery = { myUnreadDMCount: number };

export type MyNotificationsQueryVariables = Exact<{
  limit?: number | null | undefined;
  offset?: number | null | undefined;
  type?: string | null | undefined;
  actorID?: string | number | null | undefined;
}>;


export type MyNotificationsQuery = { myNotifications: { total: number, items: Array<{ ID: string, type: string, targetType: string | null, targetID: string | null, message: string, isRead: boolean, createdAt: string, actor: { ID: string, name: string, accountID: string, avatarUrl: string | null } | null, targetPost: { ID: string, content: string, deletedAt: string | null, user: { ID: string, name: string, accountID: string }, media: Array<{ ID: string, url: string, contentType: string }> } | null }> } };

export type MyNotificationGroupsQueryVariables = Exact<{
  limit?: number | null | undefined;
  offset?: number | null | undefined;
}>;


export type MyNotificationGroupsQuery = { myNotificationGroups: { total: number, items: Array<{ key: string, type: string, targetType: string | null, targetID: string | null, message: string, createdAt: string, count: number, unreadCount: number, latestID: string, actor: { ID: string, name: string, accountID: string, avatarUrl: string | null } | null, targetPost: { ID: string, content: string, deletedAt: string | null, user: { ID: string, name: string, accountID: string }, media: Array<{ ID: string, url: string, contentType: string }> } | null }> } };

export type NotificationQueryVariables = Exact<{
  id: string | number;
}>;


export type NotificationQuery = { notification: { ID: string, type: string, targetType: string | null, targetID: string | null, message: string, isRead: boolean, createdAt: string, actor: { ID: string, name: string, accountID: string, avatarUrl: string | null } | null, targetPost: { ID: string, content: string, deletedAt: string | null, user: { ID: string, name: string, accountID: string }, media: Array<{ ID: string, url: string, contentType: string }> } | null } | null };

export type MyUnreadNotificationCountQueryVariables = Exact<{ [key: string]: never; }>;


export type MyUnreadNotificationCountQuery = { myUnreadNotificationCount: number };

export type MarkNotificationAsReadMutationVariables = Exact<{
  id: string | number;
}>;


export type MarkNotificationAsReadMutation = { markNotificationAsRead: boolean };

export type MarkAllNotificationsAsReadMutationVariables = Exact<{ [key: string]: never; }>;


export type MarkAllNotificationsAsReadMutation = { markAllNotificationsAsRead: boolean };

export type MarkAllNotificationsAsReadByActorMutationVariables = Exact<{
  type: string;
  actorID: string | number;
}>;


export type MarkAllNotificationsAsReadByActorMutation = { markAllNotificationsAsReadByActor: boolean };

export type DeleteNotificationsMutationVariables = Exact<{
  ids: Array<string | number> | string | number;
}>;


export type DeleteNotificationsMutation = { deleteNotifications: boolean };

export type DeleteReadNotificationsMutationVariables = Exact<{ [key: string]: never; }>;


export type DeleteReadNotificationsMutation = { deleteReadNotifications: boolean };

export type DeleteReadNotificationsByActorMutationVariables = Exact<{
  type: string;
  actorID: string | number;
}>;


export type DeleteReadNotificationsByActorMutation = { deleteReadNotificationsByActor: boolean };

export type PostFieldsFragment = { ID: string, content: string, createdAt: string, replyCount: number, deletedAt: string | null, user: { ID: string, name: string, accountID: string, avatarUrl: string | null }, favorites: Array<{ ID: string, user: { ID: string } }>, media: Array<{ ID: string, url: string, contentType: string }> };

export type TopLevelPostsQueryVariables = Exact<{
  limit?: number | null | undefined;
  offset?: number | null | undefined;
}>;


export type TopLevelPostsQuery = { topLevelPosts: { total: number, items: Array<{ ID: string, content: string, createdAt: string, replyCount: number, deletedAt: string | null, replies: Array<{ ID: string }>, user: { ID: string, name: string, accountID: string, avatarUrl: string | null }, favorites: Array<{ ID: string, user: { ID: string } }>, media: Array<{ ID: string, url: string, contentType: string }> }> } };

export type GetPostByIdQueryVariables = Exact<{
  id: string | number;
}>;


export type GetPostByIdQuery = { getPostByID: { ID: string, content: string, createdAt: string, replyCount: number, deletedAt: string | null, rootPost: { ID: string, content: string, createdAt: string, replyCount: number, deletedAt: string | null, user: { ID: string, name: string, accountID: string, avatarUrl: string | null }, favorites: Array<{ ID: string, user: { ID: string } }>, media: Array<{ ID: string, url: string, contentType: string }> } | null, replies: Array<{ ID: string, content: string, createdAt: string, replyCount: number, deletedAt: string | null, replies: Array<{ ID: string, content: string, createdAt: string, replyCount: number, deletedAt: string | null, replies: Array<{ ID: string, content: string, createdAt: string, replyCount: number, deletedAt: string | null, replies: Array<{ ID: string, content: string, createdAt: string, replyCount: number, deletedAt: string | null, replies: Array<{ ID: string }>, user: { ID: string, name: string, accountID: string, avatarUrl: string | null }, favorites: Array<{ ID: string, user: { ID: string } }>, media: Array<{ ID: string, url: string, contentType: string }> }>, user: { ID: string, name: string, accountID: string, avatarUrl: string | null }, favorites: Array<{ ID: string, user: { ID: string } }>, media: Array<{ ID: string, url: string, contentType: string }> }>, user: { ID: string, name: string, accountID: string, avatarUrl: string | null }, favorites: Array<{ ID: string, user: { ID: string } }>, media: Array<{ ID: string, url: string, contentType: string }> }>, user: { ID: string, name: string, accountID: string, avatarUrl: string | null }, favorites: Array<{ ID: string, user: { ID: string } }>, media: Array<{ ID: string, url: string, contentType: string }> }>, user: { ID: string, name: string, accountID: string, avatarUrl: string | null }, favorites: Array<{ ID: string, user: { ID: string } }>, media: Array<{ ID: string, url: string, contentType: string }> } | null };

export type GetPostsByUserIdQueryVariables = Exact<{
  user_id: string | number;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
}>;


export type GetPostsByUserIdQuery = { getPostsByUserID: { total: number, items: Array<{ ID: string, content: string, createdAt: string, replyCount: number, deletedAt: string | null, replies: Array<{ ID: string }>, user: { ID: string, name: string, accountID: string, avatarUrl: string | null }, favorites: Array<{ ID: string, user: { ID: string } }>, media: Array<{ ID: string, url: string, contentType: string }> }> } };

export type GetFavoritePostsByUserIdQueryVariables = Exact<{
  user_id: string | number;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
}>;


export type GetFavoritePostsByUserIdQuery = { getFavoritePostsByUserID: { total: number, items: Array<{ ID: string, content: string, createdAt: string, replyCount: number, deletedAt: string | null, replies: Array<{ ID: string }>, user: { ID: string, name: string, accountID: string, avatarUrl: string | null }, favorites: Array<{ ID: string, user: { ID: string } }>, media: Array<{ ID: string, url: string, contentType: string }> }> } };

export type CreatePostMutationVariables = Exact<{
  input: CreatePostInput;
}>;


export type CreatePostMutation = { createPost: { ID: string, content: string, createdAt: string, replyCount: number, deletedAt: string | null, replies: Array<{ ID: string }>, user: { ID: string, name: string, accountID: string, avatarUrl: string | null }, favorites: Array<{ ID: string, user: { ID: string } }>, media: Array<{ ID: string, url: string, contentType: string }> } };

export type UpdatePostMutationVariables = Exact<{
  input: UpdatePostInput;
}>;


export type UpdatePostMutation = { updatePost: { ID: string, content: string, createdAt: string, replyCount: number, deletedAt: string | null, replies: Array<{ ID: string }>, user: { ID: string, name: string, accountID: string, avatarUrl: string | null }, favorites: Array<{ ID: string, user: { ID: string } }>, media: Array<{ ID: string, url: string, contentType: string }> } };

export type DeletePostMutationVariables = Exact<{
  id: string | number;
}>;


export type DeletePostMutation = { deletePost: boolean };

export type CreateFavoriteMutationVariables = Exact<{
  input: CreateFavoriteInput;
}>;


export type CreateFavoriteMutation = { createFavorite: { ID: string, user: { ID: string } } };

export type DeleteFavoriteMutationVariables = Exact<{
  input: DeleteFavoriteInput;
}>;


export type DeleteFavoriteMutation = { deleteFavorite: boolean };

export type NewFeedPostsCountQueryVariables = Exact<{
  since: string;
}>;


export type NewFeedPostsCountQuery = { newFeedPostsCount: number };

export type SearchPostsQueryVariables = Exact<{
  keyword: string;
}>;


export type SearchPostsQuery = { searchPosts: Array<{ ID: string, content: string, createdAt: string, replyCount: number, deletedAt: string | null, replies: Array<{ ID: string }>, user: { ID: string, name: string, accountID: string, avatarUrl: string | null }, favorites: Array<{ ID: string, user: { ID: string } }>, media: Array<{ ID: string, url: string, contentType: string }> }> };

export type SearchPostsByHashtagQueryVariables = Exact<{
  tag: string;
}>;


export type SearchPostsByHashtagQuery = { searchPostsByHashtag: Array<{ ID: string, content: string, createdAt: string, replyCount: number, deletedAt: string | null, replies: Array<{ ID: string }>, user: { ID: string, name: string, accountID: string, avatarUrl: string | null }, favorites: Array<{ ID: string, user: { ID: string } }>, media: Array<{ ID: string, url: string, contentType: string }> }> };

export type PopularHashtagsQueryVariables = Exact<{ [key: string]: never; }>;


export type PopularHashtagsQuery = { popularHashtags: { total: number, items: Array<{ tag: string, count: number }> } };

export type SuggestHashtagsQueryVariables = Exact<{
  prefix: string;
  limit?: number | null | undefined;
}>;


export type SuggestHashtagsQuery = { suggestHashtags: Array<{ tag: string, count: number }> };

export type FollowersTopLevelPostsQueryVariables = Exact<{
  userID: string | number;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
}>;


export type FollowersTopLevelPostsQuery = { followersTopLevelPosts: { total: number, items: Array<{ ID: string, content: string, createdAt: string, replyCount: number, deletedAt: string | null, replies: Array<{ ID: string }>, user: { ID: string, name: string, accountID: string, avatarUrl: string | null }, favorites: Array<{ ID: string, user: { ID: string } }>, media: Array<{ ID: string, url: string, contentType: string }> }> } };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { me: { ID: string, accountID: string, name: string, email: string, role: string, status: string, createdAt: string, updatedAt: string } };

export type SearchUsersQueryVariables = Exact<{
  keyword: string;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
}>;


export type SearchUsersQuery = { searchUsers: { total: number, items: Array<{ ID: string, accountID: string, name: string, email: string, role: string, status: string, avatarUrl: string | null, createdAt: string, updatedAt: string }> } };

export type UpdateUserMutationVariables = Exact<{
  input: UpdateUserInput;
}>;


export type UpdateUserMutation = { updateUser: { ID: string, accountID: string, name: string, email: string, role: string, status: string, createdAt: string, updatedAt: string } };

export type PresignedAvatarUploadUrlQueryVariables = Exact<{
  contentType: string;
}>;


export type PresignedAvatarUploadUrlQuery = { presignedAvatarUploadUrl: { uploadUrl: string, objectKey: string } };

export type SetAvatarMutationVariables = Exact<{
  objectKey: string;
}>;


export type SetAvatarMutation = { setAvatar: { username: string, bio: string | null, avatarUrl: string | null, createdAt: string, updatedAt: string } };

export type DeleteAvatarMutationVariables = Exact<{ [key: string]: never; }>;


export type DeleteAvatarMutation = { deleteAvatar: { username: string, bio: string | null, avatarUrl: string | null, createdAt: string, updatedAt: string } };

export type DeleteMyAccountMutationVariables = Exact<{ [key: string]: never; }>;


export type DeleteMyAccountMutation = { deleteMyAccount: boolean };

export type GetProfileByUserIdQueryVariables = Exact<{
  userID: string | number;
}>;


export type GetProfileByUserIdQuery = { getProfileByUserID: { username: string, bio: string | null, avatarUrl: string | null, createdAt: string, updatedAt: string, user: { ID: string, accountID: string, name: string, email: string, role: string, status: string, avatarUrl: string | null, createdAt: string, updatedAt: string } } | null };

export type UpdateProfileMutationVariables = Exact<{
  input: UpdateProfileInput;
}>;


export type UpdateProfileMutation = { updateProfile: { username: string, bio: string | null, avatarUrl: string | null, createdAt: string, updatedAt: string } };

export type CreateReportMutationVariables = Exact<{
  input: CreateReportInput;
}>;


export type CreateReportMutation = { createReport: { ID: string, targetType: ReportTargetType, targetID: string, reason: string, customReason: string | null, reporter: { ID: string, name: string, accountID: string } } };

export type MyTermsConsentStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type MyTermsConsentStatusQuery = { myTermsConsentStatus: { isConsented: boolean, currentTerms: { ID: string, version: string, documentUrl: string, effectiveDate: string, createdAt: string } | null } };

export type ConsentToTermsMutationVariables = Exact<{
  termsID: string | number;
}>;


export type ConsentToTermsMutation = { consentToTerms: boolean };

export type CurrentTermsQueryVariables = Exact<{ [key: string]: never; }>;


export type CurrentTermsQuery = { currentTerms: { ID: string, version: string, documentUrl: string, effectiveDate: string, createdAt: string } | null };

export const AdminPostFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AdminPostFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Post"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"replyCount"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"favorites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"media"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<AdminPostFieldsFragment, unknown>;
export const PostFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PostFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Post"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"replyCount"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"favorites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"media"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}}]}}]}}]} as unknown as DocumentNode<PostFieldsFragment, unknown>;
export const CreateAdministratorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAdministrator"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAdministratorInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAdministrator"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<CreateAdministratorMutation, CreateAdministratorMutationVariables>;
export const GetAdministratorByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAdministratorByID"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAdministratorByID"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<GetAdministratorByIdQuery, GetAdministratorByIdQueryVariables>;
export const SearchAdministratorsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchAdministrators"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchAdministrators"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<SearchAdministratorsQuery, SearchAdministratorsQueryVariables>;
export const AdministratorsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Administrators"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"administrators"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]} as unknown as DocumentNode<AdministratorsQuery, AdministratorsQueryVariables>;
export const DeleteAdministratorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAdministrator"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAdministrator"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteAdministratorMutation, DeleteAdministratorMutationVariables>;
export const UpdateAdministratorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAdministrator"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAdministratorInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAdministrator"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<UpdateAdministratorMutation, UpdateAdministratorMutationVariables>;
export const AdminGetAnalyticsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminGetAnalytics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminGetAnalytics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalUsers"}},{"kind":"Field","name":{"kind":"Name","value":"newUsersToday"}},{"kind":"Field","name":{"kind":"Name","value":"newUsersThisWeek"}},{"kind":"Field","name":{"kind":"Name","value":"newUsersThisMonth"}},{"kind":"Field","name":{"kind":"Name","value":"frozenUsersCount"}},{"kind":"Field","name":{"kind":"Name","value":"totalPosts"}},{"kind":"Field","name":{"kind":"Name","value":"totalComments"}},{"kind":"Field","name":{"kind":"Name","value":"totalDeletedPosts"}},{"kind":"Field","name":{"kind":"Name","value":"totalLikes"}},{"kind":"Field","name":{"kind":"Name","value":"totalCommunities"}},{"kind":"Field","name":{"kind":"Name","value":"totalMessages"}},{"kind":"Field","name":{"kind":"Name","value":"totalReports"}},{"kind":"Field","name":{"kind":"Name","value":"totalBlocks"}},{"kind":"Field","name":{"kind":"Name","value":"totalInquiries"}},{"kind":"Field","name":{"kind":"Name","value":"currentActiveUsers"}},{"kind":"Field","name":{"kind":"Name","value":"dau"}},{"kind":"Field","name":{"kind":"Name","value":"wau"}},{"kind":"Field","name":{"kind":"Name","value":"mau"}},{"kind":"Field","name":{"kind":"Name","value":"dauMauRatio"}},{"kind":"Field","name":{"kind":"Name","value":"postsToday"}},{"kind":"Field","name":{"kind":"Name","value":"commentsToday"}},{"kind":"Field","name":{"kind":"Name","value":"messagesToday"}},{"kind":"Field","name":{"kind":"Name","value":"avgLikesPerPost"}},{"kind":"Field","name":{"kind":"Name","value":"avgCommentsPerPost"}},{"kind":"Field","name":{"kind":"Name","value":"postsTextOnly"}},{"kind":"Field","name":{"kind":"Name","value":"postsWithImage"}},{"kind":"Field","name":{"kind":"Name","value":"postsWithVideo"}},{"kind":"Field","name":{"kind":"Name","value":"uniqueDMSenders"}},{"kind":"Field","name":{"kind":"Name","value":"activeCommunitiesLast30Days"}},{"kind":"Field","name":{"kind":"Name","value":"avgCommunityMembers"}},{"kind":"Field","name":{"kind":"Name","value":"avgCommunitiesPerUser"}},{"kind":"Field","name":{"kind":"Name","value":"totalFollows"}},{"kind":"Field","name":{"kind":"Name","value":"avgFollowersPerUser"}},{"kind":"Field","name":{"kind":"Name","value":"avgFollowingPerUser"}},{"kind":"Field","name":{"kind":"Name","value":"usersWithProfile"}},{"kind":"Field","name":{"kind":"Name","value":"usersWithAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"usersWithPost"}},{"kind":"Field","name":{"kind":"Name","value":"onboardingCompleteRate"}},{"kind":"Field","name":{"kind":"Name","value":"avgTimeToFirstPostMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"totalNotifications"}},{"kind":"Field","name":{"kind":"Name","value":"readNotifications"}},{"kind":"Field","name":{"kind":"Name","value":"notificationReadRate"}},{"kind":"Field","name":{"kind":"Name","value":"pendingReports"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedReports"}},{"kind":"Field","name":{"kind":"Name","value":"webSocketConnections"}},{"kind":"Field","name":{"kind":"Name","value":"sseConnections"}},{"kind":"Field","name":{"kind":"Name","value":"errorRate5xx"}},{"kind":"Field","name":{"kind":"Name","value":"p50ResponseTimeMs"}},{"kind":"Field","name":{"kind":"Name","value":"p95ResponseTimeMs"}},{"kind":"Field","name":{"kind":"Name","value":"p99ResponseTimeMs"}},{"kind":"Field","name":{"kind":"Name","value":"avgSessionDurationSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"avgSessionsPerDay"}},{"kind":"Field","name":{"kind":"Name","value":"avgScrollDepth"}},{"kind":"Field","name":{"kind":"Name","value":"pageViewStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pagePath"}},{"kind":"Field","name":{"kind":"Name","value":"avgDurationSeconds"}},{"kind":"Field","name":{"kind":"Name","value":"avgMaxScrollDepth"}},{"kind":"Field","name":{"kind":"Name","value":"totalViews"}}]}}]}}]}}]} as unknown as DocumentNode<AdminGetAnalyticsQuery, AdminGetAnalyticsQueryVariables>;
export const AdminGetCommunityAnalyticsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminGetCommunityAnalytics"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminGetCommunityAnalytics"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"communityID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"memberCount"}},{"kind":"Field","name":{"kind":"Name","value":"messageCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]} as unknown as DocumentNode<AdminGetCommunityAnalyticsQuery, AdminGetCommunityAnalyticsQueryVariables>;
export const AdminGetTimeSeriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminGetTimeSeries"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"granularity"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TimeSeriesGranularity"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"from"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"to"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminGetTimeSeries"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"granularity"},"value":{"kind":"Variable","name":{"kind":"Name","value":"granularity"}}},{"kind":"Argument","name":{"kind":"Name","value":"from"},"value":{"kind":"Variable","name":{"kind":"Name","value":"from"}}},{"kind":"Argument","name":{"kind":"Name","value":"to"},"value":{"kind":"Variable","name":{"kind":"Name","value":"to"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"points"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"posts"}},{"kind":"Field","name":{"kind":"Name","value":"comments"}},{"kind":"Field","name":{"kind":"Name","value":"messages"}},{"kind":"Field","name":{"kind":"Name","value":"newUsers"}},{"kind":"Field","name":{"kind":"Name","value":"likes"}},{"kind":"Field","name":{"kind":"Name","value":"activeUsers"}}]}}]}}]}}]} as unknown as DocumentNode<AdminGetTimeSeriesQuery, AdminGetTimeSeriesQueryVariables>;
export const GetAnnouncementDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAnnouncement"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"announcement"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<GetAnnouncementQuery, GetAnnouncementQueryVariables>;
export const AdminListAnnouncementsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminListAnnouncements"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminListAnnouncements"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]} as unknown as DocumentNode<AdminListAnnouncementsQuery, AdminListAnnouncementsQueryVariables>;
export const CreateAnnouncementDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAnnouncement"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAnnouncementInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAnnouncement"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<CreateAnnouncementMutation, CreateAnnouncementMutationVariables>;
export const UpdateAnnouncementDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAnnouncement"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAnnouncementInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAnnouncement"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateAnnouncementMutation, UpdateAnnouncementMutationVariables>;
export const DeleteAnnouncementDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAnnouncement"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAnnouncement"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteAnnouncementMutation, DeleteAnnouncementMutationVariables>;
export const LoginAdminDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LoginAdmin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LoginInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"loginAdministrator"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}},{"kind":"Field","name":{"kind":"Name","value":"administrator"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]} as unknown as DocumentNode<LoginAdminMutation, LoginAdminMutationVariables>;
export const LogoutAdminDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LogoutAdmin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logoutAdministrator"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}]}]}}]} as unknown as DocumentNode<LogoutAdminMutation, LogoutAdminMutationVariables>;
export const CommunitiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Communities"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"communities"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"roomID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]} as unknown as DocumentNode<CommunitiesQuery, CommunitiesQueryVariables>;
export const AdminUpdateCommunityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminUpdateCommunity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateCommunityInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCommunity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"roomID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<AdminUpdateCommunityMutation, AdminUpdateCommunityMutationVariables>;
export const KickUserFromCommunityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"KickUserFromCommunity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"communityID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kickUserFromCommunity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"communityID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"communityID"}}},{"kind":"Argument","name":{"kind":"Name","value":"userID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userID"}}}]}]}}]} as unknown as DocumentNode<KickUserFromCommunityMutation, KickUserFromCommunityMutationVariables>;
export const AdminGetRoomDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminGetRoom"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"room"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]} as unknown as DocumentNode<AdminGetRoomQuery, AdminGetRoomQueryVariables>;
export const AdminGetCommunityMembersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminGetCommunityMembers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"communityID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getCommunityMembers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"communityID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"communityID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]} as unknown as DocumentNode<AdminGetCommunityMembersQuery, AdminGetCommunityMembersQueryVariables>;
export const AdminListMessagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminListMessages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roomID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"messages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"roomID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roomID"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"roomID"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"media"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<AdminListMessagesQuery, AdminListMessagesQueryVariables>;
export const PromoteToCommunityOwnerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PromoteToCommunityOwner"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"communityID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"promoteToCommunityOwner"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"communityID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"communityID"}}},{"kind":"Argument","name":{"kind":"Name","value":"userID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userID"}}}]}]}}]} as unknown as DocumentNode<PromoteToCommunityOwnerMutation, PromoteToCommunityOwnerMutationVariables>;
export const DemoteFromCommunityOwnerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DemoteFromCommunityOwner"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"communityID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"demoteFromCommunityOwner"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"communityID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"communityID"}}},{"kind":"Argument","name":{"kind":"Name","value":"userID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userID"}}}]}]}}]} as unknown as DocumentNode<DemoteFromCommunityOwnerMutation, DemoteFromCommunityOwnerMutationVariables>;
export const DeleteMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roomID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"roomID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roomID"}}},{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteMessageMutation, DeleteMessageMutationVariables>;
export const SearchInquiriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchInquiries"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"InquiryStatus"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchInquiries"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]} as unknown as DocumentNode<SearchInquiriesQuery, SearchInquiriesQueryVariables>;
export const GetInquiryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetInquiry"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getInquiry"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetInquiryQuery, GetInquiryQueryVariables>;
export const UpdateInquiryStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateInquiryStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"InquiryStatus"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateInquiryStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<UpdateInquiryStatusMutation, UpdateInquiryStatusMutationVariables>;
export const ToggleMaintenanceModeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ToggleMaintenanceMode"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toggleMaintenanceMode"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"enabled"},"value":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}}}]}]}}]} as unknown as DocumentNode<ToggleMaintenanceModeMutation, ToggleMaintenanceModeMutationVariables>;
export const MaintenanceModeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MaintenanceMode"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"maintenanceMode"}}]}}]} as unknown as DocumentNode<MaintenanceModeQuery, MaintenanceModeQueryVariables>;
export const GetAdminPostsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAdminPosts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"posts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AdminPostFields"}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AdminPostFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Post"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"replyCount"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"favorites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"media"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<GetAdminPostsQuery, GetAdminPostsQueryVariables>;
export const GetPostByIdIncludeDeletedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPostByIDIncludeDeleted"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getPostByIDIncludeDeleted"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AdminPostFields"}},{"kind":"Field","name":{"kind":"Name","value":"rootPost"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AdminPostFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AdminPostFields"}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AdminPostFields"}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AdminPostFields"}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AdminPostFields"}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}}]}}]}}]}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AdminPostFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Post"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"replyCount"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"favorites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"media"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<GetPostByIdIncludeDeletedQuery, GetPostByIdIncludeDeletedQueryVariables>;
export const AdminDeletePostDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminDeletePost"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminDeletePost"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<AdminDeletePostMutation, AdminDeletePostMutationVariables>;
export const AdminGetBlockersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminGetBlockers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminGetBlockers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}}]}}]} as unknown as DocumentNode<AdminGetBlockersQuery, AdminGetBlockersQueryVariables>;
export const AdminGetFavoriteUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminGetFavoriteUsers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminGetFavoriteUsers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}}]}}]} as unknown as DocumentNode<AdminGetFavoriteUsersQuery, AdminGetFavoriteUsersQueryVariables>;
export const SearchReportsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchReports"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ReportSearchFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchReports"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetID"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"customReason"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]} as unknown as DocumentNode<SearchReportsQuery, SearchReportsQueryVariables>;
export const UpdateReportStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateReportStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ReportStatus"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateReportStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<UpdateReportStatusMutation, UpdateReportStatusMutationVariables>;
export const AdminCreateReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminCreateReport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateReportInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<AdminCreateReportMutation, AdminCreateReportMutationVariables>;
export const GetReportServiceStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetReportServiceStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isReportServiceEnabled"}}]}}]} as unknown as DocumentNode<GetReportServiceStatusQuery, GetReportServiceStatusQueryVariables>;
export const SetReportServiceStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetReportServiceStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setReportServiceStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"enabled"},"value":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}}}]}]}}]} as unknown as DocumentNode<SetReportServiceStatusMutation, SetReportServiceStatusMutationVariables>;
export const PresignedTermsDocumentUploadUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PresignedTermsDocumentUploadUrl"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"presignedTermsDocumentUploadUrl"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uploadUrl"}},{"kind":"Field","name":{"kind":"Name","value":"objectKey"}}]}}]}}]} as unknown as DocumentNode<PresignedTermsDocumentUploadUrlQuery, PresignedTermsDocumentUploadUrlQueryVariables>;
export const AdminListTermsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminListTerms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminListTerms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"documentUrl"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveDate"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<AdminListTermsQuery, AdminListTermsQueryVariables>;
export const AdminListConsentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminListConsents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"termsID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminListConsents"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"termsID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"termsID"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"Field","name":{"kind":"Name","value":"consentedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]} as unknown as DocumentNode<AdminListConsentsQuery, AdminListConsentsQueryVariables>;
export const CreateTermsOfServiceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTermsOfService"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTermsOfServiceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTermsOfService"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"documentUrl"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveDate"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<CreateTermsOfServiceMutation, CreateTermsOfServiceMutationVariables>;
export const UsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Users"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]} as unknown as DocumentNode<UsersQuery, UsersQueryVariables>;
export const AdminSearchUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminSearchUsers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"keyword"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchUsers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"keyword"},"value":{"kind":"Variable","name":{"kind":"Name","value":"keyword"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]} as unknown as DocumentNode<AdminSearchUsersQuery, AdminSearchUsersQueryVariables>;
export const GetUserByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUserByID"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getUserByID"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetUserByIdQuery, GetUserByIdQueryVariables>;
export const DeleteUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteUserMutation, DeleteUserMutationVariables>;
export const FreezeUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"FreezeUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"freezeUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<FreezeUserMutation, FreezeUserMutationVariables>;
export const UnfreezeUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UnfreezeUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unfreezeUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<UnfreezeUserMutation, UnfreezeUserMutationVariables>;
export const AdminUpdateUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminUpdateUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminUpdateUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<AdminUpdateUserMutation, AdminUpdateUserMutationVariables>;
export const AdminUpdateProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminUpdateProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateProfileInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminUpdateProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userID"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}}]} as unknown as DocumentNode<AdminUpdateProfileMutation, AdminUpdateProfileMutationVariables>;
export const AdminGetProfileByUserIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminGetProfileByUserID"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getProfileByUserID"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}}]} as unknown as DocumentNode<AdminGetProfileByUserIdQuery, AdminGetProfileByUserIdQueryVariables>;
export const ListAnnouncementsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListAnnouncements"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"announcements"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]} as unknown as DocumentNode<ListAnnouncementsQuery, ListAnnouncementsQueryVariables>;
export const LoginUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LoginUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LoginInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"loginUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}}]} as unknown as DocumentNode<LoginUserMutation, LoginUserMutationVariables>;
export const LogoutUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LogoutUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logoutUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}]}]}}]} as unknown as DocumentNode<LogoutUserMutation, LogoutUserMutationVariables>;
export const SendEmailOtpDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SendEmailOTP"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sendEmailOTP"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}]}]}}]} as unknown as DocumentNode<SendEmailOtpMutation, SendEmailOtpMutationVariables>;
export const VerifyEmailOtpDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"VerifyEmailOTP"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"otp"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verifyEmailOTP"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}},{"kind":"Argument","name":{"kind":"Name","value":"otp"},"value":{"kind":"Variable","name":{"kind":"Name","value":"otp"}}}]}]}}]} as unknown as DocumentNode<VerifyEmailOtpMutation, VerifyEmailOtpMutationVariables>;
export const CreateUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<CreateUserMutation, CreateUserMutationVariables>;
export const RequestPasswordResetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestPasswordReset"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestPasswordReset"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}]}]}}]} as unknown as DocumentNode<RequestPasswordResetMutation, RequestPasswordResetMutationVariables>;
export const VerifyPasswordResetOtpDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"VerifyPasswordResetOTP"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"otp"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verifyPasswordResetOTP"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}},{"kind":"Argument","name":{"kind":"Name","value":"otp"},"value":{"kind":"Variable","name":{"kind":"Name","value":"otp"}}}]}]}}]} as unknown as DocumentNode<VerifyPasswordResetOtpMutation, VerifyPasswordResetOtpMutationVariables>;
export const ResetPasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResetPassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"resetToken"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newPassword"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resetPassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"resetToken"},"value":{"kind":"Variable","name":{"kind":"Name","value":"resetToken"}}},{"kind":"Argument","name":{"kind":"Name","value":"newPassword"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newPassword"}}}]}]}}]} as unknown as DocumentNode<ResetPasswordMutation, ResetPasswordMutationVariables>;
export const GetBlockersByUserIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetBlockersByUserID"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"GetBlockersByUserID"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}}]}}]} as unknown as DocumentNode<GetBlockersByUserIdQuery, GetBlockersByUserIdQueryVariables>;
export const CreateBlockerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateBlocker"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"blockedUserID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createBlocker"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"blockedUserID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"blockedUserID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"userID"}},{"kind":"Field","name":{"kind":"Name","value":"blockedUserID"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<CreateBlockerMutation, CreateBlockerMutationVariables>;
export const DeleteBlockerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteBlocker"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"blockedUserID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteBlocker"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"blockedUserID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"blockedUserID"}}}]}]}}]} as unknown as DocumentNode<DeleteBlockerMutation, DeleteBlockerMutationVariables>;
export const ListBlockedUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListBlockedUsers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listBlockedUsers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]} as unknown as DocumentNode<ListBlockedUsersQuery, ListBlockedUsersQueryVariables>;
export const MyCommunitiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyCommunities"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myCommunities"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"roomID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"avatarURL"}},{"kind":"Field","name":{"kind":"Name","value":"memberCount"}},{"kind":"Field","name":{"kind":"Name","value":"isMember"}},{"kind":"Field","name":{"kind":"Name","value":"unreadCount"}},{"kind":"Field","name":{"kind":"Name","value":"lastMessage"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]} as unknown as DocumentNode<MyCommunitiesQuery, MyCommunitiesQueryVariables>;
export const SearchCommunitiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchCommunities"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchCommunities"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"roomID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"avatarURL"}},{"kind":"Field","name":{"kind":"Name","value":"memberCount"}},{"kind":"Field","name":{"kind":"Name","value":"isMember"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]} as unknown as DocumentNode<SearchCommunitiesQuery, SearchCommunitiesQueryVariables>;
export const CreateCommunityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCommunity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCommunityInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCommunity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"roomID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"avatarURL"}},{"kind":"Field","name":{"kind":"Name","value":"memberCount"}},{"kind":"Field","name":{"kind":"Name","value":"isMember"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateCommunityMutation, CreateCommunityMutationVariables>;
export const JoinRoomDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"JoinRoom"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roomID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"joinRoom"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"roomID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roomID"}}}]}]}}]} as unknown as DocumentNode<JoinRoomMutation, JoinRoomMutationVariables>;
export const RemoveUserFromRoomDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveUserFromRoom"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RemoveUserFromRoomInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeUserFromRoom"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<RemoveUserFromRoomMutation, RemoveUserFromRoomMutationVariables>;
export const GetMyRoleInCommunityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMyRoleInCommunity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"communityID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getMyRoleInCommunity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"communityID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"communityID"}}}]}]}}]} as unknown as DocumentNode<GetMyRoleInCommunityQuery, GetMyRoleInCommunityQueryVariables>;
export const GetCommunityMembersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCommunityMembers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"communityID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getCommunityMembers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"communityID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"communityID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]} as unknown as DocumentNode<GetCommunityMembersQuery, GetCommunityMembersQueryVariables>;
export const UpdateCommunityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateCommunity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateCommunityInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCommunity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"roomID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"avatarURL"}},{"kind":"Field","name":{"kind":"Name","value":"memberCount"}},{"kind":"Field","name":{"kind":"Name","value":"isMember"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateCommunityMutation, UpdateCommunityMutationVariables>;
export const UpdateCommunityMembersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateCommunityMembers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"communityID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updates"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CommunityMemberUpdateInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCommunityMembers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"communityID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"communityID"}}},{"kind":"Argument","name":{"kind":"Name","value":"updates"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updates"}}}]}]}}]} as unknown as DocumentNode<UpdateCommunityMembersMutation, UpdateCommunityMembersMutationVariables>;
export const RandomCommunitiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RandomCommunities"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"randomCommunities"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"roomID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"avatarURL"}},{"kind":"Field","name":{"kind":"Name","value":"memberCount"}},{"kind":"Field","name":{"kind":"Name","value":"isMember"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<RandomCommunitiesQuery, RandomCommunitiesQueryVariables>;
export const PresignedCommunityIconUploadUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PresignedCommunityIconUploadUrl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"presignedCommunityIconUploadUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contentType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentType"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uploadUrl"}},{"kind":"Field","name":{"kind":"Name","value":"objectKey"}}]}}]}}]} as unknown as DocumentNode<PresignedCommunityIconUploadUrlQuery, PresignedCommunityIconUploadUrlQueryVariables>;
export const MyUnreadCommunityCountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyUnreadCommunityCount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myUnreadCommunityCount"}}]}}]} as unknown as DocumentNode<MyUnreadCommunityCountQuery, MyUnreadCommunityCountQueryVariables>;
export const GetFavoriteUsersByUserIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetFavoriteUsersByUserID"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"GetFavoriteUsersByUserID"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}}]}}]} as unknown as DocumentNode<GetFavoriteUsersByUserIdQuery, GetFavoriteUsersByUserIdQueryVariables>;
export const CreateFavoriteUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateFavoriteUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"favoriteUserID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createFavoriteUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"favoriteUserID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"favoriteUserID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"userID"}},{"kind":"Field","name":{"kind":"Name","value":"favoriteUserID"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<CreateFavoriteUserMutation, CreateFavoriteUserMutationVariables>;
export const DeleteFavoriteUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteFavoriteUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"favoriteUserID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteFavoriteUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"favoriteUserID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"favoriteUserID"}}}]}]}}]} as unknown as DocumentNode<DeleteFavoriteUserMutation, DeleteFavoriteUserMutationVariables>;
export const ListFavoriteUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListFavoriteUsers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listFavoriteUsers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]} as unknown as DocumentNode<ListFavoriteUsersQuery, ListFavoriteUsersQueryVariables>;
export const MyFollowersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyFollowers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myFollowers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]} as unknown as DocumentNode<MyFollowersQuery, MyFollowersQueryVariables>;
export const CreateInquiryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateInquiry"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateInquiryInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createInquiry"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<CreateInquiryMutation, CreateInquiryMutationVariables>;
export const MarkRoomAsReadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkRoomAsRead"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roomID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markRoomAsRead"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"roomID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roomID"}}}]}]}}]} as unknown as DocumentNode<MarkRoomAsReadMutation, MarkRoomAsReadMutationVariables>;
export const GetOrCreateDmRoomDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GetOrCreateDMRoom"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"targetUserID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getOrCreateDMRoom"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"targetUserID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"targetUserID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isMessagingDisabled"}},{"kind":"Field","name":{"kind":"Name","value":"lastReadAt"}},{"kind":"Field","name":{"kind":"Name","value":"unreadCount"}},{"kind":"Field","name":{"kind":"Name","value":"partnerLastReadAt"}},{"kind":"Field","name":{"kind":"Name","value":"content"}}]}}]}}]} as unknown as DocumentNode<GetOrCreateDmRoomMutation, GetOrCreateDmRoomMutationVariables>;
export const SendMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SendMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roomID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"content"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mediaInputs"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MediaUploadInput"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sendMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"roomID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roomID"}}},{"kind":"Argument","name":{"kind":"Name","value":"content"},"value":{"kind":"Variable","name":{"kind":"Name","value":"content"}}},{"kind":"Argument","name":{"kind":"Name","value":"mediaInputs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mediaInputs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"roomID"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"media"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<SendMessageMutation, SendMessageMutationVariables>;
export const UpdateMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roomID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"content"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"roomID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roomID"}}},{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"content"},"value":{"kind":"Variable","name":{"kind":"Name","value":"content"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"roomID"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"media"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateMessageMutation, UpdateMessageMutationVariables>;
export const DeleteRoomDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteRoom"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roomID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteRoom"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"roomID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roomID"}}}]}]}}]} as unknown as DocumentNode<DeleteRoomMutation, DeleteRoomMutationVariables>;
export const ListMessagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListMessages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roomID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"before"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"afterTime"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"messages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"roomID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roomID"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"before"},"value":{"kind":"Variable","name":{"kind":"Name","value":"before"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}},{"kind":"Argument","name":{"kind":"Name","value":"afterTime"},"value":{"kind":"Variable","name":{"kind":"Name","value":"afterTime"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"roomID"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"media"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"hasMoreBefore"}},{"kind":"Field","name":{"kind":"Name","value":"hasMoreAfter"}}]}}]}}]} as unknown as DocumentNode<ListMessagesQuery, ListMessagesQueryVariables>;
export const GetRoomDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRoom"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"room"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isMessagingDisabled"}},{"kind":"Field","name":{"kind":"Name","value":"lastReadAt"}},{"kind":"Field","name":{"kind":"Name","value":"unreadCount"}},{"kind":"Field","name":{"kind":"Name","value":"partnerLastReadAt"}},{"kind":"Field","name":{"kind":"Name","value":"content"}}]}}]}}]} as unknown as DocumentNode<GetRoomQuery, GetRoomQueryVariables>;
export const MyDmRoomsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyDMRooms"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myDMRooms"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isMessagingDisabled"}},{"kind":"Field","name":{"kind":"Name","value":"lastReadAt"}},{"kind":"Field","name":{"kind":"Name","value":"unreadCount"}},{"kind":"Field","name":{"kind":"Name","value":"partnerLastReadAt"}},{"kind":"Field","name":{"kind":"Name","value":"content"}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]} as unknown as DocumentNode<MyDmRoomsQuery, MyDmRoomsQueryVariables>;
export const PresignedMediaUploadUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PresignedMediaUploadUrl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"presignedMediaUploadUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contentType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentType"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uploadUrl"}},{"kind":"Field","name":{"kind":"Name","value":"objectKey"}}]}}]}}]} as unknown as DocumentNode<PresignedMediaUploadUrlQuery, PresignedMediaUploadUrlQueryVariables>;
export const MyUnreadDmCountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyUnreadDMCount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myUnreadDMCount"}}]}}]} as unknown as DocumentNode<MyUnreadDmCountQuery, MyUnreadDmCountQueryVariables>;
export const MyNotificationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyNotifications"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"actorID"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myNotifications"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}},{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}},{"kind":"Argument","name":{"kind":"Name","value":"actorID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"actorID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"actor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetID"}},{"kind":"Field","name":{"kind":"Name","value":"targetPost"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}}]}},{"kind":"Field","name":{"kind":"Name","value":"media"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"isRead"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]} as unknown as DocumentNode<MyNotificationsQuery, MyNotificationsQueryVariables>;
export const MyNotificationGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyNotificationGroups"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myNotificationGroups"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"actor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetID"}},{"kind":"Field","name":{"kind":"Name","value":"targetPost"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}}]}},{"kind":"Field","name":{"kind":"Name","value":"media"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"unreadCount"}},{"kind":"Field","name":{"kind":"Name","value":"latestID"}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]} as unknown as DocumentNode<MyNotificationGroupsQuery, MyNotificationGroupsQueryVariables>;
export const NotificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Notification"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notification"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"actor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetID"}},{"kind":"Field","name":{"kind":"Name","value":"targetPost"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}}]}},{"kind":"Field","name":{"kind":"Name","value":"media"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"isRead"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<NotificationQuery, NotificationQueryVariables>;
export const MyUnreadNotificationCountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyUnreadNotificationCount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myUnreadNotificationCount"}}]}}]} as unknown as DocumentNode<MyUnreadNotificationCountQuery, MyUnreadNotificationCountQueryVariables>;
export const MarkNotificationAsReadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkNotificationAsRead"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markNotificationAsRead"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<MarkNotificationAsReadMutation, MarkNotificationAsReadMutationVariables>;
export const MarkAllNotificationsAsReadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkAllNotificationsAsRead"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markAllNotificationsAsRead"}}]}}]} as unknown as DocumentNode<MarkAllNotificationsAsReadMutation, MarkAllNotificationsAsReadMutationVariables>;
export const MarkAllNotificationsAsReadByActorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkAllNotificationsAsReadByActor"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"actorID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markAllNotificationsAsReadByActor"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}},{"kind":"Argument","name":{"kind":"Name","value":"actorID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"actorID"}}}]}]}}]} as unknown as DocumentNode<MarkAllNotificationsAsReadByActorMutation, MarkAllNotificationsAsReadByActorMutationVariables>;
export const DeleteNotificationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteNotifications"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteNotifications"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}]}}]} as unknown as DocumentNode<DeleteNotificationsMutation, DeleteNotificationsMutationVariables>;
export const DeleteReadNotificationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteReadNotifications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteReadNotifications"}}]}}]} as unknown as DocumentNode<DeleteReadNotificationsMutation, DeleteReadNotificationsMutationVariables>;
export const DeleteReadNotificationsByActorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteReadNotificationsByActor"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"actorID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteReadNotificationsByActor"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}},{"kind":"Argument","name":{"kind":"Name","value":"actorID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"actorID"}}}]}]}}]} as unknown as DocumentNode<DeleteReadNotificationsByActorMutation, DeleteReadNotificationsByActorMutationVariables>;
export const TopLevelPostsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TopLevelPosts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"topLevelPosts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PostFields"}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PostFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Post"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"replyCount"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"favorites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"media"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}}]}}]}}]} as unknown as DocumentNode<TopLevelPostsQuery, TopLevelPostsQueryVariables>;
export const GetPostByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPostByID"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getPostByID"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PostFields"}},{"kind":"Field","name":{"kind":"Name","value":"rootPost"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PostFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PostFields"}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PostFields"}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PostFields"}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PostFields"}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}}]}}]}}]}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PostFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Post"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"replyCount"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"favorites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"media"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}}]}}]}}]} as unknown as DocumentNode<GetPostByIdQuery, GetPostByIdQueryVariables>;
export const GetPostsByUserIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPostsByUserID"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"user_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getPostsByUserID"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"user_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"user_id"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PostFields"}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PostFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Post"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"replyCount"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"favorites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"media"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}}]}}]}}]} as unknown as DocumentNode<GetPostsByUserIdQuery, GetPostsByUserIdQueryVariables>;
export const GetFavoritePostsByUserIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetFavoritePostsByUserID"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"user_id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getFavoritePostsByUserID"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"user_id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"user_id"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PostFields"}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PostFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Post"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"replyCount"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"favorites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"media"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}}]}}]}}]} as unknown as DocumentNode<GetFavoritePostsByUserIdQuery, GetFavoritePostsByUserIdQueryVariables>;
export const CreatePostDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreatePost"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreatePostInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createPost"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PostFields"}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PostFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Post"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"replyCount"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"favorites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"media"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}}]}}]}}]} as unknown as DocumentNode<CreatePostMutation, CreatePostMutationVariables>;
export const UpdatePostDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdatePost"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdatePostInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePost"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PostFields"}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PostFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Post"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"replyCount"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"favorites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"media"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}}]}}]}}]} as unknown as DocumentNode<UpdatePostMutation, UpdatePostMutationVariables>;
export const DeletePostDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeletePost"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deletePost"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeletePostMutation, DeletePostMutationVariables>;
export const CreateFavoriteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateFavorite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateFavoriteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createFavorite"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}}]}}]}}]}}]} as unknown as DocumentNode<CreateFavoriteMutation, CreateFavoriteMutationVariables>;
export const DeleteFavoriteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteFavorite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteFavoriteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteFavorite"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<DeleteFavoriteMutation, DeleteFavoriteMutationVariables>;
export const NewFeedPostsCountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"NewFeedPostsCount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"since"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"newFeedPostsCount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"since"},"value":{"kind":"Variable","name":{"kind":"Name","value":"since"}}}]}]}}]} as unknown as DocumentNode<NewFeedPostsCountQuery, NewFeedPostsCountQueryVariables>;
export const SearchPostsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchPosts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"keyword"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchPosts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"keyword"},"value":{"kind":"Variable","name":{"kind":"Name","value":"keyword"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PostFields"}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PostFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Post"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"replyCount"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"favorites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"media"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}}]}}]}}]} as unknown as DocumentNode<SearchPostsQuery, SearchPostsQueryVariables>;
export const SearchPostsByHashtagDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchPostsByHashtag"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tag"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchPostsByHashtag"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"tag"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tag"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PostFields"}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PostFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Post"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"replyCount"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"favorites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"media"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}}]}}]}}]} as unknown as DocumentNode<SearchPostsByHashtagQuery, SearchPostsByHashtagQueryVariables>;
export const PopularHashtagsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PopularHashtags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"popularHashtags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tag"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]} as unknown as DocumentNode<PopularHashtagsQuery, PopularHashtagsQueryVariables>;
export const SuggestHashtagsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SuggestHashtags"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"prefix"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"suggestHashtags"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"prefix"},"value":{"kind":"Variable","name":{"kind":"Name","value":"prefix"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tag"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}}]} as unknown as DocumentNode<SuggestHashtagsQuery, SuggestHashtagsQueryVariables>;
export const FollowersTopLevelPostsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FollowersTopLevelPosts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"followersTopLevelPosts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userID"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PostFields"}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PostFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Post"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"replyCount"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"favorites"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"media"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}}]}}]}}]} as unknown as DocumentNode<FollowersTopLevelPostsQuery, FollowersTopLevelPostsQueryVariables>;
export const MeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
export const SearchUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchUsers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"keyword"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchUsers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"keyword"},"value":{"kind":"Variable","name":{"kind":"Name","value":"keyword"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]} as unknown as DocumentNode<SearchUsersQuery, SearchUsersQueryVariables>;
export const UpdateUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateUserMutation, UpdateUserMutationVariables>;
export const PresignedAvatarUploadUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PresignedAvatarUploadUrl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"presignedAvatarUploadUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contentType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentType"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uploadUrl"}},{"kind":"Field","name":{"kind":"Name","value":"objectKey"}}]}}]}}]} as unknown as DocumentNode<PresignedAvatarUploadUrlQuery, PresignedAvatarUploadUrlQueryVariables>;
export const SetAvatarDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetAvatar"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"objectKey"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setAvatar"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"objectKey"},"value":{"kind":"Variable","name":{"kind":"Name","value":"objectKey"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<SetAvatarMutation, SetAvatarMutationVariables>;
export const DeleteAvatarDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAvatar"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAvatar"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<DeleteAvatarMutation, DeleteAvatarMutationVariables>;
export const DeleteMyAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteMyAccount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteMyAccount"}}]}}]} as unknown as DocumentNode<DeleteMyAccountMutation, DeleteMyAccountMutationVariables>;
export const GetProfileByUserIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProfileByUserID"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getProfileByUserID"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<GetProfileByUserIdQuery, GetProfileByUserIdQueryVariables>;
export const UpdateProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateProfileInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateProfileMutation, UpdateProfileMutationVariables>;
export const CreateReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateReport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateReportInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"targetType"}},{"kind":"Field","name":{"kind":"Name","value":"targetID"}},{"kind":"Field","name":{"kind":"Name","value":"reporter"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"accountID"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"customReason"}}]}}]}}]} as unknown as DocumentNode<CreateReportMutation, CreateReportMutationVariables>;
export const MyTermsConsentStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyTermsConsentStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myTermsConsentStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isConsented"}},{"kind":"Field","name":{"kind":"Name","value":"currentTerms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"documentUrl"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveDate"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<MyTermsConsentStatusQuery, MyTermsConsentStatusQueryVariables>;
export const ConsentToTermsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ConsentToTerms"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"termsID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"consentToTerms"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"termsID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"termsID"}}}]}]}}]} as unknown as DocumentNode<ConsentToTermsMutation, ConsentToTermsMutationVariables>;
export const CurrentTermsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CurrentTerms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentTerms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ID"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"documentUrl"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveDate"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<CurrentTermsQuery, CurrentTermsQueryVariables>;