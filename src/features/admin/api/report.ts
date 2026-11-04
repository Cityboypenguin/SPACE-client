import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import type { ReportStatus, ReportTargetType } from '../../../generated/graphql';
import { getUserToken } from '../../user/api/auth';
import { ADMIN_TOKEN_KEY } from './auth';

const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;

export type Report = {
  ID: string;
  targetType: string;
  targetID: string;
  reason: string;
  customReason: string | null;
  content: string | null;
  reportedContent: ReportedContent | null;
  status: string;
  createdAt: string;
};

// 通報を受けた時点の内容。あとから編集・削除されても変わらない。
export type ReportedContent = {
  roomType: string;
  roomName: string;
  // スレッドの中の内容（またはスレッドの通報）のときのスレッドの題名。roomName は親の授業・コミュニティ。
  threadTitle: string | null;
  authorID: string | null;
  authorName: string;
  authorAccountID: string | null;
  content: string;
  media: { ID: string; url: string; contentType: string }[];
  stampID: string | null;
  addenda: string[];
  parentBody: string | null;
  pollOptions: string[];
  createdAt: string;
  updatedAt: string;
};

export type ReportDetail = Report & {
  reporter: { ID: string; name: string; accountID: string };
};

export type ReportPage = { items: Report[]; total: number };

const SearchReportsDocument = graphql(`
  query SearchReports($filter: ReportSearchFilter, $limit: Int, $offset: Int) {
    searchReports(filter: $filter, limit: $limit, offset: $offset) {
      items {
        ID
        targetType
        targetID
        reason
        customReason
        content
        reportedContent {
          roomType
          roomName
          threadTitle
          authorID
          authorName
          authorAccountID
          content
          media {
            ID
            url
            contentType
          }
          stampID
          addenda
          parentBody
          pollOptions
          createdAt
          updatedAt
        }
        status
        createdAt
      }
      total
    }
  }
`);

const GetReportDocument = graphql(`
  query GetReport($id: ID!) {
    getReport(id: $id) {
      ID
      targetType
      targetID
      reason
      customReason
      content
      reporter {
        ID
        name
        accountID
      }
      reportedContent {
        roomType
        roomName
        threadTitle
        authorID
        authorName
        authorAccountID
        content
        media {
          ID
          url
          contentType
        }
        stampID
        addenda
        parentBody
        pollOptions
        createdAt
        updatedAt
      }
      status
      createdAt
    }
  }
`);

const UpdateReportStatusDocument = graphql(`
  mutation UpdateReportStatus($id: ID!, $status: ReportStatus!) {
    updateReportStatus(id: $id, status: $status) {
      ID
      status
    }
  }
`);

const CreateReportDocument = graphql(`
  mutation AdminCreateReport($input: CreateReportInput!) {
    createReport(input: $input) {
      ID
      status
    }
  }
`);

const GetReportServiceStatusDocument = graphql(`
  query GetReportServiceStatus {
    isReportServiceEnabled
  }
`);

const SetReportServiceStatusDocument = graphql(`
  mutation SetReportServiceStatus($enabled: Boolean!) {
    setReportServiceStatus(enabled: $enabled)
  }
`);

export type ReportNotificationRecipient = {
  ID: string;
  email: string;
  createdAt: string;
};

const ReportNotificationRecipientsDocument = graphql(`
  query ReportNotificationRecipients {
    reportNotificationRecipients {
      ID
      email
      createdAt
    }
  }
`);

const AddReportNotificationRecipientDocument = graphql(`
  mutation AddReportNotificationRecipient($email: String!) {
    addReportNotificationRecipient(email: $email) {
      ID
      email
      createdAt
    }
  }
`);

const RemoveReportNotificationRecipientDocument = graphql(`
  mutation RemoveReportNotificationRecipient($id: ID!) {
    removeReportNotificationRecipient(id: $id)
  }
`);

export const getReportNotificationRecipients = async (): Promise<ReportNotificationRecipient[]> => {
  const data = await requestDoc(ReportNotificationRecipientsDocument, {}, getAdminToken());
  return data.reportNotificationRecipients;
};

export const addReportNotificationRecipient = async (email: string): Promise<ReportNotificationRecipient> => {
  const data = await requestDoc(AddReportNotificationRecipientDocument, { email }, getAdminToken());
  return data.addReportNotificationRecipient;
};

export const removeReportNotificationRecipient = async (id: string): Promise<void> => {
  await requestDoc(RemoveReportNotificationRecipientDocument, { id }, getAdminToken());
};

export const getReports = async (filterStatus?: string, targetType?: string, limit = 20, offset = 0): Promise<ReportPage> => {
  const filter: { status?: ReportStatus; targetType?: ReportTargetType } = {};
  if (filterStatus && filterStatus !== 'ALL') {
    filter.status = filterStatus as ReportStatus;
  }
  if (targetType && targetType !== 'ALL') {
    filter.targetType = targetType as ReportTargetType;
  }
  const variables: { limit: number; offset: number; filter?: typeof filter } = { limit, offset };
  if (Object.keys(filter).length > 0) variables.filter = filter;
  const data = await requestDoc(SearchReportsDocument, variables, getAdminToken());
  return data.searchReports as ReportPage;
};

export const getReport = async (id: string): Promise<ReportDetail | null> => {
  const data = await requestDoc(GetReportDocument, { id }, getAdminToken());
  return data.getReport as ReportDetail | null;
};

/**
 * 未対応（UNRESOLVEDまたはPENDING）の通報件数を取得する関数
 */
export const getPendingReportCount = async (): Promise<number> => {
  try {
    // UNRESOLVED ではなく PENDING で検索する
    const data = await getReports('PENDING', 'ALL', 1, 0);
    return data.total ?? 0;
  } catch (err) {
    console.error('通報バッジカウントの取得に失敗:', err);
    return 0;
  }
};

export const adminUpdateReportStatus = async (id: string, status: string) => {
  const data = await requestDoc(UpdateReportStatusDocument, { id, status: status as ReportStatus }, getAdminToken());
  return data;
};

export const createReport = async (input: {
  targetType: 'POST' | 'USER' | 'COMMENT' | 'PROMOTION' | 'COMMUNITY';
  targetID: string;
  reason: string;
  customReason: string | null;
}) => {
  const data = await requestDoc(CreateReportDocument, { input: input as { targetType: ReportTargetType; targetID: string; reason: string; customReason: string | null } }, getUserToken());
  return data;
};

export const getReportServiceStatus = async (): Promise<boolean> => {
  const data = await requestDoc(GetReportServiceStatusDocument, {}, getAdminToken());
  return data?.isReportServiceEnabled ?? true;
};

export const updateReportServiceStatus = async (enabled: boolean): Promise<boolean> => {
  const data = await requestDoc(SetReportServiceStatusDocument, { enabled }, getAdminToken());
  return data?.setReportServiceStatus ?? enabled;
};
