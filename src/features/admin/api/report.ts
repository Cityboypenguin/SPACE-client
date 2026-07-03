import { request } from '../../../lib/graphql';
import { getUserToken } from '../../user/api/auth';
import { ADMIN_TOKEN_KEY } from './auth';

const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;

export type ReportPage = { items: any[]; total: number };

export const SEARCH_REPORTS_QUERY = `
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
`;

export const UPDATE_REPORT_STATUS_MUTATION = `
  mutation UpdateReportStatus($id: ID!, $status: ReportStatus!) {
    updateReportStatus(id: $id, status: $status) {
      ID
      status
    }
  }
`;

export const CREATE_REPORT_MUTATION = `
  mutation CreateReport($input: CreateReportInput!) {
    createReport(input: $input) {
      ID
      status
    }
  }
`;

export const GET_REPORT_SERVICE_STATUS_QUERY = `
  query GetReportServiceStatus {
    isReportServiceEnabled
  }
`;

export const SET_REPORT_SERVICE_STATUS_MUTATION = `
  mutation SetReportServiceStatus($enabled: Boolean!) {
    setReportServiceStatus(enabled: $enabled)
  }
`;

export const getReports = async (filterStatus?: string, targetType?: string, limit = 20, offset = 0): Promise<ReportPage> => {
  const filter: any = {};
  if (filterStatus && filterStatus !== 'ALL') {
    filter.status = filterStatus;
  }
  if (targetType && targetType !== 'ALL') {
    filter.targetType = targetType;
  }
  const variables: any = { limit, offset };
  if (Object.keys(filter).length > 0) variables.filter = filter;
  const data = await request<{ searchReports: ReportPage }>(SEARCH_REPORTS_QUERY, variables, getAdminToken());
  return data.searchReports;
};

export const adminUpdateReportStatus = async (id: string, status: string) => {
  const data = await request(UPDATE_REPORT_STATUS_MUTATION, { id, status }, getAdminToken());
  return data;
};

export const createReport = async (input: {
  targetType: 'POST' | 'USER' | 'COMMENT' | 'PROMOTION' | 'COMMUNITY'; 
  targetID: string;
  reason: string;
  customReason: string | null;
}) => {
  const data = await request(
    CREATE_REPORT_MUTATION, 
    { input }, 
    getUserToken()
  );
  return data;
};

export const getReportServiceStatus = async (): Promise<boolean> => {
  const data = await request<{ isReportServiceEnabled: boolean }>(
    GET_REPORT_SERVICE_STATUS_QUERY,
    {},
    getAdminToken()
  );
  return data?.isReportServiceEnabled ?? true;
};

export const updateReportServiceStatus = async (enabled: boolean): Promise<boolean> => {
  const data = await request<{ setReportServiceStatus: boolean }>(
    SET_REPORT_SERVICE_STATUS_MUTATION,
    { enabled },
    getAdminToken()
  );
  return data?.setReportServiceStatus ?? enabled;
};