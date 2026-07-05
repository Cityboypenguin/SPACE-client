import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
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

const MyTermsConsentStatusDocument = graphql(`
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
`);

const ConsentToTermsDocument = graphql(`
  mutation ConsentToTerms($termsID: ID!) {
    consentToTerms(termsID: $termsID)
  }
`);

export const getMyTermsConsentStatus = async (): Promise<TermsConsentStatus> => {
  const data = await requestDoc(MyTermsConsentStatusDocument, {}, getUserToken());
  return data.myTermsConsentStatus;
};

export const consentToTerms = async (termsID: string): Promise<boolean> => {
  const data = await requestDoc(ConsentToTermsDocument, { termsID }, getUserToken());
  return data.consentToTerms;
};

const CurrentTermsDocument = graphql(`
  query CurrentTerms {
    currentTerms {
      ID
      version
      documentUrl
      effectiveDate
      createdAt
    }
  }
`);

export const getCurrentTerms = async (): Promise<TermsOfService | null> => {
  const data = await requestDoc(CurrentTermsDocument, {});
  return data.currentTerms ?? null;
};
