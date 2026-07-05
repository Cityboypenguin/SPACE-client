import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import type { InquiryStatus } from '../../../generated/graphql';
import { ADMIN_TOKEN_KEY } from '../../../lib/authStorage';

const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;

type Inquiry = {
  id: string;
  name: string;
  email: string;
  category: string;
  subject: string;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type InquiryPage = { items: Inquiry[]; total: number };

const SearchInquiriesDocument = graphql(`
  query SearchInquiries($status: InquiryStatus, $limit: Int, $offset: Int) {
    searchInquiries(status: $status, limit: $limit, offset: $offset) {
      items {
        id
        name
        email
        category
        subject
        content
        status
        createdAt
        updatedAt
      }
      total
    }
  }
`);

const GetInquiryDocument = graphql(`
  query GetInquiry($id: ID!) {
    getInquiry(id: $id) {
      id
      name
      email
      category
      subject
      content
      status
      createdAt
      updatedAt
    }
  }
`);

const UpdateInquiryStatusDocument = graphql(`
  mutation UpdateInquiryStatus($id: ID!, $status: InquiryStatus!) {
    updateInquiryStatus(id: $id, status: $status) {
      id
      status
    }
  }
`);

export const getInquiries = async (status?: string, limit = 20, offset = 0) => {
  const variables: { status?: InquiryStatus; limit: number; offset: number } = { limit, offset };
  if (status && status !== 'ALL') variables.status = status as InquiryStatus;
  const data = await requestDoc(SearchInquiriesDocument, variables, getAdminToken());
  return data.searchInquiries as InquiryPage;
};

export const getInquiry = async (id: string) => {
  const data = await requestDoc(GetInquiryDocument, { id }, getAdminToken());
  return data.getInquiry as Inquiry;
};

export const updateInquiryStatus = async (id: string, status: string) => {
  const data = await requestDoc(UpdateInquiryStatusDocument, { id, status: status as InquiryStatus }, getAdminToken());
  return data.updateInquiryStatus;
};
