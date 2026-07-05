import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';

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

const CreateInquiryDocument = graphql(`
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
`);

export const createInquiry = async (
  name: string,
  email: string,
  category: InquiryCategory,
  subject: string,
  content: string,
): Promise<Inquiry> => {
  const data = await requestDoc(CreateInquiryDocument, {
    input: { name, email, category, subject, content },
  });
  return data.createInquiry;
};
