/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  mutation CreateAdministrator($input: CreateAdministratorInput!) {\n    createAdministrator(input: $input) {\n      ID\n      name\n      email\n    }\n  }\n": typeof types.CreateAdministratorDocument,
    "\n  query GetAdministratorByID($id: ID!) {\n    getAdministratorByID(id: $id) {\n      ID\n      name\n      email\n    }\n  }\n": typeof types.GetAdministratorByIdDocument,
    "\n  query SearchAdministrators($name: String!) {\n    searchAdministrators(name: $name) {\n      ID\n      name\n      email\n    }\n  }\n": typeof types.SearchAdministratorsDocument,
    "\n  query Administrators($limit: Int, $offset: Int) {\n    administrators(limit: $limit, offset: $offset) {\n      items {\n        ID\n        name\n        email\n      }\n      total\n    }\n  }\n": typeof types.AdministratorsDocument,
    "\n  mutation DeleteAdministrator($id: ID!) {\n    deleteAdministrator(id: $id)\n  }\n": typeof types.DeleteAdministratorDocument,
    "\n  mutation UpdateAdministrator($id: ID!, $input: UpdateAdministratorInput!) {\n    updateAdministrator(id: $id, input: $input) {\n      ID\n      name\n      email\n    }\n  }\n": typeof types.UpdateAdministratorDocument,
    "\n  query AdminGetAnalytics {\n    adminGetAnalytics {\n      totalUsers newUsersToday newUsersThisWeek newUsersThisMonth frozenUsersCount\n      totalPosts totalComments totalDeletedPosts totalLikes totalCommunities\n      totalMessages totalReports totalBlocks totalInquiries\n      currentActiveUsers dau wau mau dauMauRatio\n      postsToday commentsToday messagesToday\n      avgLikesPerPost avgCommentsPerPost\n      postsTextOnly postsWithImage postsWithVideo\n      uniqueDMSenders\n      activeCommunitiesLast30Days avgCommunityMembers avgCommunitiesPerUser\n      totalFollows avgFollowersPerUser avgFollowingPerUser\n      usersWithProfile usersWithAvatar usersWithPost\n      onboardingCompleteRate avgTimeToFirstPostMinutes\n      totalNotifications readNotifications notificationReadRate\n      pendingReports resolvedReports\n      webSocketConnections sseConnections errorRate5xx p50ResponseTimeMs p95ResponseTimeMs p99ResponseTimeMs\n      avgSessionDurationSeconds avgSessionsPerDay avgScrollDepth\n      pageViewStats { pagePath avgDurationSeconds avgMaxScrollDepth totalViews }\n    }\n  }\n": typeof types.AdminGetAnalyticsDocument,
    "\n  query AdminGetCommunityAnalytics($limit: Int, $offset: Int) {\n    adminGetCommunityAnalytics(limit: $limit, offset: $offset) {\n      items { communityID name memberCount messageCount }\n      total\n    }\n  }\n": typeof types.AdminGetCommunityAnalyticsDocument,
    "\n  query AdminGetTimeSeries($granularity: TimeSeriesGranularity!, $from: String!, $to: String!) {\n    adminGetTimeSeries(granularity: $granularity, from: $from, to: $to) {\n      points { label posts comments messages newUsers likes activeUsers }\n    }\n  }\n": typeof types.AdminGetTimeSeriesDocument,
    "\n  query GetAnnouncement($id: ID!) {\n    announcement(id: $id) {\n      ID\n      title\n      body\n      createdAt\n    }\n  }\n": typeof types.GetAnnouncementDocument,
    "\n  query AdminListAnnouncements($limit: Int, $offset: Int) {\n    adminListAnnouncements(limit: $limit, offset: $offset) {\n      items {\n        ID\n        title\n        body\n        createdAt\n      }\n      total\n    }\n  }\n": typeof types.AdminListAnnouncementsDocument,
    "\n  mutation CreateAnnouncement($input: CreateAnnouncementInput!) {\n    createAnnouncement(input: $input) {\n      ID\n      title\n      body\n      createdAt\n    }\n  }\n": typeof types.CreateAnnouncementDocument,
    "\n  mutation UpdateAnnouncement($id: ID!, $input: UpdateAnnouncementInput!) {\n    updateAnnouncement(id: $id, input: $input) {\n      ID\n      title\n      body\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.UpdateAnnouncementDocument,
    "\n  mutation DeleteAnnouncement($id: ID!) {\n    deleteAnnouncement(id: $id)\n  }\n": typeof types.DeleteAnnouncementDocument,
    "\n  mutation LoginAdmin($input: LoginInput!) {\n    loginAdministrator(input: $input) {\n      token\n      refreshToken\n      administrator {\n        ID\n        name\n        email\n      }\n    }\n  }\n": typeof types.LoginAdminDocument,
    "\n  mutation LogoutAdmin($token: String!) {\n    logoutAdministrator(token: $token)\n  }\n": typeof types.LogoutAdminDocument,
    "\n  query Communities($limit: Int, $offset: Int) {\n    communities(limit: $limit, offset: $offset) {\n      items {\n        ID\n        roomID\n        name\n        description\n        createdAt\n        updatedAt\n      }\n      total\n    }\n  }\n": typeof types.CommunitiesDocument,
    "\n  mutation AdminUpdateCommunity($id: ID!, $input: UpdateCommunityInput!) {\n    updateCommunity(id: $id, input: $input) {\n      ID\n      roomID\n      name\n      description\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.AdminUpdateCommunityDocument,
    "\n  mutation KickUserFromCommunity($communityID: ID!, $userID: ID!) {\n    kickUserFromCommunity(communityID: $communityID, userID: $userID)\n  }\n": typeof types.KickUserFromCommunityDocument,
    "\n  query AdminGetRoom($id: ID!) {\n    room(id: $id) {\n      ID\n      name\n      user {\n        ID\n        accountID\n        name\n        email\n      }\n    }\n  }\n": typeof types.AdminGetRoomDocument,
    "\n  query AdminGetCommunityMembers($communityID: ID!) {\n    getCommunityMembers(communityID: $communityID) {\n      user {\n        ID\n        accountID\n        name\n        email\n      }\n      role\n    }\n  }\n": typeof types.AdminGetCommunityMembersDocument,
    "\n  query AdminListMessages($roomID: ID!, $limit: Int) {\n    messages(roomID: $roomID, limit: $limit) {\n      items {\n        ID\n        roomID\n        user {\n          ID\n          name\n          accountID\n          avatarUrl\n        }\n        content\n        media {\n          ID\n          url\n          contentType\n        }\n        createdAt\n        updatedAt\n      }\n    }\n  }\n": typeof types.AdminListMessagesDocument,
    "\n  mutation PromoteToCommunityOwner($communityID: ID!, $userID: ID!) {\n    promoteToCommunityOwner(communityID: $communityID, userID: $userID)\n  }\n": typeof types.PromoteToCommunityOwnerDocument,
    "\n  mutation DemoteFromCommunityOwner($communityID: ID!, $userID: ID!) {\n    demoteFromCommunityOwner(communityID: $communityID, userID: $userID)\n  }\n": typeof types.DemoteFromCommunityOwnerDocument,
    "\n  mutation DeleteMessage($roomID: ID!, $id: ID!) {\n    deleteMessage(roomID: $roomID, id: $id)\n  }\n": typeof types.DeleteMessageDocument,
    "\n  query SearchInquiries($status: InquiryStatus, $limit: Int, $offset: Int) {\n    searchInquiries(status: $status, limit: $limit, offset: $offset) {\n      items {\n        id\n        name\n        email\n        category\n        subject\n        content\n        status\n        createdAt\n        updatedAt\n      }\n      total\n    }\n  }\n": typeof types.SearchInquiriesDocument,
    "\n  query GetInquiry($id: ID!) {\n    getInquiry(id: $id) {\n      id\n      name\n      email\n      category\n      subject\n      content\n      status\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.GetInquiryDocument,
    "\n  mutation UpdateInquiryStatus($id: ID!, $status: InquiryStatus!) {\n    updateInquiryStatus(id: $id, status: $status) {\n      id\n      status\n    }\n  }\n": typeof types.UpdateInquiryStatusDocument,
    "\n  mutation ToggleMaintenanceMode($enabled: Boolean!) {\n    toggleMaintenanceMode(enabled: $enabled)\n  }\n": typeof types.ToggleMaintenanceModeDocument,
    "\n  query MaintenanceMode {\n    maintenanceMode\n  }\n": typeof types.MaintenanceModeDocument,
    "\n  fragment AdminPostFields on Post {\n    ID\n    content\n    createdAt\n    updatedAt\n    deletedAt\n    replyCount\n    user {\n      ID\n      name\n      accountID\n      avatarUrl\n    }\n    favorites {\n      ID\n      user {\n        ID\n      }\n    }\n    media {\n      ID\n      url\n      contentType\n      createdAt\n    }\n  }\n": typeof types.AdminPostFieldsFragmentDoc,
    "\n  query GetAdminPosts($limit: Int, $offset: Int) {\n    posts(limit: $limit, offset: $offset) {\n      items {\n        ...AdminPostFields\n        replies {\n          ID\n        }\n      }\n      total\n    }\n  }\n": typeof types.GetAdminPostsDocument,
    "\n  query GetPostByIDIncludeDeleted($id: ID!) {\n    getPostByIDIncludeDeleted(id: $id) {\n      ...AdminPostFields\n      rootPost {\n        ...AdminPostFields\n      }\n      replies {\n        ...AdminPostFields\n        replies {\n          ...AdminPostFields\n          replies {\n            ...AdminPostFields\n            replies {\n              ...AdminPostFields\n              replies {\n                ID\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n": typeof types.GetPostByIdIncludeDeletedDocument,
    "\n  mutation AdminDeletePost($id: ID!) {\n    adminDeletePost(id: $id)\n  }\n": typeof types.AdminDeletePostDocument,
    "\n  query AdminGetBlockers($userID: ID!) {\n    adminGetBlockers(userID: $userID) {\n      ID\n      name\n      accountID\n      avatarUrl\n    }\n  }\n": typeof types.AdminGetBlockersDocument,
    "\n  query AdminGetFavoriteUsers($userID: ID!) {\n    adminGetFavoriteUsers(userID: $userID) {\n      ID\n      name\n      accountID\n      avatarUrl\n    }\n  }\n": typeof types.AdminGetFavoriteUsersDocument,
    "\n  query SearchReports($filter: ReportSearchFilter, $limit: Int, $offset: Int) {\n    searchReports(filter: $filter, limit: $limit, offset: $offset) {\n      items {\n        ID\n        targetType\n        targetID\n        reason\n        customReason\n        content\n        status\n        createdAt\n      }\n      total\n    }\n  }\n": typeof types.SearchReportsDocument,
    "\n  mutation UpdateReportStatus($id: ID!, $status: ReportStatus!) {\n    updateReportStatus(id: $id, status: $status) {\n      ID\n      status\n    }\n  }\n": typeof types.UpdateReportStatusDocument,
    "\n  mutation AdminCreateReport($input: CreateReportInput!) {\n    createReport(input: $input) {\n      ID\n      status\n    }\n  }\n": typeof types.AdminCreateReportDocument,
    "\n  query GetReportServiceStatus {\n    isReportServiceEnabled\n  }\n": typeof types.GetReportServiceStatusDocument,
    "\n  mutation SetReportServiceStatus($enabled: Boolean!) {\n    setReportServiceStatus(enabled: $enabled)\n  }\n": typeof types.SetReportServiceStatusDocument,
    "\n  query PresignedTermsDocumentUploadUrl {\n    presignedTermsDocumentUploadUrl {\n      uploadUrl\n      objectKey\n    }\n  }\n": typeof types.PresignedTermsDocumentUploadUrlDocument,
    "\n  query AdminListTerms {\n    adminListTerms {\n      ID\n      version\n      documentUrl\n      effectiveDate\n      createdAt\n    }\n  }\n": typeof types.AdminListTermsDocument,
    "\n  query AdminListConsents($termsID: ID!, $limit: Int, $offset: Int) {\n    adminListConsents(termsID: $termsID, limit: $limit, offset: $offset) {\n      items {\n        ID\n        user {\n          ID\n          accountID\n          name\n          email\n        }\n        consentedAt\n      }\n      total\n    }\n  }\n": typeof types.AdminListConsentsDocument,
    "\n  mutation CreateTermsOfService($input: CreateTermsOfServiceInput!) {\n    createTermsOfService(input: $input) {\n      ID\n      version\n      documentUrl\n      effectiveDate\n      createdAt\n    }\n  }\n": typeof types.CreateTermsOfServiceDocument,
    "\n  query Users($limit: Int, $offset: Int) {\n    users(limit: $limit, offset: $offset) {\n      items {\n        ID\n        accountID\n        name\n        email\n        role\n        status\n        createdAt\n        updatedAt\n      }\n      total\n    }\n  }\n": typeof types.UsersDocument,
    "\n  query AdminSearchUsers($keyword: String!) {\n    searchUsers(keyword: $keyword) {\n      items {\n        ID\n        accountID\n        name\n        email\n        role\n        status\n        createdAt\n        updatedAt\n      }\n      total\n    }\n  }\n": typeof types.AdminSearchUsersDocument,
    "\n  query GetUserByID($id: ID!) {\n    getUserByID(id: $id) {\n      ID\n      accountID\n      name\n      email\n      role\n      status\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.GetUserByIdDocument,
    "\n  mutation DeleteUser($id: ID!) {\n    deleteUser(id: $id)\n  }\n": typeof types.DeleteUserDocument,
    "\n  mutation FreezeUser($id: ID!) {\n    freezeUser(id: $id)\n  }\n": typeof types.FreezeUserDocument,
    "\n  mutation UnfreezeUser($id: ID!) {\n    unfreezeUser(id: $id)\n  }\n": typeof types.UnfreezeUserDocument,
    "\n  mutation AdminUpdateUser($id: ID!, $input: UpdateUserInput!) {\n    adminUpdateUser(id: $id, input: $input) {\n      ID\n      accountID\n      name\n      email\n      role\n      status\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.AdminUpdateUserDocument,
    "\n  mutation AdminUpdateProfile($userID: ID!, $input: UpdateProfileInput!) {\n    adminUpdateProfile(userID: $userID, input: $input) {\n      username\n      bio\n      avatarUrl\n      createdAt\n      updatedAt\n      user {\n        ID\n        accountID\n        name\n        email\n        role\n        status\n      }\n    }\n  }\n": typeof types.AdminUpdateProfileDocument,
    "\n  query AdminGetProfileByUserID($userID: ID!) {\n    getProfileByUserID(userID: $userID) {\n      username\n      bio\n      avatarUrl\n      createdAt\n      updatedAt\n      user {\n        ID\n        accountID\n        name\n        email\n        role\n        status\n      }\n    }\n  }\n": typeof types.AdminGetProfileByUserIdDocument,
    "\n  query ListAnnouncements($limit: Int, $offset: Int) {\n    announcements(limit: $limit, offset: $offset) {\n      items {\n        ID\n        title\n        body\n        createdAt\n      }\n      total\n    }\n  }\n": typeof types.ListAnnouncementsDocument,
    "\n  mutation LoginUser($input: LoginInput!) {\n    loginUser(input: $input) {\n      token\n      refreshToken\n      user {\n        ID\n        accountID\n        name\n        email\n        role\n        status\n      }\n    }\n  }\n": typeof types.LoginUserDocument,
    "\n  mutation LogoutUser($token: String!) {\n    logoutUser(token: $token)\n  }\n": typeof types.LogoutUserDocument,
    "\n  mutation SendEmailOTP($email: String!) {\n    sendEmailOTP(email: $email)\n  }\n": typeof types.SendEmailOtpDocument,
    "\n  mutation VerifyEmailOTP($email: String!, $otp: String!) {\n    verifyEmailOTP(email: $email, otp: $otp)\n  }\n": typeof types.VerifyEmailOtpDocument,
    "\n  mutation CreateUser($input: CreateUserInput!) {\n    createUser(input: $input) {\n      ID\n      accountID\n      name\n      email\n      role\n      status\n    }\n  }\n": typeof types.CreateUserDocument,
    "\n  mutation RequestPasswordReset($email: String!) {\n    requestPasswordReset(email: $email)\n  }\n": typeof types.RequestPasswordResetDocument,
    "\n  mutation VerifyPasswordResetOTP($email: String!, $otp: String!) {\n    verifyPasswordResetOTP(email: $email, otp: $otp)\n  }\n": typeof types.VerifyPasswordResetOtpDocument,
    "\n  mutation ResetPassword($resetToken: String!, $newPassword: String!) {\n    resetPassword(resetToken: $resetToken, newPassword: $newPassword)\n  }\n": typeof types.ResetPasswordDocument,
    "\n  query GetBlockersByUserID($userID: ID!) {\n    GetBlockersByUserID(userID: $userID) {\n      ID\n      name\n      accountID\n      avatarUrl\n    }\n  }\n": typeof types.GetBlockersByUserIdDocument,
    "\n  mutation CreateBlocker($blockedUserID: ID!) {\n    createBlocker(blockedUserID: $blockedUserID) {\n      ID\n      userID\n      blockedUserID\n      createdAt\n    }\n  }\n": typeof types.CreateBlockerDocument,
    "\n  mutation DeleteBlocker($blockedUserID: ID!) {\n    deleteBlocker(blockedUserID: $blockedUserID)\n  }\n": typeof types.DeleteBlockerDocument,
    "\n  query ListBlockedUsers($limit: Int, $offset: Int) {\n    listBlockedUsers(limit: $limit, offset: $offset) {\n      items {\n        ID\n        name\n        accountID\n        avatarUrl\n      }\n      total\n    }\n  }\n": typeof types.ListBlockedUsersDocument,
    "\n  query MyCommunities($limit: Int, $offset: Int) {\n    myCommunities(limit: $limit, offset: $offset) {\n      items {\n        ID\n        roomID\n        name\n        description\n        avatarURL\n        memberCount\n        isMember\n        unreadCount\n        lastMessage\n        createdAt\n        updatedAt\n      }\n      total\n    }\n  }\n": typeof types.MyCommunitiesDocument,
    "\n  query SearchCommunities($name: String!, $limit: Int, $offset: Int) {\n    searchCommunities(name: $name, limit: $limit, offset: $offset) {\n      items {\n        ID\n        roomID\n        name\n        description\n        avatarURL\n        memberCount\n        isMember\n        createdAt\n        updatedAt\n      }\n      total\n    }\n  }\n": typeof types.SearchCommunitiesDocument,
    "\n  mutation CreateCommunity($input: CreateCommunityInput!) {\n    createCommunity(input: $input) {\n      ID\n      roomID\n      name\n      description\n      avatarURL\n      memberCount\n      isMember\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.CreateCommunityDocument,
    "\n  mutation JoinRoom($roomID: ID!) {\n    joinRoom(roomID: $roomID)\n  }\n": typeof types.JoinRoomDocument,
    "\n  mutation RemoveUserFromRoom($input: RemoveUserFromRoomInput!) {\n    removeUserFromRoom(input: $input)\n  }\n": typeof types.RemoveUserFromRoomDocument,
    "\n  query GetMyRoleInCommunity($communityID: ID!) {\n    getMyRoleInCommunity(communityID: $communityID)\n  }\n": typeof types.GetMyRoleInCommunityDocument,
    "\n  query GetCommunityMembers($communityID: ID!) {\n    getCommunityMembers(communityID: $communityID) {\n      user {\n        ID\n        accountID\n        name\n        email\n        avatarUrl\n      }\n      role\n    }\n  }\n": typeof types.GetCommunityMembersDocument,
    "\n  mutation UpdateCommunity($id: ID!, $input: UpdateCommunityInput!) {\n    updateCommunity(id: $id, input: $input) {\n      ID\n      roomID\n      name\n      description\n      avatarURL\n      memberCount\n      isMember\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.UpdateCommunityDocument,
    "\n  mutation UpdateCommunityMembers($communityID: ID!, $updates: [CommunityMemberUpdateInput!]!) {\n    updateCommunityMembers(communityID: $communityID, updates: $updates)\n  }\n": typeof types.UpdateCommunityMembersDocument,
    "\n  query RandomCommunities($limit: Int!) {\n    randomCommunities(limit: $limit) {\n      ID\n      roomID\n      name\n      description\n      avatarURL\n      memberCount\n      isMember\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.RandomCommunitiesDocument,
    "\n  query PresignedCommunityIconUploadUrl($contentType: String!) {\n    presignedCommunityIconUploadUrl(contentType: $contentType) {\n      uploadUrl\n      objectKey\n    }\n  }\n": typeof types.PresignedCommunityIconUploadUrlDocument,
    "\n  query MyUnreadCommunityCount {\n    myUnreadCommunityCount\n  }\n": typeof types.MyUnreadCommunityCountDocument,
    "\n  query GetFavoriteUsersByUserID($userID: ID!) {\n    GetFavoriteUsersByUserID(userID: $userID) {\n      ID\n      name\n      accountID\n      avatarUrl\n    }\n  }\n": typeof types.GetFavoriteUsersByUserIdDocument,
    "\n  mutation CreateFavoriteUser($favoriteUserID: ID!) {\n    createFavoriteUser(favoriteUserID: $favoriteUserID) {\n      ID\n      userID\n      favoriteUserID\n      createdAt\n    }\n  }\n": typeof types.CreateFavoriteUserDocument,
    "\n  mutation DeleteFavoriteUser($favoriteUserID: ID!) {\n    deleteFavoriteUser(favoriteUserID: $favoriteUserID)\n  }\n": typeof types.DeleteFavoriteUserDocument,
    "\n  query ListFavoriteUsers($limit: Int, $offset: Int) {\n    listFavoriteUsers(limit: $limit, offset: $offset) {\n      items {\n        ID\n        name\n        accountID\n        avatarUrl\n      }\n      total\n    }\n  }\n": typeof types.ListFavoriteUsersDocument,
    "\n  query MyFollowers($limit: Int, $offset: Int) {\n    myFollowers(limit: $limit, offset: $offset) {\n      items {\n        ID\n        name\n        accountID\n        avatarUrl\n      }\n      total\n    }\n  }\n": typeof types.MyFollowersDocument,
    "\n  mutation CreateInquiry($input: CreateInquiryInput!) {\n    createInquiry(input: $input) {\n      id\n      name\n      email\n      category\n      subject\n      content\n      createdAt\n    }\n  }\n": typeof types.CreateInquiryDocument,
    "\n  mutation MarkRoomAsRead($roomID: ID!) {\n    markRoomAsRead(roomID: $roomID)\n  }\n": typeof types.MarkRoomAsReadDocument,
    "\n  mutation GetOrCreateDMRoom($targetUserID: ID!) {\n    getOrCreateDMRoom(targetUserID: $targetUserID) {\n      ID\n      name\n      type\n      user {\n        ID\n        name\n        accountID\n        avatarUrl\n      }\n      isMessagingDisabled\n      lastReadAt\n      unreadCount\n      partnerLastReadAt\n      content\n    }\n  }\n": typeof types.GetOrCreateDmRoomDocument,
    "\n  mutation SendMessage($roomID: ID!, $content: String!, $mediaInputs: [MediaUploadInput!]) {\n    sendMessage(roomID: $roomID, content: $content, mediaInputs: $mediaInputs) {\n      ID\n      roomID\n      user {\n        ID\n        name\n        accountID\n        avatarUrl\n      }\n      content\n      media {\n        ID\n        url\n        contentType\n      }\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.SendMessageDocument,
    "\n  mutation UpdateMessage($roomID: ID!, $id: ID!, $content: String!) {\n    updateMessage(roomID: $roomID, id: $id, content: $content) {\n      ID\n      roomID\n      user {\n        ID\n        name\n        accountID\n        avatarUrl\n      }\n      content\n      media {\n        ID\n        url\n        contentType\n      }\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.UpdateMessageDocument,
    "\n  mutation DeleteRoom($roomID: ID!) {\n    deleteRoom(roomID: $roomID)\n  }\n": typeof types.DeleteRoomDocument,
    "\n  query ListMessages($roomID: ID!, $limit: Int, $before: ID, $after: ID, $afterTime: String) {\n    messages(roomID: $roomID, limit: $limit, before: $before, after: $after, afterTime: $afterTime) {\n      items {\n        ID\n        roomID\n        user {\n          ID\n          name\n          accountID\n          avatarUrl\n        }\n        content\n        media {\n          ID\n          url\n          contentType\n        }\n        createdAt\n        updatedAt\n      }\n      hasMoreBefore\n      hasMoreAfter\n    }\n  }\n": typeof types.ListMessagesDocument,
    "\n  query GetRoom($id: ID!) {\n    room(id: $id) {\n      ID\n      name\n      type\n      user {\n        ID\n        name\n        accountID\n        avatarUrl\n      }\n      isMessagingDisabled\n      lastReadAt\n      unreadCount\n      partnerLastReadAt\n      content\n    }\n  }\n": typeof types.GetRoomDocument,
    "\n  query MyDMRooms($limit: Int, $offset: Int) {\n    myDMRooms(limit: $limit, offset: $offset) {\n      items {\n        ID\n        name\n        type\n        user {\n          ID\n          name\n          accountID\n          avatarUrl\n        }\n        isMessagingDisabled\n        lastReadAt\n        unreadCount\n        partnerLastReadAt\n        content\n      }\n      total\n    }\n  }\n": typeof types.MyDmRoomsDocument,
    "\n  query PresignedMediaUploadUrl($contentType: String!) {\n    presignedMediaUploadUrl(contentType: $contentType) {\n      uploadUrl\n      objectKey\n    }\n  }\n": typeof types.PresignedMediaUploadUrlDocument,
    "\n  query MyUnreadDMCount {\n    myUnreadDMCount\n  }\n": typeof types.MyUnreadDmCountDocument,
    "\n  query MyNotifications($limit: Int, $offset: Int, $type: String, $actorID: ID) {\n    myNotifications(limit: $limit, offset: $offset, type: $type, actorID: $actorID) {\n      items {\n        ID\n        type\n        actor {\n          ID\n          name\n          accountID\n          avatarUrl\n        }\n        targetType\n        targetID\n        targetPost {\n          ID\n          content\n          deletedAt\n          user {\n            ID\n            name\n            accountID\n          }\n          media {\n            ID\n            url\n            contentType\n          }\n        }\n        message\n        isRead\n        createdAt\n      }\n      total\n    }\n  }\n": typeof types.MyNotificationsDocument,
    "\n  query MyNotificationGroups($limit: Int, $offset: Int) {\n    myNotificationGroups(limit: $limit, offset: $offset) {\n      items {\n        key\n        type\n        actor {\n          ID\n          name\n          accountID\n          avatarUrl\n        }\n        targetType\n        targetID\n        targetPost {\n          ID\n          content\n          deletedAt\n          user {\n            ID\n            name\n            accountID\n          }\n          media {\n            ID\n            url\n            contentType\n          }\n        }\n        message\n        createdAt\n        count\n        unreadCount\n        latestID\n      }\n      total\n    }\n  }\n": typeof types.MyNotificationGroupsDocument,
    "\n  query Notification($id: ID!) {\n    notification(id: $id) {\n      ID\n      type\n      actor {\n        ID\n        name\n        accountID\n        avatarUrl\n      }\n      targetType\n      targetID\n      targetPost {\n        ID\n        content\n        deletedAt\n        user {\n          ID\n          name\n          accountID\n        }\n        media {\n          ID\n          url\n          contentType\n        }\n      }\n      message\n      isRead\n      createdAt\n    }\n  }\n": typeof types.NotificationDocument,
    "\n  query MyUnreadNotificationCount {\n    myUnreadNotificationCount\n  }\n": typeof types.MyUnreadNotificationCountDocument,
    "\n  mutation MarkNotificationAsRead($id: ID!) {\n    markNotificationAsRead(id: $id)\n  }\n": typeof types.MarkNotificationAsReadDocument,
    "\n  mutation MarkAllNotificationsAsRead {\n    markAllNotificationsAsRead\n  }\n": typeof types.MarkAllNotificationsAsReadDocument,
    "\n  mutation MarkAllNotificationsAsReadByActor($type: String!, $actorID: ID!) {\n    markAllNotificationsAsReadByActor(type: $type, actorID: $actorID)\n  }\n": typeof types.MarkAllNotificationsAsReadByActorDocument,
    "\n  mutation DeleteNotifications($ids: [ID!]!) {\n    deleteNotifications(ids: $ids)\n  }\n": typeof types.DeleteNotificationsDocument,
    "\n  mutation DeleteReadNotifications {\n    deleteReadNotifications\n  }\n": typeof types.DeleteReadNotificationsDocument,
    "\n  mutation DeleteReadNotificationsByActor($type: String!, $actorID: ID!) {\n    deleteReadNotificationsByActor(type: $type, actorID: $actorID)\n  }\n": typeof types.DeleteReadNotificationsByActorDocument,
    "\n  fragment PostFields on Post {\n    ID\n    content\n    createdAt\n    replyCount\n    deletedAt\n    user {\n      ID\n      name\n      accountID\n      avatarUrl\n    }\n    favorites {\n      ID\n      user {\n        ID\n      }\n    }\n    media {\n      ID\n      url\n      contentType\n    }\n  }\n": typeof types.PostFieldsFragmentDoc,
    "\n  query TopLevelPosts($limit: Int, $offset: Int) {\n    topLevelPosts(limit: $limit, offset: $offset) {\n      items {\n        ...PostFields\n        replies {\n          ID\n        }\n      }\n      total\n    }\n  }\n": typeof types.TopLevelPostsDocument,
    "\n  query GetPostByID($id: ID!) {\n    getPostByID(id: $id) {\n      ...PostFields\n      rootPost {\n        ...PostFields\n      }\n      replies {\n        ...PostFields\n        replies {\n          ...PostFields\n          replies {\n            ...PostFields\n            replies {\n              ...PostFields\n              replies {\n                ID\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n": typeof types.GetPostByIdDocument,
    "\n  query GetPostsByUserID($user_id: ID!, $limit: Int, $offset: Int) {\n    getPostsByUserID(user_id: $user_id, limit: $limit, offset: $offset) {\n      items {\n        ...PostFields\n        replies {\n          ID\n        }\n      }\n      total\n    }\n  }\n": typeof types.GetPostsByUserIdDocument,
    "\n  query GetFavoritePostsByUserID($user_id: ID!, $limit: Int, $offset: Int) {\n    getFavoritePostsByUserID(user_id: $user_id, limit: $limit, offset: $offset) {\n      items {\n        ...PostFields\n        replies {\n          ID\n        }\n      }\n      total\n    }\n  }\n": typeof types.GetFavoritePostsByUserIdDocument,
    "\n  mutation CreatePost($input: CreatePostInput!) {\n    createPost(input: $input) {\n      ...PostFields\n      replies {\n        ID\n      }\n    }\n  }\n": typeof types.CreatePostDocument,
    "\n  mutation UpdatePost($input: UpdatePostInput!) {\n    updatePost(input: $input) {\n      ...PostFields\n      replies {\n        ID\n      }\n    }\n  }\n": typeof types.UpdatePostDocument,
    "\n  mutation DeletePost($id: ID!) {\n    deletePost(id: $id)\n  }\n": typeof types.DeletePostDocument,
    "\n  mutation CreateFavorite($input: CreateFavoriteInput!) {\n    createFavorite(input: $input) {\n      ID\n      user {\n        ID\n      }\n    }\n  }\n": typeof types.CreateFavoriteDocument,
    "\n  mutation DeleteFavorite($input: DeleteFavoriteInput!) {\n    deleteFavorite(input: $input)\n  }\n": typeof types.DeleteFavoriteDocument,
    "\n  query NewFeedPostsCount($since: String!) {\n    newFeedPostsCount(since: $since)\n  }\n": typeof types.NewFeedPostsCountDocument,
    "\n  query SearchPosts($keyword: String!) {\n    searchPosts(keyword: $keyword) {\n      ...PostFields\n      replies {\n        ID\n      }\n    }\n  }\n": typeof types.SearchPostsDocument,
    "\n  query FollowersTopLevelPosts($userID: ID!, $limit: Int, $offset: Int) {\n    followersTopLevelPosts(userID: $userID, limit: $limit, offset: $offset) {\n      items {\n        ...PostFields\n        replies {\n          ID\n        }\n      }\n      total\n    }\n  }\n": typeof types.FollowersTopLevelPostsDocument,
    "\n  query Me {\n    me {\n      ID\n      accountID\n      name\n      email\n      role\n      status\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.MeDocument,
    "\n  query SearchUsers($keyword: String!, $limit: Int, $offset: Int) {\n    searchUsers(keyword: $keyword, limit: $limit, offset: $offset) {\n      items {\n        ID\n        accountID\n        name\n        email\n        role\n        status\n        avatarUrl\n        createdAt\n        updatedAt\n      }\n      total\n    }\n  }\n": typeof types.SearchUsersDocument,
    "\n  mutation UpdateUser($input: UpdateUserInput!) {\n    updateUser(input: $input) {\n      ID\n      accountID\n      name\n      email\n      role\n      status\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.UpdateUserDocument,
    "\n  query PresignedAvatarUploadUrl($contentType: String!) {\n    presignedAvatarUploadUrl(contentType: $contentType) {\n      uploadUrl\n      objectKey\n    }\n  }\n": typeof types.PresignedAvatarUploadUrlDocument,
    "\n  mutation SetAvatar($objectKey: String!) {\n    setAvatar(objectKey: $objectKey) {\n      username\n      bio\n      avatarUrl\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.SetAvatarDocument,
    "\n  mutation DeleteAvatar {\n    deleteAvatar {\n      username\n      bio\n      avatarUrl\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.DeleteAvatarDocument,
    "\n  mutation DeleteMyAccount {\n    deleteMyAccount\n  }\n": typeof types.DeleteMyAccountDocument,
    "\n  query GetProfileByUserID($userID: ID!) {\n    getProfileByUserID(userID: $userID) {\n      username\n      bio\n      avatarUrl\n      createdAt\n      updatedAt\n      user {\n        ID\n        accountID\n        name\n        email\n        role\n        status\n        avatarUrl\n        createdAt\n        updatedAt\n      }\n    }\n  }\n": typeof types.GetProfileByUserIdDocument,
    "\n  mutation UpdateProfile($input: UpdateProfileInput!) {\n    updateProfile(input: $input) {\n      username\n      bio\n      avatarUrl\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.UpdateProfileDocument,
    "\n  mutation CreateReport($input: CreateReportInput!) {\n    createReport(input: $input) {\n      ID\n      targetType\n      targetID\n      reporter {\n        ID\n        name\n        accountID\n      }\n      reason\n      customReason\n    }\n  }\n": typeof types.CreateReportDocument,
    "\n  query MyTermsConsentStatus {\n    myTermsConsentStatus {\n      isConsented\n      currentTerms {\n        ID\n        version\n        documentUrl\n        effectiveDate\n        createdAt\n      }\n    }\n  }\n": typeof types.MyTermsConsentStatusDocument,
    "\n  mutation ConsentToTerms($termsID: ID!) {\n    consentToTerms(termsID: $termsID)\n  }\n": typeof types.ConsentToTermsDocument,
    "\n  query CurrentTerms {\n    currentTerms {\n      ID\n      version\n      documentUrl\n      effectiveDate\n      createdAt\n    }\n  }\n": typeof types.CurrentTermsDocument,
};
const documents: Documents = {
    "\n  mutation CreateAdministrator($input: CreateAdministratorInput!) {\n    createAdministrator(input: $input) {\n      ID\n      name\n      email\n    }\n  }\n": types.CreateAdministratorDocument,
    "\n  query GetAdministratorByID($id: ID!) {\n    getAdministratorByID(id: $id) {\n      ID\n      name\n      email\n    }\n  }\n": types.GetAdministratorByIdDocument,
    "\n  query SearchAdministrators($name: String!) {\n    searchAdministrators(name: $name) {\n      ID\n      name\n      email\n    }\n  }\n": types.SearchAdministratorsDocument,
    "\n  query Administrators($limit: Int, $offset: Int) {\n    administrators(limit: $limit, offset: $offset) {\n      items {\n        ID\n        name\n        email\n      }\n      total\n    }\n  }\n": types.AdministratorsDocument,
    "\n  mutation DeleteAdministrator($id: ID!) {\n    deleteAdministrator(id: $id)\n  }\n": types.DeleteAdministratorDocument,
    "\n  mutation UpdateAdministrator($id: ID!, $input: UpdateAdministratorInput!) {\n    updateAdministrator(id: $id, input: $input) {\n      ID\n      name\n      email\n    }\n  }\n": types.UpdateAdministratorDocument,
    "\n  query AdminGetAnalytics {\n    adminGetAnalytics {\n      totalUsers newUsersToday newUsersThisWeek newUsersThisMonth frozenUsersCount\n      totalPosts totalComments totalDeletedPosts totalLikes totalCommunities\n      totalMessages totalReports totalBlocks totalInquiries\n      currentActiveUsers dau wau mau dauMauRatio\n      postsToday commentsToday messagesToday\n      avgLikesPerPost avgCommentsPerPost\n      postsTextOnly postsWithImage postsWithVideo\n      uniqueDMSenders\n      activeCommunitiesLast30Days avgCommunityMembers avgCommunitiesPerUser\n      totalFollows avgFollowersPerUser avgFollowingPerUser\n      usersWithProfile usersWithAvatar usersWithPost\n      onboardingCompleteRate avgTimeToFirstPostMinutes\n      totalNotifications readNotifications notificationReadRate\n      pendingReports resolvedReports\n      webSocketConnections sseConnections errorRate5xx p50ResponseTimeMs p95ResponseTimeMs p99ResponseTimeMs\n      avgSessionDurationSeconds avgSessionsPerDay avgScrollDepth\n      pageViewStats { pagePath avgDurationSeconds avgMaxScrollDepth totalViews }\n    }\n  }\n": types.AdminGetAnalyticsDocument,
    "\n  query AdminGetCommunityAnalytics($limit: Int, $offset: Int) {\n    adminGetCommunityAnalytics(limit: $limit, offset: $offset) {\n      items { communityID name memberCount messageCount }\n      total\n    }\n  }\n": types.AdminGetCommunityAnalyticsDocument,
    "\n  query AdminGetTimeSeries($granularity: TimeSeriesGranularity!, $from: String!, $to: String!) {\n    adminGetTimeSeries(granularity: $granularity, from: $from, to: $to) {\n      points { label posts comments messages newUsers likes activeUsers }\n    }\n  }\n": types.AdminGetTimeSeriesDocument,
    "\n  query GetAnnouncement($id: ID!) {\n    announcement(id: $id) {\n      ID\n      title\n      body\n      createdAt\n    }\n  }\n": types.GetAnnouncementDocument,
    "\n  query AdminListAnnouncements($limit: Int, $offset: Int) {\n    adminListAnnouncements(limit: $limit, offset: $offset) {\n      items {\n        ID\n        title\n        body\n        createdAt\n      }\n      total\n    }\n  }\n": types.AdminListAnnouncementsDocument,
    "\n  mutation CreateAnnouncement($input: CreateAnnouncementInput!) {\n    createAnnouncement(input: $input) {\n      ID\n      title\n      body\n      createdAt\n    }\n  }\n": types.CreateAnnouncementDocument,
    "\n  mutation UpdateAnnouncement($id: ID!, $input: UpdateAnnouncementInput!) {\n    updateAnnouncement(id: $id, input: $input) {\n      ID\n      title\n      body\n      createdAt\n      updatedAt\n    }\n  }\n": types.UpdateAnnouncementDocument,
    "\n  mutation DeleteAnnouncement($id: ID!) {\n    deleteAnnouncement(id: $id)\n  }\n": types.DeleteAnnouncementDocument,
    "\n  mutation LoginAdmin($input: LoginInput!) {\n    loginAdministrator(input: $input) {\n      token\n      refreshToken\n      administrator {\n        ID\n        name\n        email\n      }\n    }\n  }\n": types.LoginAdminDocument,
    "\n  mutation LogoutAdmin($token: String!) {\n    logoutAdministrator(token: $token)\n  }\n": types.LogoutAdminDocument,
    "\n  query Communities($limit: Int, $offset: Int) {\n    communities(limit: $limit, offset: $offset) {\n      items {\n        ID\n        roomID\n        name\n        description\n        createdAt\n        updatedAt\n      }\n      total\n    }\n  }\n": types.CommunitiesDocument,
    "\n  mutation AdminUpdateCommunity($id: ID!, $input: UpdateCommunityInput!) {\n    updateCommunity(id: $id, input: $input) {\n      ID\n      roomID\n      name\n      description\n      createdAt\n      updatedAt\n    }\n  }\n": types.AdminUpdateCommunityDocument,
    "\n  mutation KickUserFromCommunity($communityID: ID!, $userID: ID!) {\n    kickUserFromCommunity(communityID: $communityID, userID: $userID)\n  }\n": types.KickUserFromCommunityDocument,
    "\n  query AdminGetRoom($id: ID!) {\n    room(id: $id) {\n      ID\n      name\n      user {\n        ID\n        accountID\n        name\n        email\n      }\n    }\n  }\n": types.AdminGetRoomDocument,
    "\n  query AdminGetCommunityMembers($communityID: ID!) {\n    getCommunityMembers(communityID: $communityID) {\n      user {\n        ID\n        accountID\n        name\n        email\n      }\n      role\n    }\n  }\n": types.AdminGetCommunityMembersDocument,
    "\n  query AdminListMessages($roomID: ID!, $limit: Int) {\n    messages(roomID: $roomID, limit: $limit) {\n      items {\n        ID\n        roomID\n        user {\n          ID\n          name\n          accountID\n          avatarUrl\n        }\n        content\n        media {\n          ID\n          url\n          contentType\n        }\n        createdAt\n        updatedAt\n      }\n    }\n  }\n": types.AdminListMessagesDocument,
    "\n  mutation PromoteToCommunityOwner($communityID: ID!, $userID: ID!) {\n    promoteToCommunityOwner(communityID: $communityID, userID: $userID)\n  }\n": types.PromoteToCommunityOwnerDocument,
    "\n  mutation DemoteFromCommunityOwner($communityID: ID!, $userID: ID!) {\n    demoteFromCommunityOwner(communityID: $communityID, userID: $userID)\n  }\n": types.DemoteFromCommunityOwnerDocument,
    "\n  mutation DeleteMessage($roomID: ID!, $id: ID!) {\n    deleteMessage(roomID: $roomID, id: $id)\n  }\n": types.DeleteMessageDocument,
    "\n  query SearchInquiries($status: InquiryStatus, $limit: Int, $offset: Int) {\n    searchInquiries(status: $status, limit: $limit, offset: $offset) {\n      items {\n        id\n        name\n        email\n        category\n        subject\n        content\n        status\n        createdAt\n        updatedAt\n      }\n      total\n    }\n  }\n": types.SearchInquiriesDocument,
    "\n  query GetInquiry($id: ID!) {\n    getInquiry(id: $id) {\n      id\n      name\n      email\n      category\n      subject\n      content\n      status\n      createdAt\n      updatedAt\n    }\n  }\n": types.GetInquiryDocument,
    "\n  mutation UpdateInquiryStatus($id: ID!, $status: InquiryStatus!) {\n    updateInquiryStatus(id: $id, status: $status) {\n      id\n      status\n    }\n  }\n": types.UpdateInquiryStatusDocument,
    "\n  mutation ToggleMaintenanceMode($enabled: Boolean!) {\n    toggleMaintenanceMode(enabled: $enabled)\n  }\n": types.ToggleMaintenanceModeDocument,
    "\n  query MaintenanceMode {\n    maintenanceMode\n  }\n": types.MaintenanceModeDocument,
    "\n  fragment AdminPostFields on Post {\n    ID\n    content\n    createdAt\n    updatedAt\n    deletedAt\n    replyCount\n    user {\n      ID\n      name\n      accountID\n      avatarUrl\n    }\n    favorites {\n      ID\n      user {\n        ID\n      }\n    }\n    media {\n      ID\n      url\n      contentType\n      createdAt\n    }\n  }\n": types.AdminPostFieldsFragmentDoc,
    "\n  query GetAdminPosts($limit: Int, $offset: Int) {\n    posts(limit: $limit, offset: $offset) {\n      items {\n        ...AdminPostFields\n        replies {\n          ID\n        }\n      }\n      total\n    }\n  }\n": types.GetAdminPostsDocument,
    "\n  query GetPostByIDIncludeDeleted($id: ID!) {\n    getPostByIDIncludeDeleted(id: $id) {\n      ...AdminPostFields\n      rootPost {\n        ...AdminPostFields\n      }\n      replies {\n        ...AdminPostFields\n        replies {\n          ...AdminPostFields\n          replies {\n            ...AdminPostFields\n            replies {\n              ...AdminPostFields\n              replies {\n                ID\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n": types.GetPostByIdIncludeDeletedDocument,
    "\n  mutation AdminDeletePost($id: ID!) {\n    adminDeletePost(id: $id)\n  }\n": types.AdminDeletePostDocument,
    "\n  query AdminGetBlockers($userID: ID!) {\n    adminGetBlockers(userID: $userID) {\n      ID\n      name\n      accountID\n      avatarUrl\n    }\n  }\n": types.AdminGetBlockersDocument,
    "\n  query AdminGetFavoriteUsers($userID: ID!) {\n    adminGetFavoriteUsers(userID: $userID) {\n      ID\n      name\n      accountID\n      avatarUrl\n    }\n  }\n": types.AdminGetFavoriteUsersDocument,
    "\n  query SearchReports($filter: ReportSearchFilter, $limit: Int, $offset: Int) {\n    searchReports(filter: $filter, limit: $limit, offset: $offset) {\n      items {\n        ID\n        targetType\n        targetID\n        reason\n        customReason\n        content\n        status\n        createdAt\n      }\n      total\n    }\n  }\n": types.SearchReportsDocument,
    "\n  mutation UpdateReportStatus($id: ID!, $status: ReportStatus!) {\n    updateReportStatus(id: $id, status: $status) {\n      ID\n      status\n    }\n  }\n": types.UpdateReportStatusDocument,
    "\n  mutation AdminCreateReport($input: CreateReportInput!) {\n    createReport(input: $input) {\n      ID\n      status\n    }\n  }\n": types.AdminCreateReportDocument,
    "\n  query GetReportServiceStatus {\n    isReportServiceEnabled\n  }\n": types.GetReportServiceStatusDocument,
    "\n  mutation SetReportServiceStatus($enabled: Boolean!) {\n    setReportServiceStatus(enabled: $enabled)\n  }\n": types.SetReportServiceStatusDocument,
    "\n  query PresignedTermsDocumentUploadUrl {\n    presignedTermsDocumentUploadUrl {\n      uploadUrl\n      objectKey\n    }\n  }\n": types.PresignedTermsDocumentUploadUrlDocument,
    "\n  query AdminListTerms {\n    adminListTerms {\n      ID\n      version\n      documentUrl\n      effectiveDate\n      createdAt\n    }\n  }\n": types.AdminListTermsDocument,
    "\n  query AdminListConsents($termsID: ID!, $limit: Int, $offset: Int) {\n    adminListConsents(termsID: $termsID, limit: $limit, offset: $offset) {\n      items {\n        ID\n        user {\n          ID\n          accountID\n          name\n          email\n        }\n        consentedAt\n      }\n      total\n    }\n  }\n": types.AdminListConsentsDocument,
    "\n  mutation CreateTermsOfService($input: CreateTermsOfServiceInput!) {\n    createTermsOfService(input: $input) {\n      ID\n      version\n      documentUrl\n      effectiveDate\n      createdAt\n    }\n  }\n": types.CreateTermsOfServiceDocument,
    "\n  query Users($limit: Int, $offset: Int) {\n    users(limit: $limit, offset: $offset) {\n      items {\n        ID\n        accountID\n        name\n        email\n        role\n        status\n        createdAt\n        updatedAt\n      }\n      total\n    }\n  }\n": types.UsersDocument,
    "\n  query AdminSearchUsers($keyword: String!) {\n    searchUsers(keyword: $keyword) {\n      items {\n        ID\n        accountID\n        name\n        email\n        role\n        status\n        createdAt\n        updatedAt\n      }\n      total\n    }\n  }\n": types.AdminSearchUsersDocument,
    "\n  query GetUserByID($id: ID!) {\n    getUserByID(id: $id) {\n      ID\n      accountID\n      name\n      email\n      role\n      status\n      createdAt\n      updatedAt\n    }\n  }\n": types.GetUserByIdDocument,
    "\n  mutation DeleteUser($id: ID!) {\n    deleteUser(id: $id)\n  }\n": types.DeleteUserDocument,
    "\n  mutation FreezeUser($id: ID!) {\n    freezeUser(id: $id)\n  }\n": types.FreezeUserDocument,
    "\n  mutation UnfreezeUser($id: ID!) {\n    unfreezeUser(id: $id)\n  }\n": types.UnfreezeUserDocument,
    "\n  mutation AdminUpdateUser($id: ID!, $input: UpdateUserInput!) {\n    adminUpdateUser(id: $id, input: $input) {\n      ID\n      accountID\n      name\n      email\n      role\n      status\n      createdAt\n      updatedAt\n    }\n  }\n": types.AdminUpdateUserDocument,
    "\n  mutation AdminUpdateProfile($userID: ID!, $input: UpdateProfileInput!) {\n    adminUpdateProfile(userID: $userID, input: $input) {\n      username\n      bio\n      avatarUrl\n      createdAt\n      updatedAt\n      user {\n        ID\n        accountID\n        name\n        email\n        role\n        status\n      }\n    }\n  }\n": types.AdminUpdateProfileDocument,
    "\n  query AdminGetProfileByUserID($userID: ID!) {\n    getProfileByUserID(userID: $userID) {\n      username\n      bio\n      avatarUrl\n      createdAt\n      updatedAt\n      user {\n        ID\n        accountID\n        name\n        email\n        role\n        status\n      }\n    }\n  }\n": types.AdminGetProfileByUserIdDocument,
    "\n  query ListAnnouncements($limit: Int, $offset: Int) {\n    announcements(limit: $limit, offset: $offset) {\n      items {\n        ID\n        title\n        body\n        createdAt\n      }\n      total\n    }\n  }\n": types.ListAnnouncementsDocument,
    "\n  mutation LoginUser($input: LoginInput!) {\n    loginUser(input: $input) {\n      token\n      refreshToken\n      user {\n        ID\n        accountID\n        name\n        email\n        role\n        status\n      }\n    }\n  }\n": types.LoginUserDocument,
    "\n  mutation LogoutUser($token: String!) {\n    logoutUser(token: $token)\n  }\n": types.LogoutUserDocument,
    "\n  mutation SendEmailOTP($email: String!) {\n    sendEmailOTP(email: $email)\n  }\n": types.SendEmailOtpDocument,
    "\n  mutation VerifyEmailOTP($email: String!, $otp: String!) {\n    verifyEmailOTP(email: $email, otp: $otp)\n  }\n": types.VerifyEmailOtpDocument,
    "\n  mutation CreateUser($input: CreateUserInput!) {\n    createUser(input: $input) {\n      ID\n      accountID\n      name\n      email\n      role\n      status\n    }\n  }\n": types.CreateUserDocument,
    "\n  mutation RequestPasswordReset($email: String!) {\n    requestPasswordReset(email: $email)\n  }\n": types.RequestPasswordResetDocument,
    "\n  mutation VerifyPasswordResetOTP($email: String!, $otp: String!) {\n    verifyPasswordResetOTP(email: $email, otp: $otp)\n  }\n": types.VerifyPasswordResetOtpDocument,
    "\n  mutation ResetPassword($resetToken: String!, $newPassword: String!) {\n    resetPassword(resetToken: $resetToken, newPassword: $newPassword)\n  }\n": types.ResetPasswordDocument,
    "\n  query GetBlockersByUserID($userID: ID!) {\n    GetBlockersByUserID(userID: $userID) {\n      ID\n      name\n      accountID\n      avatarUrl\n    }\n  }\n": types.GetBlockersByUserIdDocument,
    "\n  mutation CreateBlocker($blockedUserID: ID!) {\n    createBlocker(blockedUserID: $blockedUserID) {\n      ID\n      userID\n      blockedUserID\n      createdAt\n    }\n  }\n": types.CreateBlockerDocument,
    "\n  mutation DeleteBlocker($blockedUserID: ID!) {\n    deleteBlocker(blockedUserID: $blockedUserID)\n  }\n": types.DeleteBlockerDocument,
    "\n  query ListBlockedUsers($limit: Int, $offset: Int) {\n    listBlockedUsers(limit: $limit, offset: $offset) {\n      items {\n        ID\n        name\n        accountID\n        avatarUrl\n      }\n      total\n    }\n  }\n": types.ListBlockedUsersDocument,
    "\n  query MyCommunities($limit: Int, $offset: Int) {\n    myCommunities(limit: $limit, offset: $offset) {\n      items {\n        ID\n        roomID\n        name\n        description\n        avatarURL\n        memberCount\n        isMember\n        unreadCount\n        lastMessage\n        createdAt\n        updatedAt\n      }\n      total\n    }\n  }\n": types.MyCommunitiesDocument,
    "\n  query SearchCommunities($name: String!, $limit: Int, $offset: Int) {\n    searchCommunities(name: $name, limit: $limit, offset: $offset) {\n      items {\n        ID\n        roomID\n        name\n        description\n        avatarURL\n        memberCount\n        isMember\n        createdAt\n        updatedAt\n      }\n      total\n    }\n  }\n": types.SearchCommunitiesDocument,
    "\n  mutation CreateCommunity($input: CreateCommunityInput!) {\n    createCommunity(input: $input) {\n      ID\n      roomID\n      name\n      description\n      avatarURL\n      memberCount\n      isMember\n      createdAt\n      updatedAt\n    }\n  }\n": types.CreateCommunityDocument,
    "\n  mutation JoinRoom($roomID: ID!) {\n    joinRoom(roomID: $roomID)\n  }\n": types.JoinRoomDocument,
    "\n  mutation RemoveUserFromRoom($input: RemoveUserFromRoomInput!) {\n    removeUserFromRoom(input: $input)\n  }\n": types.RemoveUserFromRoomDocument,
    "\n  query GetMyRoleInCommunity($communityID: ID!) {\n    getMyRoleInCommunity(communityID: $communityID)\n  }\n": types.GetMyRoleInCommunityDocument,
    "\n  query GetCommunityMembers($communityID: ID!) {\n    getCommunityMembers(communityID: $communityID) {\n      user {\n        ID\n        accountID\n        name\n        email\n        avatarUrl\n      }\n      role\n    }\n  }\n": types.GetCommunityMembersDocument,
    "\n  mutation UpdateCommunity($id: ID!, $input: UpdateCommunityInput!) {\n    updateCommunity(id: $id, input: $input) {\n      ID\n      roomID\n      name\n      description\n      avatarURL\n      memberCount\n      isMember\n      createdAt\n      updatedAt\n    }\n  }\n": types.UpdateCommunityDocument,
    "\n  mutation UpdateCommunityMembers($communityID: ID!, $updates: [CommunityMemberUpdateInput!]!) {\n    updateCommunityMembers(communityID: $communityID, updates: $updates)\n  }\n": types.UpdateCommunityMembersDocument,
    "\n  query RandomCommunities($limit: Int!) {\n    randomCommunities(limit: $limit) {\n      ID\n      roomID\n      name\n      description\n      avatarURL\n      memberCount\n      isMember\n      createdAt\n      updatedAt\n    }\n  }\n": types.RandomCommunitiesDocument,
    "\n  query PresignedCommunityIconUploadUrl($contentType: String!) {\n    presignedCommunityIconUploadUrl(contentType: $contentType) {\n      uploadUrl\n      objectKey\n    }\n  }\n": types.PresignedCommunityIconUploadUrlDocument,
    "\n  query MyUnreadCommunityCount {\n    myUnreadCommunityCount\n  }\n": types.MyUnreadCommunityCountDocument,
    "\n  query GetFavoriteUsersByUserID($userID: ID!) {\n    GetFavoriteUsersByUserID(userID: $userID) {\n      ID\n      name\n      accountID\n      avatarUrl\n    }\n  }\n": types.GetFavoriteUsersByUserIdDocument,
    "\n  mutation CreateFavoriteUser($favoriteUserID: ID!) {\n    createFavoriteUser(favoriteUserID: $favoriteUserID) {\n      ID\n      userID\n      favoriteUserID\n      createdAt\n    }\n  }\n": types.CreateFavoriteUserDocument,
    "\n  mutation DeleteFavoriteUser($favoriteUserID: ID!) {\n    deleteFavoriteUser(favoriteUserID: $favoriteUserID)\n  }\n": types.DeleteFavoriteUserDocument,
    "\n  query ListFavoriteUsers($limit: Int, $offset: Int) {\n    listFavoriteUsers(limit: $limit, offset: $offset) {\n      items {\n        ID\n        name\n        accountID\n        avatarUrl\n      }\n      total\n    }\n  }\n": types.ListFavoriteUsersDocument,
    "\n  query MyFollowers($limit: Int, $offset: Int) {\n    myFollowers(limit: $limit, offset: $offset) {\n      items {\n        ID\n        name\n        accountID\n        avatarUrl\n      }\n      total\n    }\n  }\n": types.MyFollowersDocument,
    "\n  mutation CreateInquiry($input: CreateInquiryInput!) {\n    createInquiry(input: $input) {\n      id\n      name\n      email\n      category\n      subject\n      content\n      createdAt\n    }\n  }\n": types.CreateInquiryDocument,
    "\n  mutation MarkRoomAsRead($roomID: ID!) {\n    markRoomAsRead(roomID: $roomID)\n  }\n": types.MarkRoomAsReadDocument,
    "\n  mutation GetOrCreateDMRoom($targetUserID: ID!) {\n    getOrCreateDMRoom(targetUserID: $targetUserID) {\n      ID\n      name\n      type\n      user {\n        ID\n        name\n        accountID\n        avatarUrl\n      }\n      isMessagingDisabled\n      lastReadAt\n      unreadCount\n      partnerLastReadAt\n      content\n    }\n  }\n": types.GetOrCreateDmRoomDocument,
    "\n  mutation SendMessage($roomID: ID!, $content: String!, $mediaInputs: [MediaUploadInput!]) {\n    sendMessage(roomID: $roomID, content: $content, mediaInputs: $mediaInputs) {\n      ID\n      roomID\n      user {\n        ID\n        name\n        accountID\n        avatarUrl\n      }\n      content\n      media {\n        ID\n        url\n        contentType\n      }\n      createdAt\n      updatedAt\n    }\n  }\n": types.SendMessageDocument,
    "\n  mutation UpdateMessage($roomID: ID!, $id: ID!, $content: String!) {\n    updateMessage(roomID: $roomID, id: $id, content: $content) {\n      ID\n      roomID\n      user {\n        ID\n        name\n        accountID\n        avatarUrl\n      }\n      content\n      media {\n        ID\n        url\n        contentType\n      }\n      createdAt\n      updatedAt\n    }\n  }\n": types.UpdateMessageDocument,
    "\n  mutation DeleteRoom($roomID: ID!) {\n    deleteRoom(roomID: $roomID)\n  }\n": types.DeleteRoomDocument,
    "\n  query ListMessages($roomID: ID!, $limit: Int, $before: ID, $after: ID, $afterTime: String) {\n    messages(roomID: $roomID, limit: $limit, before: $before, after: $after, afterTime: $afterTime) {\n      items {\n        ID\n        roomID\n        user {\n          ID\n          name\n          accountID\n          avatarUrl\n        }\n        content\n        media {\n          ID\n          url\n          contentType\n        }\n        createdAt\n        updatedAt\n      }\n      hasMoreBefore\n      hasMoreAfter\n    }\n  }\n": types.ListMessagesDocument,
    "\n  query GetRoom($id: ID!) {\n    room(id: $id) {\n      ID\n      name\n      type\n      user {\n        ID\n        name\n        accountID\n        avatarUrl\n      }\n      isMessagingDisabled\n      lastReadAt\n      unreadCount\n      partnerLastReadAt\n      content\n    }\n  }\n": types.GetRoomDocument,
    "\n  query MyDMRooms($limit: Int, $offset: Int) {\n    myDMRooms(limit: $limit, offset: $offset) {\n      items {\n        ID\n        name\n        type\n        user {\n          ID\n          name\n          accountID\n          avatarUrl\n        }\n        isMessagingDisabled\n        lastReadAt\n        unreadCount\n        partnerLastReadAt\n        content\n      }\n      total\n    }\n  }\n": types.MyDmRoomsDocument,
    "\n  query PresignedMediaUploadUrl($contentType: String!) {\n    presignedMediaUploadUrl(contentType: $contentType) {\n      uploadUrl\n      objectKey\n    }\n  }\n": types.PresignedMediaUploadUrlDocument,
    "\n  query MyUnreadDMCount {\n    myUnreadDMCount\n  }\n": types.MyUnreadDmCountDocument,
    "\n  query MyNotifications($limit: Int, $offset: Int, $type: String, $actorID: ID) {\n    myNotifications(limit: $limit, offset: $offset, type: $type, actorID: $actorID) {\n      items {\n        ID\n        type\n        actor {\n          ID\n          name\n          accountID\n          avatarUrl\n        }\n        targetType\n        targetID\n        targetPost {\n          ID\n          content\n          deletedAt\n          user {\n            ID\n            name\n            accountID\n          }\n          media {\n            ID\n            url\n            contentType\n          }\n        }\n        message\n        isRead\n        createdAt\n      }\n      total\n    }\n  }\n": types.MyNotificationsDocument,
    "\n  query MyNotificationGroups($limit: Int, $offset: Int) {\n    myNotificationGroups(limit: $limit, offset: $offset) {\n      items {\n        key\n        type\n        actor {\n          ID\n          name\n          accountID\n          avatarUrl\n        }\n        targetType\n        targetID\n        targetPost {\n          ID\n          content\n          deletedAt\n          user {\n            ID\n            name\n            accountID\n          }\n          media {\n            ID\n            url\n            contentType\n          }\n        }\n        message\n        createdAt\n        count\n        unreadCount\n        latestID\n      }\n      total\n    }\n  }\n": types.MyNotificationGroupsDocument,
    "\n  query Notification($id: ID!) {\n    notification(id: $id) {\n      ID\n      type\n      actor {\n        ID\n        name\n        accountID\n        avatarUrl\n      }\n      targetType\n      targetID\n      targetPost {\n        ID\n        content\n        deletedAt\n        user {\n          ID\n          name\n          accountID\n        }\n        media {\n          ID\n          url\n          contentType\n        }\n      }\n      message\n      isRead\n      createdAt\n    }\n  }\n": types.NotificationDocument,
    "\n  query MyUnreadNotificationCount {\n    myUnreadNotificationCount\n  }\n": types.MyUnreadNotificationCountDocument,
    "\n  mutation MarkNotificationAsRead($id: ID!) {\n    markNotificationAsRead(id: $id)\n  }\n": types.MarkNotificationAsReadDocument,
    "\n  mutation MarkAllNotificationsAsRead {\n    markAllNotificationsAsRead\n  }\n": types.MarkAllNotificationsAsReadDocument,
    "\n  mutation MarkAllNotificationsAsReadByActor($type: String!, $actorID: ID!) {\n    markAllNotificationsAsReadByActor(type: $type, actorID: $actorID)\n  }\n": types.MarkAllNotificationsAsReadByActorDocument,
    "\n  mutation DeleteNotifications($ids: [ID!]!) {\n    deleteNotifications(ids: $ids)\n  }\n": types.DeleteNotificationsDocument,
    "\n  mutation DeleteReadNotifications {\n    deleteReadNotifications\n  }\n": types.DeleteReadNotificationsDocument,
    "\n  mutation DeleteReadNotificationsByActor($type: String!, $actorID: ID!) {\n    deleteReadNotificationsByActor(type: $type, actorID: $actorID)\n  }\n": types.DeleteReadNotificationsByActorDocument,
    "\n  fragment PostFields on Post {\n    ID\n    content\n    createdAt\n    replyCount\n    deletedAt\n    user {\n      ID\n      name\n      accountID\n      avatarUrl\n    }\n    favorites {\n      ID\n      user {\n        ID\n      }\n    }\n    media {\n      ID\n      url\n      contentType\n    }\n  }\n": types.PostFieldsFragmentDoc,
    "\n  query TopLevelPosts($limit: Int, $offset: Int) {\n    topLevelPosts(limit: $limit, offset: $offset) {\n      items {\n        ...PostFields\n        replies {\n          ID\n        }\n      }\n      total\n    }\n  }\n": types.TopLevelPostsDocument,
    "\n  query GetPostByID($id: ID!) {\n    getPostByID(id: $id) {\n      ...PostFields\n      rootPost {\n        ...PostFields\n      }\n      replies {\n        ...PostFields\n        replies {\n          ...PostFields\n          replies {\n            ...PostFields\n            replies {\n              ...PostFields\n              replies {\n                ID\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n": types.GetPostByIdDocument,
    "\n  query GetPostsByUserID($user_id: ID!, $limit: Int, $offset: Int) {\n    getPostsByUserID(user_id: $user_id, limit: $limit, offset: $offset) {\n      items {\n        ...PostFields\n        replies {\n          ID\n        }\n      }\n      total\n    }\n  }\n": types.GetPostsByUserIdDocument,
    "\n  query GetFavoritePostsByUserID($user_id: ID!, $limit: Int, $offset: Int) {\n    getFavoritePostsByUserID(user_id: $user_id, limit: $limit, offset: $offset) {\n      items {\n        ...PostFields\n        replies {\n          ID\n        }\n      }\n      total\n    }\n  }\n": types.GetFavoritePostsByUserIdDocument,
    "\n  mutation CreatePost($input: CreatePostInput!) {\n    createPost(input: $input) {\n      ...PostFields\n      replies {\n        ID\n      }\n    }\n  }\n": types.CreatePostDocument,
    "\n  mutation UpdatePost($input: UpdatePostInput!) {\n    updatePost(input: $input) {\n      ...PostFields\n      replies {\n        ID\n      }\n    }\n  }\n": types.UpdatePostDocument,
    "\n  mutation DeletePost($id: ID!) {\n    deletePost(id: $id)\n  }\n": types.DeletePostDocument,
    "\n  mutation CreateFavorite($input: CreateFavoriteInput!) {\n    createFavorite(input: $input) {\n      ID\n      user {\n        ID\n      }\n    }\n  }\n": types.CreateFavoriteDocument,
    "\n  mutation DeleteFavorite($input: DeleteFavoriteInput!) {\n    deleteFavorite(input: $input)\n  }\n": types.DeleteFavoriteDocument,
    "\n  query NewFeedPostsCount($since: String!) {\n    newFeedPostsCount(since: $since)\n  }\n": types.NewFeedPostsCountDocument,
    "\n  query SearchPosts($keyword: String!) {\n    searchPosts(keyword: $keyword) {\n      ...PostFields\n      replies {\n        ID\n      }\n    }\n  }\n": types.SearchPostsDocument,
    "\n  query FollowersTopLevelPosts($userID: ID!, $limit: Int, $offset: Int) {\n    followersTopLevelPosts(userID: $userID, limit: $limit, offset: $offset) {\n      items {\n        ...PostFields\n        replies {\n          ID\n        }\n      }\n      total\n    }\n  }\n": types.FollowersTopLevelPostsDocument,
    "\n  query Me {\n    me {\n      ID\n      accountID\n      name\n      email\n      role\n      status\n      createdAt\n      updatedAt\n    }\n  }\n": types.MeDocument,
    "\n  query SearchUsers($keyword: String!, $limit: Int, $offset: Int) {\n    searchUsers(keyword: $keyword, limit: $limit, offset: $offset) {\n      items {\n        ID\n        accountID\n        name\n        email\n        role\n        status\n        avatarUrl\n        createdAt\n        updatedAt\n      }\n      total\n    }\n  }\n": types.SearchUsersDocument,
    "\n  mutation UpdateUser($input: UpdateUserInput!) {\n    updateUser(input: $input) {\n      ID\n      accountID\n      name\n      email\n      role\n      status\n      createdAt\n      updatedAt\n    }\n  }\n": types.UpdateUserDocument,
    "\n  query PresignedAvatarUploadUrl($contentType: String!) {\n    presignedAvatarUploadUrl(contentType: $contentType) {\n      uploadUrl\n      objectKey\n    }\n  }\n": types.PresignedAvatarUploadUrlDocument,
    "\n  mutation SetAvatar($objectKey: String!) {\n    setAvatar(objectKey: $objectKey) {\n      username\n      bio\n      avatarUrl\n      createdAt\n      updatedAt\n    }\n  }\n": types.SetAvatarDocument,
    "\n  mutation DeleteAvatar {\n    deleteAvatar {\n      username\n      bio\n      avatarUrl\n      createdAt\n      updatedAt\n    }\n  }\n": types.DeleteAvatarDocument,
    "\n  mutation DeleteMyAccount {\n    deleteMyAccount\n  }\n": types.DeleteMyAccountDocument,
    "\n  query GetProfileByUserID($userID: ID!) {\n    getProfileByUserID(userID: $userID) {\n      username\n      bio\n      avatarUrl\n      createdAt\n      updatedAt\n      user {\n        ID\n        accountID\n        name\n        email\n        role\n        status\n        avatarUrl\n        createdAt\n        updatedAt\n      }\n    }\n  }\n": types.GetProfileByUserIdDocument,
    "\n  mutation UpdateProfile($input: UpdateProfileInput!) {\n    updateProfile(input: $input) {\n      username\n      bio\n      avatarUrl\n      createdAt\n      updatedAt\n    }\n  }\n": types.UpdateProfileDocument,
    "\n  mutation CreateReport($input: CreateReportInput!) {\n    createReport(input: $input) {\n      ID\n      targetType\n      targetID\n      reporter {\n        ID\n        name\n        accountID\n      }\n      reason\n      customReason\n    }\n  }\n": types.CreateReportDocument,
    "\n  query MyTermsConsentStatus {\n    myTermsConsentStatus {\n      isConsented\n      currentTerms {\n        ID\n        version\n        documentUrl\n        effectiveDate\n        createdAt\n      }\n    }\n  }\n": types.MyTermsConsentStatusDocument,
    "\n  mutation ConsentToTerms($termsID: ID!) {\n    consentToTerms(termsID: $termsID)\n  }\n": types.ConsentToTermsDocument,
    "\n  query CurrentTerms {\n    currentTerms {\n      ID\n      version\n      documentUrl\n      effectiveDate\n      createdAt\n    }\n  }\n": types.CurrentTermsDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateAdministrator($input: CreateAdministratorInput!) {\n    createAdministrator(input: $input) {\n      ID\n      name\n      email\n    }\n  }\n"): (typeof documents)["\n  mutation CreateAdministrator($input: CreateAdministratorInput!) {\n    createAdministrator(input: $input) {\n      ID\n      name\n      email\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetAdministratorByID($id: ID!) {\n    getAdministratorByID(id: $id) {\n      ID\n      name\n      email\n    }\n  }\n"): (typeof documents)["\n  query GetAdministratorByID($id: ID!) {\n    getAdministratorByID(id: $id) {\n      ID\n      name\n      email\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SearchAdministrators($name: String!) {\n    searchAdministrators(name: $name) {\n      ID\n      name\n      email\n    }\n  }\n"): (typeof documents)["\n  query SearchAdministrators($name: String!) {\n    searchAdministrators(name: $name) {\n      ID\n      name\n      email\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Administrators($limit: Int, $offset: Int) {\n    administrators(limit: $limit, offset: $offset) {\n      items {\n        ID\n        name\n        email\n      }\n      total\n    }\n  }\n"): (typeof documents)["\n  query Administrators($limit: Int, $offset: Int) {\n    administrators(limit: $limit, offset: $offset) {\n      items {\n        ID\n        name\n        email\n      }\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteAdministrator($id: ID!) {\n    deleteAdministrator(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteAdministrator($id: ID!) {\n    deleteAdministrator(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateAdministrator($id: ID!, $input: UpdateAdministratorInput!) {\n    updateAdministrator(id: $id, input: $input) {\n      ID\n      name\n      email\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateAdministrator($id: ID!, $input: UpdateAdministratorInput!) {\n    updateAdministrator(id: $id, input: $input) {\n      ID\n      name\n      email\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminGetAnalytics {\n    adminGetAnalytics {\n      totalUsers newUsersToday newUsersThisWeek newUsersThisMonth frozenUsersCount\n      totalPosts totalComments totalDeletedPosts totalLikes totalCommunities\n      totalMessages totalReports totalBlocks totalInquiries\n      currentActiveUsers dau wau mau dauMauRatio\n      postsToday commentsToday messagesToday\n      avgLikesPerPost avgCommentsPerPost\n      postsTextOnly postsWithImage postsWithVideo\n      uniqueDMSenders\n      activeCommunitiesLast30Days avgCommunityMembers avgCommunitiesPerUser\n      totalFollows avgFollowersPerUser avgFollowingPerUser\n      usersWithProfile usersWithAvatar usersWithPost\n      onboardingCompleteRate avgTimeToFirstPostMinutes\n      totalNotifications readNotifications notificationReadRate\n      pendingReports resolvedReports\n      webSocketConnections sseConnections errorRate5xx p50ResponseTimeMs p95ResponseTimeMs p99ResponseTimeMs\n      avgSessionDurationSeconds avgSessionsPerDay avgScrollDepth\n      pageViewStats { pagePath avgDurationSeconds avgMaxScrollDepth totalViews }\n    }\n  }\n"): (typeof documents)["\n  query AdminGetAnalytics {\n    adminGetAnalytics {\n      totalUsers newUsersToday newUsersThisWeek newUsersThisMonth frozenUsersCount\n      totalPosts totalComments totalDeletedPosts totalLikes totalCommunities\n      totalMessages totalReports totalBlocks totalInquiries\n      currentActiveUsers dau wau mau dauMauRatio\n      postsToday commentsToday messagesToday\n      avgLikesPerPost avgCommentsPerPost\n      postsTextOnly postsWithImage postsWithVideo\n      uniqueDMSenders\n      activeCommunitiesLast30Days avgCommunityMembers avgCommunitiesPerUser\n      totalFollows avgFollowersPerUser avgFollowingPerUser\n      usersWithProfile usersWithAvatar usersWithPost\n      onboardingCompleteRate avgTimeToFirstPostMinutes\n      totalNotifications readNotifications notificationReadRate\n      pendingReports resolvedReports\n      webSocketConnections sseConnections errorRate5xx p50ResponseTimeMs p95ResponseTimeMs p99ResponseTimeMs\n      avgSessionDurationSeconds avgSessionsPerDay avgScrollDepth\n      pageViewStats { pagePath avgDurationSeconds avgMaxScrollDepth totalViews }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminGetCommunityAnalytics($limit: Int, $offset: Int) {\n    adminGetCommunityAnalytics(limit: $limit, offset: $offset) {\n      items { communityID name memberCount messageCount }\n      total\n    }\n  }\n"): (typeof documents)["\n  query AdminGetCommunityAnalytics($limit: Int, $offset: Int) {\n    adminGetCommunityAnalytics(limit: $limit, offset: $offset) {\n      items { communityID name memberCount messageCount }\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminGetTimeSeries($granularity: TimeSeriesGranularity!, $from: String!, $to: String!) {\n    adminGetTimeSeries(granularity: $granularity, from: $from, to: $to) {\n      points { label posts comments messages newUsers likes activeUsers }\n    }\n  }\n"): (typeof documents)["\n  query AdminGetTimeSeries($granularity: TimeSeriesGranularity!, $from: String!, $to: String!) {\n    adminGetTimeSeries(granularity: $granularity, from: $from, to: $to) {\n      points { label posts comments messages newUsers likes activeUsers }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetAnnouncement($id: ID!) {\n    announcement(id: $id) {\n      ID\n      title\n      body\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  query GetAnnouncement($id: ID!) {\n    announcement(id: $id) {\n      ID\n      title\n      body\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminListAnnouncements($limit: Int, $offset: Int) {\n    adminListAnnouncements(limit: $limit, offset: $offset) {\n      items {\n        ID\n        title\n        body\n        createdAt\n      }\n      total\n    }\n  }\n"): (typeof documents)["\n  query AdminListAnnouncements($limit: Int, $offset: Int) {\n    adminListAnnouncements(limit: $limit, offset: $offset) {\n      items {\n        ID\n        title\n        body\n        createdAt\n      }\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateAnnouncement($input: CreateAnnouncementInput!) {\n    createAnnouncement(input: $input) {\n      ID\n      title\n      body\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  mutation CreateAnnouncement($input: CreateAnnouncementInput!) {\n    createAnnouncement(input: $input) {\n      ID\n      title\n      body\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateAnnouncement($id: ID!, $input: UpdateAnnouncementInput!) {\n    updateAnnouncement(id: $id, input: $input) {\n      ID\n      title\n      body\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateAnnouncement($id: ID!, $input: UpdateAnnouncementInput!) {\n    updateAnnouncement(id: $id, input: $input) {\n      ID\n      title\n      body\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteAnnouncement($id: ID!) {\n    deleteAnnouncement(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteAnnouncement($id: ID!) {\n    deleteAnnouncement(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation LoginAdmin($input: LoginInput!) {\n    loginAdministrator(input: $input) {\n      token\n      refreshToken\n      administrator {\n        ID\n        name\n        email\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation LoginAdmin($input: LoginInput!) {\n    loginAdministrator(input: $input) {\n      token\n      refreshToken\n      administrator {\n        ID\n        name\n        email\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation LogoutAdmin($token: String!) {\n    logoutAdministrator(token: $token)\n  }\n"): (typeof documents)["\n  mutation LogoutAdmin($token: String!) {\n    logoutAdministrator(token: $token)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Communities($limit: Int, $offset: Int) {\n    communities(limit: $limit, offset: $offset) {\n      items {\n        ID\n        roomID\n        name\n        description\n        createdAt\n        updatedAt\n      }\n      total\n    }\n  }\n"): (typeof documents)["\n  query Communities($limit: Int, $offset: Int) {\n    communities(limit: $limit, offset: $offset) {\n      items {\n        ID\n        roomID\n        name\n        description\n        createdAt\n        updatedAt\n      }\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminUpdateCommunity($id: ID!, $input: UpdateCommunityInput!) {\n    updateCommunity(id: $id, input: $input) {\n      ID\n      roomID\n      name\n      description\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation AdminUpdateCommunity($id: ID!, $input: UpdateCommunityInput!) {\n    updateCommunity(id: $id, input: $input) {\n      ID\n      roomID\n      name\n      description\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation KickUserFromCommunity($communityID: ID!, $userID: ID!) {\n    kickUserFromCommunity(communityID: $communityID, userID: $userID)\n  }\n"): (typeof documents)["\n  mutation KickUserFromCommunity($communityID: ID!, $userID: ID!) {\n    kickUserFromCommunity(communityID: $communityID, userID: $userID)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminGetRoom($id: ID!) {\n    room(id: $id) {\n      ID\n      name\n      user {\n        ID\n        accountID\n        name\n        email\n      }\n    }\n  }\n"): (typeof documents)["\n  query AdminGetRoom($id: ID!) {\n    room(id: $id) {\n      ID\n      name\n      user {\n        ID\n        accountID\n        name\n        email\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminGetCommunityMembers($communityID: ID!) {\n    getCommunityMembers(communityID: $communityID) {\n      user {\n        ID\n        accountID\n        name\n        email\n      }\n      role\n    }\n  }\n"): (typeof documents)["\n  query AdminGetCommunityMembers($communityID: ID!) {\n    getCommunityMembers(communityID: $communityID) {\n      user {\n        ID\n        accountID\n        name\n        email\n      }\n      role\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminListMessages($roomID: ID!, $limit: Int) {\n    messages(roomID: $roomID, limit: $limit) {\n      items {\n        ID\n        roomID\n        user {\n          ID\n          name\n          accountID\n          avatarUrl\n        }\n        content\n        media {\n          ID\n          url\n          contentType\n        }\n        createdAt\n        updatedAt\n      }\n    }\n  }\n"): (typeof documents)["\n  query AdminListMessages($roomID: ID!, $limit: Int) {\n    messages(roomID: $roomID, limit: $limit) {\n      items {\n        ID\n        roomID\n        user {\n          ID\n          name\n          accountID\n          avatarUrl\n        }\n        content\n        media {\n          ID\n          url\n          contentType\n        }\n        createdAt\n        updatedAt\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation PromoteToCommunityOwner($communityID: ID!, $userID: ID!) {\n    promoteToCommunityOwner(communityID: $communityID, userID: $userID)\n  }\n"): (typeof documents)["\n  mutation PromoteToCommunityOwner($communityID: ID!, $userID: ID!) {\n    promoteToCommunityOwner(communityID: $communityID, userID: $userID)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DemoteFromCommunityOwner($communityID: ID!, $userID: ID!) {\n    demoteFromCommunityOwner(communityID: $communityID, userID: $userID)\n  }\n"): (typeof documents)["\n  mutation DemoteFromCommunityOwner($communityID: ID!, $userID: ID!) {\n    demoteFromCommunityOwner(communityID: $communityID, userID: $userID)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteMessage($roomID: ID!, $id: ID!) {\n    deleteMessage(roomID: $roomID, id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteMessage($roomID: ID!, $id: ID!) {\n    deleteMessage(roomID: $roomID, id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SearchInquiries($status: InquiryStatus, $limit: Int, $offset: Int) {\n    searchInquiries(status: $status, limit: $limit, offset: $offset) {\n      items {\n        id\n        name\n        email\n        category\n        subject\n        content\n        status\n        createdAt\n        updatedAt\n      }\n      total\n    }\n  }\n"): (typeof documents)["\n  query SearchInquiries($status: InquiryStatus, $limit: Int, $offset: Int) {\n    searchInquiries(status: $status, limit: $limit, offset: $offset) {\n      items {\n        id\n        name\n        email\n        category\n        subject\n        content\n        status\n        createdAt\n        updatedAt\n      }\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetInquiry($id: ID!) {\n    getInquiry(id: $id) {\n      id\n      name\n      email\n      category\n      subject\n      content\n      status\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query GetInquiry($id: ID!) {\n    getInquiry(id: $id) {\n      id\n      name\n      email\n      category\n      subject\n      content\n      status\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateInquiryStatus($id: ID!, $status: InquiryStatus!) {\n    updateInquiryStatus(id: $id, status: $status) {\n      id\n      status\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateInquiryStatus($id: ID!, $status: InquiryStatus!) {\n    updateInquiryStatus(id: $id, status: $status) {\n      id\n      status\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ToggleMaintenanceMode($enabled: Boolean!) {\n    toggleMaintenanceMode(enabled: $enabled)\n  }\n"): (typeof documents)["\n  mutation ToggleMaintenanceMode($enabled: Boolean!) {\n    toggleMaintenanceMode(enabled: $enabled)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MaintenanceMode {\n    maintenanceMode\n  }\n"): (typeof documents)["\n  query MaintenanceMode {\n    maintenanceMode\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment AdminPostFields on Post {\n    ID\n    content\n    createdAt\n    updatedAt\n    deletedAt\n    replyCount\n    user {\n      ID\n      name\n      accountID\n      avatarUrl\n    }\n    favorites {\n      ID\n      user {\n        ID\n      }\n    }\n    media {\n      ID\n      url\n      contentType\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  fragment AdminPostFields on Post {\n    ID\n    content\n    createdAt\n    updatedAt\n    deletedAt\n    replyCount\n    user {\n      ID\n      name\n      accountID\n      avatarUrl\n    }\n    favorites {\n      ID\n      user {\n        ID\n      }\n    }\n    media {\n      ID\n      url\n      contentType\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetAdminPosts($limit: Int, $offset: Int) {\n    posts(limit: $limit, offset: $offset) {\n      items {\n        ...AdminPostFields\n        replies {\n          ID\n        }\n      }\n      total\n    }\n  }\n"): (typeof documents)["\n  query GetAdminPosts($limit: Int, $offset: Int) {\n    posts(limit: $limit, offset: $offset) {\n      items {\n        ...AdminPostFields\n        replies {\n          ID\n        }\n      }\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetPostByIDIncludeDeleted($id: ID!) {\n    getPostByIDIncludeDeleted(id: $id) {\n      ...AdminPostFields\n      rootPost {\n        ...AdminPostFields\n      }\n      replies {\n        ...AdminPostFields\n        replies {\n          ...AdminPostFields\n          replies {\n            ...AdminPostFields\n            replies {\n              ...AdminPostFields\n              replies {\n                ID\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetPostByIDIncludeDeleted($id: ID!) {\n    getPostByIDIncludeDeleted(id: $id) {\n      ...AdminPostFields\n      rootPost {\n        ...AdminPostFields\n      }\n      replies {\n        ...AdminPostFields\n        replies {\n          ...AdminPostFields\n          replies {\n            ...AdminPostFields\n            replies {\n              ...AdminPostFields\n              replies {\n                ID\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminDeletePost($id: ID!) {\n    adminDeletePost(id: $id)\n  }\n"): (typeof documents)["\n  mutation AdminDeletePost($id: ID!) {\n    adminDeletePost(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminGetBlockers($userID: ID!) {\n    adminGetBlockers(userID: $userID) {\n      ID\n      name\n      accountID\n      avatarUrl\n    }\n  }\n"): (typeof documents)["\n  query AdminGetBlockers($userID: ID!) {\n    adminGetBlockers(userID: $userID) {\n      ID\n      name\n      accountID\n      avatarUrl\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminGetFavoriteUsers($userID: ID!) {\n    adminGetFavoriteUsers(userID: $userID) {\n      ID\n      name\n      accountID\n      avatarUrl\n    }\n  }\n"): (typeof documents)["\n  query AdminGetFavoriteUsers($userID: ID!) {\n    adminGetFavoriteUsers(userID: $userID) {\n      ID\n      name\n      accountID\n      avatarUrl\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SearchReports($filter: ReportSearchFilter, $limit: Int, $offset: Int) {\n    searchReports(filter: $filter, limit: $limit, offset: $offset) {\n      items {\n        ID\n        targetType\n        targetID\n        reason\n        customReason\n        content\n        status\n        createdAt\n      }\n      total\n    }\n  }\n"): (typeof documents)["\n  query SearchReports($filter: ReportSearchFilter, $limit: Int, $offset: Int) {\n    searchReports(filter: $filter, limit: $limit, offset: $offset) {\n      items {\n        ID\n        targetType\n        targetID\n        reason\n        customReason\n        content\n        status\n        createdAt\n      }\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateReportStatus($id: ID!, $status: ReportStatus!) {\n    updateReportStatus(id: $id, status: $status) {\n      ID\n      status\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateReportStatus($id: ID!, $status: ReportStatus!) {\n    updateReportStatus(id: $id, status: $status) {\n      ID\n      status\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminCreateReport($input: CreateReportInput!) {\n    createReport(input: $input) {\n      ID\n      status\n    }\n  }\n"): (typeof documents)["\n  mutation AdminCreateReport($input: CreateReportInput!) {\n    createReport(input: $input) {\n      ID\n      status\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetReportServiceStatus {\n    isReportServiceEnabled\n  }\n"): (typeof documents)["\n  query GetReportServiceStatus {\n    isReportServiceEnabled\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SetReportServiceStatus($enabled: Boolean!) {\n    setReportServiceStatus(enabled: $enabled)\n  }\n"): (typeof documents)["\n  mutation SetReportServiceStatus($enabled: Boolean!) {\n    setReportServiceStatus(enabled: $enabled)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PresignedTermsDocumentUploadUrl {\n    presignedTermsDocumentUploadUrl {\n      uploadUrl\n      objectKey\n    }\n  }\n"): (typeof documents)["\n  query PresignedTermsDocumentUploadUrl {\n    presignedTermsDocumentUploadUrl {\n      uploadUrl\n      objectKey\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminListTerms {\n    adminListTerms {\n      ID\n      version\n      documentUrl\n      effectiveDate\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  query AdminListTerms {\n    adminListTerms {\n      ID\n      version\n      documentUrl\n      effectiveDate\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminListConsents($termsID: ID!, $limit: Int, $offset: Int) {\n    adminListConsents(termsID: $termsID, limit: $limit, offset: $offset) {\n      items {\n        ID\n        user {\n          ID\n          accountID\n          name\n          email\n        }\n        consentedAt\n      }\n      total\n    }\n  }\n"): (typeof documents)["\n  query AdminListConsents($termsID: ID!, $limit: Int, $offset: Int) {\n    adminListConsents(termsID: $termsID, limit: $limit, offset: $offset) {\n      items {\n        ID\n        user {\n          ID\n          accountID\n          name\n          email\n        }\n        consentedAt\n      }\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateTermsOfService($input: CreateTermsOfServiceInput!) {\n    createTermsOfService(input: $input) {\n      ID\n      version\n      documentUrl\n      effectiveDate\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  mutation CreateTermsOfService($input: CreateTermsOfServiceInput!) {\n    createTermsOfService(input: $input) {\n      ID\n      version\n      documentUrl\n      effectiveDate\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Users($limit: Int, $offset: Int) {\n    users(limit: $limit, offset: $offset) {\n      items {\n        ID\n        accountID\n        name\n        email\n        role\n        status\n        createdAt\n        updatedAt\n      }\n      total\n    }\n  }\n"): (typeof documents)["\n  query Users($limit: Int, $offset: Int) {\n    users(limit: $limit, offset: $offset) {\n      items {\n        ID\n        accountID\n        name\n        email\n        role\n        status\n        createdAt\n        updatedAt\n      }\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminSearchUsers($keyword: String!) {\n    searchUsers(keyword: $keyword) {\n      items {\n        ID\n        accountID\n        name\n        email\n        role\n        status\n        createdAt\n        updatedAt\n      }\n      total\n    }\n  }\n"): (typeof documents)["\n  query AdminSearchUsers($keyword: String!) {\n    searchUsers(keyword: $keyword) {\n      items {\n        ID\n        accountID\n        name\n        email\n        role\n        status\n        createdAt\n        updatedAt\n      }\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetUserByID($id: ID!) {\n    getUserByID(id: $id) {\n      ID\n      accountID\n      name\n      email\n      role\n      status\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query GetUserByID($id: ID!) {\n    getUserByID(id: $id) {\n      ID\n      accountID\n      name\n      email\n      role\n      status\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteUser($id: ID!) {\n    deleteUser(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteUser($id: ID!) {\n    deleteUser(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation FreezeUser($id: ID!) {\n    freezeUser(id: $id)\n  }\n"): (typeof documents)["\n  mutation FreezeUser($id: ID!) {\n    freezeUser(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UnfreezeUser($id: ID!) {\n    unfreezeUser(id: $id)\n  }\n"): (typeof documents)["\n  mutation UnfreezeUser($id: ID!) {\n    unfreezeUser(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminUpdateUser($id: ID!, $input: UpdateUserInput!) {\n    adminUpdateUser(id: $id, input: $input) {\n      ID\n      accountID\n      name\n      email\n      role\n      status\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation AdminUpdateUser($id: ID!, $input: UpdateUserInput!) {\n    adminUpdateUser(id: $id, input: $input) {\n      ID\n      accountID\n      name\n      email\n      role\n      status\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminUpdateProfile($userID: ID!, $input: UpdateProfileInput!) {\n    adminUpdateProfile(userID: $userID, input: $input) {\n      username\n      bio\n      avatarUrl\n      createdAt\n      updatedAt\n      user {\n        ID\n        accountID\n        name\n        email\n        role\n        status\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation AdminUpdateProfile($userID: ID!, $input: UpdateProfileInput!) {\n    adminUpdateProfile(userID: $userID, input: $input) {\n      username\n      bio\n      avatarUrl\n      createdAt\n      updatedAt\n      user {\n        ID\n        accountID\n        name\n        email\n        role\n        status\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminGetProfileByUserID($userID: ID!) {\n    getProfileByUserID(userID: $userID) {\n      username\n      bio\n      avatarUrl\n      createdAt\n      updatedAt\n      user {\n        ID\n        accountID\n        name\n        email\n        role\n        status\n      }\n    }\n  }\n"): (typeof documents)["\n  query AdminGetProfileByUserID($userID: ID!) {\n    getProfileByUserID(userID: $userID) {\n      username\n      bio\n      avatarUrl\n      createdAt\n      updatedAt\n      user {\n        ID\n        accountID\n        name\n        email\n        role\n        status\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ListAnnouncements($limit: Int, $offset: Int) {\n    announcements(limit: $limit, offset: $offset) {\n      items {\n        ID\n        title\n        body\n        createdAt\n      }\n      total\n    }\n  }\n"): (typeof documents)["\n  query ListAnnouncements($limit: Int, $offset: Int) {\n    announcements(limit: $limit, offset: $offset) {\n      items {\n        ID\n        title\n        body\n        createdAt\n      }\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation LoginUser($input: LoginInput!) {\n    loginUser(input: $input) {\n      token\n      refreshToken\n      user {\n        ID\n        accountID\n        name\n        email\n        role\n        status\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation LoginUser($input: LoginInput!) {\n    loginUser(input: $input) {\n      token\n      refreshToken\n      user {\n        ID\n        accountID\n        name\n        email\n        role\n        status\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation LogoutUser($token: String!) {\n    logoutUser(token: $token)\n  }\n"): (typeof documents)["\n  mutation LogoutUser($token: String!) {\n    logoutUser(token: $token)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SendEmailOTP($email: String!) {\n    sendEmailOTP(email: $email)\n  }\n"): (typeof documents)["\n  mutation SendEmailOTP($email: String!) {\n    sendEmailOTP(email: $email)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation VerifyEmailOTP($email: String!, $otp: String!) {\n    verifyEmailOTP(email: $email, otp: $otp)\n  }\n"): (typeof documents)["\n  mutation VerifyEmailOTP($email: String!, $otp: String!) {\n    verifyEmailOTP(email: $email, otp: $otp)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateUser($input: CreateUserInput!) {\n    createUser(input: $input) {\n      ID\n      accountID\n      name\n      email\n      role\n      status\n    }\n  }\n"): (typeof documents)["\n  mutation CreateUser($input: CreateUserInput!) {\n    createUser(input: $input) {\n      ID\n      accountID\n      name\n      email\n      role\n      status\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RequestPasswordReset($email: String!) {\n    requestPasswordReset(email: $email)\n  }\n"): (typeof documents)["\n  mutation RequestPasswordReset($email: String!) {\n    requestPasswordReset(email: $email)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation VerifyPasswordResetOTP($email: String!, $otp: String!) {\n    verifyPasswordResetOTP(email: $email, otp: $otp)\n  }\n"): (typeof documents)["\n  mutation VerifyPasswordResetOTP($email: String!, $otp: String!) {\n    verifyPasswordResetOTP(email: $email, otp: $otp)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ResetPassword($resetToken: String!, $newPassword: String!) {\n    resetPassword(resetToken: $resetToken, newPassword: $newPassword)\n  }\n"): (typeof documents)["\n  mutation ResetPassword($resetToken: String!, $newPassword: String!) {\n    resetPassword(resetToken: $resetToken, newPassword: $newPassword)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetBlockersByUserID($userID: ID!) {\n    GetBlockersByUserID(userID: $userID) {\n      ID\n      name\n      accountID\n      avatarUrl\n    }\n  }\n"): (typeof documents)["\n  query GetBlockersByUserID($userID: ID!) {\n    GetBlockersByUserID(userID: $userID) {\n      ID\n      name\n      accountID\n      avatarUrl\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateBlocker($blockedUserID: ID!) {\n    createBlocker(blockedUserID: $blockedUserID) {\n      ID\n      userID\n      blockedUserID\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  mutation CreateBlocker($blockedUserID: ID!) {\n    createBlocker(blockedUserID: $blockedUserID) {\n      ID\n      userID\n      blockedUserID\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteBlocker($blockedUserID: ID!) {\n    deleteBlocker(blockedUserID: $blockedUserID)\n  }\n"): (typeof documents)["\n  mutation DeleteBlocker($blockedUserID: ID!) {\n    deleteBlocker(blockedUserID: $blockedUserID)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ListBlockedUsers($limit: Int, $offset: Int) {\n    listBlockedUsers(limit: $limit, offset: $offset) {\n      items {\n        ID\n        name\n        accountID\n        avatarUrl\n      }\n      total\n    }\n  }\n"): (typeof documents)["\n  query ListBlockedUsers($limit: Int, $offset: Int) {\n    listBlockedUsers(limit: $limit, offset: $offset) {\n      items {\n        ID\n        name\n        accountID\n        avatarUrl\n      }\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyCommunities($limit: Int, $offset: Int) {\n    myCommunities(limit: $limit, offset: $offset) {\n      items {\n        ID\n        roomID\n        name\n        description\n        avatarURL\n        memberCount\n        isMember\n        unreadCount\n        lastMessage\n        createdAt\n        updatedAt\n      }\n      total\n    }\n  }\n"): (typeof documents)["\n  query MyCommunities($limit: Int, $offset: Int) {\n    myCommunities(limit: $limit, offset: $offset) {\n      items {\n        ID\n        roomID\n        name\n        description\n        avatarURL\n        memberCount\n        isMember\n        unreadCount\n        lastMessage\n        createdAt\n        updatedAt\n      }\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SearchCommunities($name: String!, $limit: Int, $offset: Int) {\n    searchCommunities(name: $name, limit: $limit, offset: $offset) {\n      items {\n        ID\n        roomID\n        name\n        description\n        avatarURL\n        memberCount\n        isMember\n        createdAt\n        updatedAt\n      }\n      total\n    }\n  }\n"): (typeof documents)["\n  query SearchCommunities($name: String!, $limit: Int, $offset: Int) {\n    searchCommunities(name: $name, limit: $limit, offset: $offset) {\n      items {\n        ID\n        roomID\n        name\n        description\n        avatarURL\n        memberCount\n        isMember\n        createdAt\n        updatedAt\n      }\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateCommunity($input: CreateCommunityInput!) {\n    createCommunity(input: $input) {\n      ID\n      roomID\n      name\n      description\n      avatarURL\n      memberCount\n      isMember\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation CreateCommunity($input: CreateCommunityInput!) {\n    createCommunity(input: $input) {\n      ID\n      roomID\n      name\n      description\n      avatarURL\n      memberCount\n      isMember\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation JoinRoom($roomID: ID!) {\n    joinRoom(roomID: $roomID)\n  }\n"): (typeof documents)["\n  mutation JoinRoom($roomID: ID!) {\n    joinRoom(roomID: $roomID)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RemoveUserFromRoom($input: RemoveUserFromRoomInput!) {\n    removeUserFromRoom(input: $input)\n  }\n"): (typeof documents)["\n  mutation RemoveUserFromRoom($input: RemoveUserFromRoomInput!) {\n    removeUserFromRoom(input: $input)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetMyRoleInCommunity($communityID: ID!) {\n    getMyRoleInCommunity(communityID: $communityID)\n  }\n"): (typeof documents)["\n  query GetMyRoleInCommunity($communityID: ID!) {\n    getMyRoleInCommunity(communityID: $communityID)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetCommunityMembers($communityID: ID!) {\n    getCommunityMembers(communityID: $communityID) {\n      user {\n        ID\n        accountID\n        name\n        email\n        avatarUrl\n      }\n      role\n    }\n  }\n"): (typeof documents)["\n  query GetCommunityMembers($communityID: ID!) {\n    getCommunityMembers(communityID: $communityID) {\n      user {\n        ID\n        accountID\n        name\n        email\n        avatarUrl\n      }\n      role\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateCommunity($id: ID!, $input: UpdateCommunityInput!) {\n    updateCommunity(id: $id, input: $input) {\n      ID\n      roomID\n      name\n      description\n      avatarURL\n      memberCount\n      isMember\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateCommunity($id: ID!, $input: UpdateCommunityInput!) {\n    updateCommunity(id: $id, input: $input) {\n      ID\n      roomID\n      name\n      description\n      avatarURL\n      memberCount\n      isMember\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateCommunityMembers($communityID: ID!, $updates: [CommunityMemberUpdateInput!]!) {\n    updateCommunityMembers(communityID: $communityID, updates: $updates)\n  }\n"): (typeof documents)["\n  mutation UpdateCommunityMembers($communityID: ID!, $updates: [CommunityMemberUpdateInput!]!) {\n    updateCommunityMembers(communityID: $communityID, updates: $updates)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query RandomCommunities($limit: Int!) {\n    randomCommunities(limit: $limit) {\n      ID\n      roomID\n      name\n      description\n      avatarURL\n      memberCount\n      isMember\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query RandomCommunities($limit: Int!) {\n    randomCommunities(limit: $limit) {\n      ID\n      roomID\n      name\n      description\n      avatarURL\n      memberCount\n      isMember\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PresignedCommunityIconUploadUrl($contentType: String!) {\n    presignedCommunityIconUploadUrl(contentType: $contentType) {\n      uploadUrl\n      objectKey\n    }\n  }\n"): (typeof documents)["\n  query PresignedCommunityIconUploadUrl($contentType: String!) {\n    presignedCommunityIconUploadUrl(contentType: $contentType) {\n      uploadUrl\n      objectKey\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyUnreadCommunityCount {\n    myUnreadCommunityCount\n  }\n"): (typeof documents)["\n  query MyUnreadCommunityCount {\n    myUnreadCommunityCount\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetFavoriteUsersByUserID($userID: ID!) {\n    GetFavoriteUsersByUserID(userID: $userID) {\n      ID\n      name\n      accountID\n      avatarUrl\n    }\n  }\n"): (typeof documents)["\n  query GetFavoriteUsersByUserID($userID: ID!) {\n    GetFavoriteUsersByUserID(userID: $userID) {\n      ID\n      name\n      accountID\n      avatarUrl\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateFavoriteUser($favoriteUserID: ID!) {\n    createFavoriteUser(favoriteUserID: $favoriteUserID) {\n      ID\n      userID\n      favoriteUserID\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  mutation CreateFavoriteUser($favoriteUserID: ID!) {\n    createFavoriteUser(favoriteUserID: $favoriteUserID) {\n      ID\n      userID\n      favoriteUserID\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteFavoriteUser($favoriteUserID: ID!) {\n    deleteFavoriteUser(favoriteUserID: $favoriteUserID)\n  }\n"): (typeof documents)["\n  mutation DeleteFavoriteUser($favoriteUserID: ID!) {\n    deleteFavoriteUser(favoriteUserID: $favoriteUserID)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ListFavoriteUsers($limit: Int, $offset: Int) {\n    listFavoriteUsers(limit: $limit, offset: $offset) {\n      items {\n        ID\n        name\n        accountID\n        avatarUrl\n      }\n      total\n    }\n  }\n"): (typeof documents)["\n  query ListFavoriteUsers($limit: Int, $offset: Int) {\n    listFavoriteUsers(limit: $limit, offset: $offset) {\n      items {\n        ID\n        name\n        accountID\n        avatarUrl\n      }\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyFollowers($limit: Int, $offset: Int) {\n    myFollowers(limit: $limit, offset: $offset) {\n      items {\n        ID\n        name\n        accountID\n        avatarUrl\n      }\n      total\n    }\n  }\n"): (typeof documents)["\n  query MyFollowers($limit: Int, $offset: Int) {\n    myFollowers(limit: $limit, offset: $offset) {\n      items {\n        ID\n        name\n        accountID\n        avatarUrl\n      }\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateInquiry($input: CreateInquiryInput!) {\n    createInquiry(input: $input) {\n      id\n      name\n      email\n      category\n      subject\n      content\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  mutation CreateInquiry($input: CreateInquiryInput!) {\n    createInquiry(input: $input) {\n      id\n      name\n      email\n      category\n      subject\n      content\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation MarkRoomAsRead($roomID: ID!) {\n    markRoomAsRead(roomID: $roomID)\n  }\n"): (typeof documents)["\n  mutation MarkRoomAsRead($roomID: ID!) {\n    markRoomAsRead(roomID: $roomID)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation GetOrCreateDMRoom($targetUserID: ID!) {\n    getOrCreateDMRoom(targetUserID: $targetUserID) {\n      ID\n      name\n      type\n      user {\n        ID\n        name\n        accountID\n        avatarUrl\n      }\n      isMessagingDisabled\n      lastReadAt\n      unreadCount\n      partnerLastReadAt\n      content\n    }\n  }\n"): (typeof documents)["\n  mutation GetOrCreateDMRoom($targetUserID: ID!) {\n    getOrCreateDMRoom(targetUserID: $targetUserID) {\n      ID\n      name\n      type\n      user {\n        ID\n        name\n        accountID\n        avatarUrl\n      }\n      isMessagingDisabled\n      lastReadAt\n      unreadCount\n      partnerLastReadAt\n      content\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SendMessage($roomID: ID!, $content: String!, $mediaInputs: [MediaUploadInput!]) {\n    sendMessage(roomID: $roomID, content: $content, mediaInputs: $mediaInputs) {\n      ID\n      roomID\n      user {\n        ID\n        name\n        accountID\n        avatarUrl\n      }\n      content\n      media {\n        ID\n        url\n        contentType\n      }\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation SendMessage($roomID: ID!, $content: String!, $mediaInputs: [MediaUploadInput!]) {\n    sendMessage(roomID: $roomID, content: $content, mediaInputs: $mediaInputs) {\n      ID\n      roomID\n      user {\n        ID\n        name\n        accountID\n        avatarUrl\n      }\n      content\n      media {\n        ID\n        url\n        contentType\n      }\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateMessage($roomID: ID!, $id: ID!, $content: String!) {\n    updateMessage(roomID: $roomID, id: $id, content: $content) {\n      ID\n      roomID\n      user {\n        ID\n        name\n        accountID\n        avatarUrl\n      }\n      content\n      media {\n        ID\n        url\n        contentType\n      }\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateMessage($roomID: ID!, $id: ID!, $content: String!) {\n    updateMessage(roomID: $roomID, id: $id, content: $content) {\n      ID\n      roomID\n      user {\n        ID\n        name\n        accountID\n        avatarUrl\n      }\n      content\n      media {\n        ID\n        url\n        contentType\n      }\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteRoom($roomID: ID!) {\n    deleteRoom(roomID: $roomID)\n  }\n"): (typeof documents)["\n  mutation DeleteRoom($roomID: ID!) {\n    deleteRoom(roomID: $roomID)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ListMessages($roomID: ID!, $limit: Int, $before: ID, $after: ID, $afterTime: String) {\n    messages(roomID: $roomID, limit: $limit, before: $before, after: $after, afterTime: $afterTime) {\n      items {\n        ID\n        roomID\n        user {\n          ID\n          name\n          accountID\n          avatarUrl\n        }\n        content\n        media {\n          ID\n          url\n          contentType\n        }\n        createdAt\n        updatedAt\n      }\n      hasMoreBefore\n      hasMoreAfter\n    }\n  }\n"): (typeof documents)["\n  query ListMessages($roomID: ID!, $limit: Int, $before: ID, $after: ID, $afterTime: String) {\n    messages(roomID: $roomID, limit: $limit, before: $before, after: $after, afterTime: $afterTime) {\n      items {\n        ID\n        roomID\n        user {\n          ID\n          name\n          accountID\n          avatarUrl\n        }\n        content\n        media {\n          ID\n          url\n          contentType\n        }\n        createdAt\n        updatedAt\n      }\n      hasMoreBefore\n      hasMoreAfter\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetRoom($id: ID!) {\n    room(id: $id) {\n      ID\n      name\n      type\n      user {\n        ID\n        name\n        accountID\n        avatarUrl\n      }\n      isMessagingDisabled\n      lastReadAt\n      unreadCount\n      partnerLastReadAt\n      content\n    }\n  }\n"): (typeof documents)["\n  query GetRoom($id: ID!) {\n    room(id: $id) {\n      ID\n      name\n      type\n      user {\n        ID\n        name\n        accountID\n        avatarUrl\n      }\n      isMessagingDisabled\n      lastReadAt\n      unreadCount\n      partnerLastReadAt\n      content\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyDMRooms($limit: Int, $offset: Int) {\n    myDMRooms(limit: $limit, offset: $offset) {\n      items {\n        ID\n        name\n        type\n        user {\n          ID\n          name\n          accountID\n          avatarUrl\n        }\n        isMessagingDisabled\n        lastReadAt\n        unreadCount\n        partnerLastReadAt\n        content\n      }\n      total\n    }\n  }\n"): (typeof documents)["\n  query MyDMRooms($limit: Int, $offset: Int) {\n    myDMRooms(limit: $limit, offset: $offset) {\n      items {\n        ID\n        name\n        type\n        user {\n          ID\n          name\n          accountID\n          avatarUrl\n        }\n        isMessagingDisabled\n        lastReadAt\n        unreadCount\n        partnerLastReadAt\n        content\n      }\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PresignedMediaUploadUrl($contentType: String!) {\n    presignedMediaUploadUrl(contentType: $contentType) {\n      uploadUrl\n      objectKey\n    }\n  }\n"): (typeof documents)["\n  query PresignedMediaUploadUrl($contentType: String!) {\n    presignedMediaUploadUrl(contentType: $contentType) {\n      uploadUrl\n      objectKey\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyUnreadDMCount {\n    myUnreadDMCount\n  }\n"): (typeof documents)["\n  query MyUnreadDMCount {\n    myUnreadDMCount\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyNotifications($limit: Int, $offset: Int, $type: String, $actorID: ID) {\n    myNotifications(limit: $limit, offset: $offset, type: $type, actorID: $actorID) {\n      items {\n        ID\n        type\n        actor {\n          ID\n          name\n          accountID\n          avatarUrl\n        }\n        targetType\n        targetID\n        targetPost {\n          ID\n          content\n          deletedAt\n          user {\n            ID\n            name\n            accountID\n          }\n          media {\n            ID\n            url\n            contentType\n          }\n        }\n        message\n        isRead\n        createdAt\n      }\n      total\n    }\n  }\n"): (typeof documents)["\n  query MyNotifications($limit: Int, $offset: Int, $type: String, $actorID: ID) {\n    myNotifications(limit: $limit, offset: $offset, type: $type, actorID: $actorID) {\n      items {\n        ID\n        type\n        actor {\n          ID\n          name\n          accountID\n          avatarUrl\n        }\n        targetType\n        targetID\n        targetPost {\n          ID\n          content\n          deletedAt\n          user {\n            ID\n            name\n            accountID\n          }\n          media {\n            ID\n            url\n            contentType\n          }\n        }\n        message\n        isRead\n        createdAt\n      }\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyNotificationGroups($limit: Int, $offset: Int) {\n    myNotificationGroups(limit: $limit, offset: $offset) {\n      items {\n        key\n        type\n        actor {\n          ID\n          name\n          accountID\n          avatarUrl\n        }\n        targetType\n        targetID\n        targetPost {\n          ID\n          content\n          deletedAt\n          user {\n            ID\n            name\n            accountID\n          }\n          media {\n            ID\n            url\n            contentType\n          }\n        }\n        message\n        createdAt\n        count\n        unreadCount\n        latestID\n      }\n      total\n    }\n  }\n"): (typeof documents)["\n  query MyNotificationGroups($limit: Int, $offset: Int) {\n    myNotificationGroups(limit: $limit, offset: $offset) {\n      items {\n        key\n        type\n        actor {\n          ID\n          name\n          accountID\n          avatarUrl\n        }\n        targetType\n        targetID\n        targetPost {\n          ID\n          content\n          deletedAt\n          user {\n            ID\n            name\n            accountID\n          }\n          media {\n            ID\n            url\n            contentType\n          }\n        }\n        message\n        createdAt\n        count\n        unreadCount\n        latestID\n      }\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Notification($id: ID!) {\n    notification(id: $id) {\n      ID\n      type\n      actor {\n        ID\n        name\n        accountID\n        avatarUrl\n      }\n      targetType\n      targetID\n      targetPost {\n        ID\n        content\n        deletedAt\n        user {\n          ID\n          name\n          accountID\n        }\n        media {\n          ID\n          url\n          contentType\n        }\n      }\n      message\n      isRead\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  query Notification($id: ID!) {\n    notification(id: $id) {\n      ID\n      type\n      actor {\n        ID\n        name\n        accountID\n        avatarUrl\n      }\n      targetType\n      targetID\n      targetPost {\n        ID\n        content\n        deletedAt\n        user {\n          ID\n          name\n          accountID\n        }\n        media {\n          ID\n          url\n          contentType\n        }\n      }\n      message\n      isRead\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyUnreadNotificationCount {\n    myUnreadNotificationCount\n  }\n"): (typeof documents)["\n  query MyUnreadNotificationCount {\n    myUnreadNotificationCount\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation MarkNotificationAsRead($id: ID!) {\n    markNotificationAsRead(id: $id)\n  }\n"): (typeof documents)["\n  mutation MarkNotificationAsRead($id: ID!) {\n    markNotificationAsRead(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation MarkAllNotificationsAsRead {\n    markAllNotificationsAsRead\n  }\n"): (typeof documents)["\n  mutation MarkAllNotificationsAsRead {\n    markAllNotificationsAsRead\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation MarkAllNotificationsAsReadByActor($type: String!, $actorID: ID!) {\n    markAllNotificationsAsReadByActor(type: $type, actorID: $actorID)\n  }\n"): (typeof documents)["\n  mutation MarkAllNotificationsAsReadByActor($type: String!, $actorID: ID!) {\n    markAllNotificationsAsReadByActor(type: $type, actorID: $actorID)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteNotifications($ids: [ID!]!) {\n    deleteNotifications(ids: $ids)\n  }\n"): (typeof documents)["\n  mutation DeleteNotifications($ids: [ID!]!) {\n    deleteNotifications(ids: $ids)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteReadNotifications {\n    deleteReadNotifications\n  }\n"): (typeof documents)["\n  mutation DeleteReadNotifications {\n    deleteReadNotifications\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteReadNotificationsByActor($type: String!, $actorID: ID!) {\n    deleteReadNotificationsByActor(type: $type, actorID: $actorID)\n  }\n"): (typeof documents)["\n  mutation DeleteReadNotificationsByActor($type: String!, $actorID: ID!) {\n    deleteReadNotificationsByActor(type: $type, actorID: $actorID)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment PostFields on Post {\n    ID\n    content\n    createdAt\n    replyCount\n    deletedAt\n    user {\n      ID\n      name\n      accountID\n      avatarUrl\n    }\n    favorites {\n      ID\n      user {\n        ID\n      }\n    }\n    media {\n      ID\n      url\n      contentType\n    }\n  }\n"): (typeof documents)["\n  fragment PostFields on Post {\n    ID\n    content\n    createdAt\n    replyCount\n    deletedAt\n    user {\n      ID\n      name\n      accountID\n      avatarUrl\n    }\n    favorites {\n      ID\n      user {\n        ID\n      }\n    }\n    media {\n      ID\n      url\n      contentType\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TopLevelPosts($limit: Int, $offset: Int) {\n    topLevelPosts(limit: $limit, offset: $offset) {\n      items {\n        ...PostFields\n        replies {\n          ID\n        }\n      }\n      total\n    }\n  }\n"): (typeof documents)["\n  query TopLevelPosts($limit: Int, $offset: Int) {\n    topLevelPosts(limit: $limit, offset: $offset) {\n      items {\n        ...PostFields\n        replies {\n          ID\n        }\n      }\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetPostByID($id: ID!) {\n    getPostByID(id: $id) {\n      ...PostFields\n      rootPost {\n        ...PostFields\n      }\n      replies {\n        ...PostFields\n        replies {\n          ...PostFields\n          replies {\n            ...PostFields\n            replies {\n              ...PostFields\n              replies {\n                ID\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetPostByID($id: ID!) {\n    getPostByID(id: $id) {\n      ...PostFields\n      rootPost {\n        ...PostFields\n      }\n      replies {\n        ...PostFields\n        replies {\n          ...PostFields\n          replies {\n            ...PostFields\n            replies {\n              ...PostFields\n              replies {\n                ID\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetPostsByUserID($user_id: ID!, $limit: Int, $offset: Int) {\n    getPostsByUserID(user_id: $user_id, limit: $limit, offset: $offset) {\n      items {\n        ...PostFields\n        replies {\n          ID\n        }\n      }\n      total\n    }\n  }\n"): (typeof documents)["\n  query GetPostsByUserID($user_id: ID!, $limit: Int, $offset: Int) {\n    getPostsByUserID(user_id: $user_id, limit: $limit, offset: $offset) {\n      items {\n        ...PostFields\n        replies {\n          ID\n        }\n      }\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetFavoritePostsByUserID($user_id: ID!, $limit: Int, $offset: Int) {\n    getFavoritePostsByUserID(user_id: $user_id, limit: $limit, offset: $offset) {\n      items {\n        ...PostFields\n        replies {\n          ID\n        }\n      }\n      total\n    }\n  }\n"): (typeof documents)["\n  query GetFavoritePostsByUserID($user_id: ID!, $limit: Int, $offset: Int) {\n    getFavoritePostsByUserID(user_id: $user_id, limit: $limit, offset: $offset) {\n      items {\n        ...PostFields\n        replies {\n          ID\n        }\n      }\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreatePost($input: CreatePostInput!) {\n    createPost(input: $input) {\n      ...PostFields\n      replies {\n        ID\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreatePost($input: CreatePostInput!) {\n    createPost(input: $input) {\n      ...PostFields\n      replies {\n        ID\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdatePost($input: UpdatePostInput!) {\n    updatePost(input: $input) {\n      ...PostFields\n      replies {\n        ID\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdatePost($input: UpdatePostInput!) {\n    updatePost(input: $input) {\n      ...PostFields\n      replies {\n        ID\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeletePost($id: ID!) {\n    deletePost(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeletePost($id: ID!) {\n    deletePost(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateFavorite($input: CreateFavoriteInput!) {\n    createFavorite(input: $input) {\n      ID\n      user {\n        ID\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateFavorite($input: CreateFavoriteInput!) {\n    createFavorite(input: $input) {\n      ID\n      user {\n        ID\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteFavorite($input: DeleteFavoriteInput!) {\n    deleteFavorite(input: $input)\n  }\n"): (typeof documents)["\n  mutation DeleteFavorite($input: DeleteFavoriteInput!) {\n    deleteFavorite(input: $input)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query NewFeedPostsCount($since: String!) {\n    newFeedPostsCount(since: $since)\n  }\n"): (typeof documents)["\n  query NewFeedPostsCount($since: String!) {\n    newFeedPostsCount(since: $since)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SearchPosts($keyword: String!) {\n    searchPosts(keyword: $keyword) {\n      ...PostFields\n      replies {\n        ID\n      }\n    }\n  }\n"): (typeof documents)["\n  query SearchPosts($keyword: String!) {\n    searchPosts(keyword: $keyword) {\n      ...PostFields\n      replies {\n        ID\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query FollowersTopLevelPosts($userID: ID!, $limit: Int, $offset: Int) {\n    followersTopLevelPosts(userID: $userID, limit: $limit, offset: $offset) {\n      items {\n        ...PostFields\n        replies {\n          ID\n        }\n      }\n      total\n    }\n  }\n"): (typeof documents)["\n  query FollowersTopLevelPosts($userID: ID!, $limit: Int, $offset: Int) {\n    followersTopLevelPosts(userID: $userID, limit: $limit, offset: $offset) {\n      items {\n        ...PostFields\n        replies {\n          ID\n        }\n      }\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Me {\n    me {\n      ID\n      accountID\n      name\n      email\n      role\n      status\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query Me {\n    me {\n      ID\n      accountID\n      name\n      email\n      role\n      status\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SearchUsers($keyword: String!, $limit: Int, $offset: Int) {\n    searchUsers(keyword: $keyword, limit: $limit, offset: $offset) {\n      items {\n        ID\n        accountID\n        name\n        email\n        role\n        status\n        avatarUrl\n        createdAt\n        updatedAt\n      }\n      total\n    }\n  }\n"): (typeof documents)["\n  query SearchUsers($keyword: String!, $limit: Int, $offset: Int) {\n    searchUsers(keyword: $keyword, limit: $limit, offset: $offset) {\n      items {\n        ID\n        accountID\n        name\n        email\n        role\n        status\n        avatarUrl\n        createdAt\n        updatedAt\n      }\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateUser($input: UpdateUserInput!) {\n    updateUser(input: $input) {\n      ID\n      accountID\n      name\n      email\n      role\n      status\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateUser($input: UpdateUserInput!) {\n    updateUser(input: $input) {\n      ID\n      accountID\n      name\n      email\n      role\n      status\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PresignedAvatarUploadUrl($contentType: String!) {\n    presignedAvatarUploadUrl(contentType: $contentType) {\n      uploadUrl\n      objectKey\n    }\n  }\n"): (typeof documents)["\n  query PresignedAvatarUploadUrl($contentType: String!) {\n    presignedAvatarUploadUrl(contentType: $contentType) {\n      uploadUrl\n      objectKey\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SetAvatar($objectKey: String!) {\n    setAvatar(objectKey: $objectKey) {\n      username\n      bio\n      avatarUrl\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation SetAvatar($objectKey: String!) {\n    setAvatar(objectKey: $objectKey) {\n      username\n      bio\n      avatarUrl\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteAvatar {\n    deleteAvatar {\n      username\n      bio\n      avatarUrl\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteAvatar {\n    deleteAvatar {\n      username\n      bio\n      avatarUrl\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteMyAccount {\n    deleteMyAccount\n  }\n"): (typeof documents)["\n  mutation DeleteMyAccount {\n    deleteMyAccount\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetProfileByUserID($userID: ID!) {\n    getProfileByUserID(userID: $userID) {\n      username\n      bio\n      avatarUrl\n      createdAt\n      updatedAt\n      user {\n        ID\n        accountID\n        name\n        email\n        role\n        status\n        avatarUrl\n        createdAt\n        updatedAt\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetProfileByUserID($userID: ID!) {\n    getProfileByUserID(userID: $userID) {\n      username\n      bio\n      avatarUrl\n      createdAt\n      updatedAt\n      user {\n        ID\n        accountID\n        name\n        email\n        role\n        status\n        avatarUrl\n        createdAt\n        updatedAt\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateProfile($input: UpdateProfileInput!) {\n    updateProfile(input: $input) {\n      username\n      bio\n      avatarUrl\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateProfile($input: UpdateProfileInput!) {\n    updateProfile(input: $input) {\n      username\n      bio\n      avatarUrl\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateReport($input: CreateReportInput!) {\n    createReport(input: $input) {\n      ID\n      targetType\n      targetID\n      reporter {\n        ID\n        name\n        accountID\n      }\n      reason\n      customReason\n    }\n  }\n"): (typeof documents)["\n  mutation CreateReport($input: CreateReportInput!) {\n    createReport(input: $input) {\n      ID\n      targetType\n      targetID\n      reporter {\n        ID\n        name\n        accountID\n      }\n      reason\n      customReason\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyTermsConsentStatus {\n    myTermsConsentStatus {\n      isConsented\n      currentTerms {\n        ID\n        version\n        documentUrl\n        effectiveDate\n        createdAt\n      }\n    }\n  }\n"): (typeof documents)["\n  query MyTermsConsentStatus {\n    myTermsConsentStatus {\n      isConsented\n      currentTerms {\n        ID\n        version\n        documentUrl\n        effectiveDate\n        createdAt\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ConsentToTerms($termsID: ID!) {\n    consentToTerms(termsID: $termsID)\n  }\n"): (typeof documents)["\n  mutation ConsentToTerms($termsID: ID!) {\n    consentToTerms(termsID: $termsID)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CurrentTerms {\n    currentTerms {\n      ID\n      version\n      documentUrl\n      effectiveDate\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  query CurrentTerms {\n    currentTerms {\n      ID\n      version\n      documentUrl\n      effectiveDate\n      createdAt\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;