import { request } from '../../../lib/graphql';
import { getUserToken } from '../../user/api/auth';
import { ADMIN_TOKEN_KEY } from './auth';

const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;

export const SEARCH_REPORTS_QUERY = `
  query SearchReports($filter: ReportSearchFilter) {
    searchReports(filter: $filter) {
      ID
      targetType
      targetID
      reason
      customReason
      status
      createdAt
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

export const getReports = async (filterStatus?: string, targetType?: string) => {
  const filter: any = {};
  if (filterStatus && filterStatus !== 'ALL') {
    filter.status = filterStatus;
  }
  if (targetType && targetType !== 'ALL') {
    filter.targetType = targetType;
  }
  const variables = Object.keys(filter).length > 0 ? { filter } : {};
  const data = await request<{ searchReports: any[] }>(SEARCH_REPORTS_QUERY, variables, getAdminToken());
  return data;
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