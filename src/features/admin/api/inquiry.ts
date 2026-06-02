import { request } from '../../../lib/graphql';

const ADMIN_TOKEN_KEY = 'space_admin_token';
const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;

type Inquiry = {
  id: string;
  name: string;
  email: string;
  subject: string;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

const SEARCH_INQUIRIES_QUERY = `
  query SearchInquiries($status: InquiryStatus) {
    searchInquiries(status: $status) {
      id
      name
      email
      subject
      content
      status
      createdAt
      updatedAt
    }
  }
`;

const GET_INQUIRY_QUERY = `
  query GetInquiry($id: ID!) {
    getInquiry(id: $id) {
      id
      name
      email
      subject
      content
      status
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_INQUIRY_STATUS_MUTATION = `
  mutation UpdateInquiryStatus($id: ID!, $status: InquiryStatus!) {
    updateInquiryStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;

export const getInquiries = async (status?: string) => {
  const variables = status && status !== 'ALL' ? { status } : {};
  const data = await request<{ searchInquiries: Inquiry[] }>(
    SEARCH_INQUIRIES_QUERY,
    variables,
    getAdminToken(),
  );
  return data.searchInquiries;
};

export const getInquiry = async (id: string) => {
  const data = await request<{ getInquiry: Inquiry }>(
    GET_INQUIRY_QUERY,
    { id },
    getAdminToken(),
  );
  return data.getInquiry;
};

export const updateInquiryStatus = async (id: string, status: string) => {
  const data = await request<{ updateInquiryStatus: Inquiry }>(
    UPDATE_INQUIRY_STATUS_MUTATION,
    { id, status },
    getAdminToken(),
  );
  return data.updateInquiryStatus;
};
