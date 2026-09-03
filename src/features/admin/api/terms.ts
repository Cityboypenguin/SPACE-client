import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import { ADMIN_TOKEN_KEY } from '../../../lib/authStorage';
import { storageUrl } from '../../../lib/storage';

const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;

export type TermsOfService = {
  ID: string;
  version: string;
  documentUrl: string;
  effectiveDate: string;
  createdAt: string;
};

const PresignedTermsDocumentUploadUrlDocument = graphql(`
  query PresignedTermsDocumentUploadUrl {
    presignedTermsDocumentUploadUrl {
      uploadUrl
      objectKey
    }
  }
`);

export const getPresignedTermsDocumentUploadUrl = async (): Promise<{
  uploadUrl: string;
  objectKey: string;
}> => {
  const data = await requestDoc(PresignedTermsDocumentUploadUrlDocument, {}, getAdminToken());
  return data.presignedTermsDocumentUploadUrl;
};

export const uploadTermsDocument = async (uploadUrl: string, file: File): Promise<void> => {
  const buffer = await file.arrayBuffer();
  const res = await fetch(storageUrl(uploadUrl) ?? uploadUrl, {
    method: 'PUT',
    body: new Blob([buffer]),
  });
  if (!res.ok) throw new Error(`upload failed: ${res.status}`);
};

export type TermsConsentRecord = {
  ID: string;
  user: {
    ID: string;
    accountID: string;
    name: string;
    email: string;
  };
  consentedAt: string;
};

const AdminListTermsDocument = graphql(`
  query AdminListTerms {
    adminListTerms {
      ID
      version
      documentUrl
      effectiveDate
      createdAt
    }
  }
`);

export const listTerms = async (): Promise<TermsOfService[]> => {
  const data = await requestDoc(AdminListTermsDocument, {}, getAdminToken());
  return data.adminListTerms;
};

export type TermsConsentPage = { items: TermsConsentRecord[]; total: number };

const AdminListConsentsDocument = graphql(`
  query AdminListConsents($termsID: ID!, $limit: Int, $offset: Int) {
    adminListConsents(termsID: $termsID, limit: $limit, offset: $offset) {
      items {
        ID
        user {
          ID
          accountID
          name
          email
        }
        consentedAt
      }
      total
    }
  }
`);

export const listConsents = async (termsID: string, limit = 20, offset = 0): Promise<TermsConsentPage> => {
  const data = await requestDoc(AdminListConsentsDocument, { termsID, limit, offset }, getAdminToken());
  return data.adminListConsents;
};

const CreateTermsOfServiceDocument = graphql(`
  mutation CreateTermsOfService($input: CreateTermsOfServiceInput!) {
    createTermsOfService(input: $input) {
      ID
      version
      documentUrl
      effectiveDate
      createdAt
    }
  }
`);

export const createTermsOfService = async (
  version: string,
  objectKey: string,
  effectiveDate: string,
): Promise<TermsOfService> => {
  const data = await requestDoc(
    CreateTermsOfServiceDocument,
    { input: { version, objectKey, effectiveDate } },
    getAdminToken(),
  );
  return data.createTermsOfService;
};
