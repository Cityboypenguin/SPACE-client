// src/features/user/api/report.ts
import { request } from '../../../lib/graphql';
import { USER_TOKEN_KEY } from './auth';

export type UserReport = {
  ID: string;
  targetType: 'POST' | 'USER';
  targetID: string;
  reason: string;
  customReason: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type CreateReportResponse = { createReport: UserReport };

const CREATE_REPORT_MUTATION = `
  mutation CreateReport($input: CreateReportInput!) {
    createReport(input: $input) {
      ID
      targetType
      targetID
      reporter {
        ID
        name
        accountID
      }
      reason
      customReason
    }
  }
`;

const getUserToken = () => localStorage.getItem(USER_TOKEN_KEY) ?? undefined;

export const createReport = async (input: {
  targetType: 'POST' | 'USER' | 'COMMUNITY';
  targetID: string;
  reason: string;
  customReason: string | null;
}) => {
  const token = getUserToken();
  if (!token) {
    throw new Error('認証が必要です。ログインしてください。');
  }
  return await request<CreateReportResponse>(CREATE_REPORT_MUTATION, { input }, token);
};