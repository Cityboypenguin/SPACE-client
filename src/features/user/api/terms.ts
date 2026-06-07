import { request } from '../../../lib/graphql';
import { getUserToken } from './auth';

export type TermsOfService = {
  ID: string;
  version: string;
  documentUrl: string;
  effectiveDate: string;
  createdAt: string;
};

export type TermsConsentStatus = {
  isConsented: boolean;
  currentTerms: TermsOfService | null;
};

const MY_TERMS_CONSENT_STATUS_QUERY = `
  query MyTermsConsentStatus {
    myTermsConsentStatus {
      isConsented
      currentTerms {
        ID
        version
        documentUrl
        effectiveDate
        createdAt
      }
    }
  }
`;

const CONSENT_TO_TERMS_MUTATION = `
  mutation ConsentToTerms($termsID: ID!) {
    consentToTerms(termsID: $termsID)
  }
`;

export const getMyTermsConsentStatus = async (): Promise<TermsConsentStatus> => {
  const data = await request<{ myTermsConsentStatus: TermsConsentStatus }>(
    MY_TERMS_CONSENT_STATUS_QUERY,
    {},
    getUserToken(),
  );
  return data.myTermsConsentStatus;
};

export const consentToTerms = async (termsID: string): Promise<boolean> => {
  const data = await request<{ consentToTerms: boolean }>(
    CONSENT_TO_TERMS_MUTATION,
    { termsID },
    getUserToken(),
  );
  return data.consentToTerms;
};

const CURRENT_TERMS_QUERY = `
  query CurrentTerms {
    currentTerms {
      ID
      version
      documentUrl
      effectiveDate
      createdAt
    }
  }
`;

export const getCurrentTerms = async (): Promise<TermsOfService | null> => {
  const data = await request<{ currentTerms: TermsOfService | null }>(CURRENT_TERMS_QUERY, {});
  return data.currentTerms;
};
