// src/features/user/api/report.ts
import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import type { CreateReportMutationVariables } from '../../../generated/graphql';
import { getUserToken } from './auth';

// クエリはサーバーの schema.graphqls に対して codegen で検証される。
// 存在しないフィールドを選択した場合はビルド前(codegen)で失敗するため、型と選択のズレが起きない。
const CreateReportDocument = graphql(`
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
`);

export const createReport = async (input: CreateReportMutationVariables['input']) => {
  const token = getUserToken();
  if (!token) {
    throw new Error('認証が必要です。ログインしてください。');
  }
  return await requestDoc(CreateReportDocument, { input }, token);
};
