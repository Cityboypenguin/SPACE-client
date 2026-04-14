import { request } from '../../../lib/graphql';

type Administrator = {
  ID: string;
  name: string;
  email: string;
};

type CreateAdministratorResponse = {
  createAdministrator: Administrator;
};

const CREATE_ADMINISTRATOR_MUTATION = `
  mutation CreateAdministrator($input: CreateAdministratorInput!) {
    createAdministrator(input: $input) {
      ID
      name
      email
    }
  }
`;

export const registerAdministrator = async (name: string, email: string, password: string) => {
  return await request<CreateAdministratorResponse>(CREATE_ADMINISTRATOR_MUTATION, {
    input: { name, email, password },
  });
};
