import { request } from '../../../lib/graphql';

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
      reporter {
        ID
        name
        accountID
      }
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