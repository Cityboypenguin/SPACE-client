import { request } from '../../../lib/graphql';

export type InquiryCategory =
  | 'DM'
  | 'POST'
  | 'COMMUNITY'
  | 'PASSWORD'
  | 'LOGIN'
  | 'OTHER';

type Inquiry = {
  id: string;
  name: string;
  email: string;
  category: InquiryCategory;
  subject: string;
  content: string;
  createdAt: string;
};

type CreateInquiryResponse = {
  createInquiry: Inquiry;
};

const CREATE_INQUIRY_MUTATION = `
  mutation CreateInquiry($input: CreateInquiryInput!) {
    createInquiry(input: $input) {
      id
      name
      email
      category
      subject
      content
      createdAt
    }
  }
`;

export const createInquiry = async (
  name: string,
  email: string,
  category: InquiryCategory,
  subject: string,
  content: string,
): Promise<Inquiry> => {
  const data = await request<CreateInquiryResponse>(CREATE_INQUIRY_MUTATION, {
    input: { name, email, category, subject, content },
  });
  return data.createInquiry;
};
