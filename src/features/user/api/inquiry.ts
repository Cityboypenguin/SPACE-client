import { request } from '../../../lib/graphql';

type Inquiry = {
  id: string;
  name: string;
  email: string;
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
      subject
      content
      createdAt
    }
  }
`;

export const createInquiry = async (
  name: string,
  email: string,
  subject: string,
  content: string,
): Promise<Inquiry> => {
  const data = await request<CreateInquiryResponse>(CREATE_INQUIRY_MUTATION, {
    input: { name, email, subject, content },
  });
  return data.createInquiry;
};
