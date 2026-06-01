import { request } from '../../../lib/graphql';

const ADMIN_TOKEN_KEY = 'space_admin_token';
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

export const getReports = async (filterStatus?: string) => {
  const variables = filterStatus && filterStatus !== 'ALL'
    ? { filter: { status: filterStatus } }
    : {};
  
  const data = await request<{ searchReports: any[] }>(SEARCH_REPORTS_QUERY, variables, getAdminToken());
  return data;
};

export const adminUpdateReportStatus = async (id: string, status: string) => {
  const data = await request(UPDATE_REPORT_STATUS_MUTATION, { id, status }, getAdminToken());
  return data;
};