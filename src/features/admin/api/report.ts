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
  status: string;
  createdAt: string;
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
        status
        createdAt
      }
      total
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
