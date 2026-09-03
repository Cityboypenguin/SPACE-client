import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import { ADMIN_TOKEN_KEY } from '../../../lib/authStorage';

export type Administrator = {
  ID: string;
  name: string;
  email: string;
};

export type AdministratorPage = { items: Administrator[]; total: number };

const CreateAdministratorDocument = graphql(`
  mutation CreateAdministrator($input: CreateAdministratorInput!) {
    createAdministrator(input: $input) {
      ID
      name
      email
    }
  }
`);

const GetAdministratorByIDDocument = graphql(`
  query GetAdministratorByID($id: ID!) {
    getAdministratorByID(id: $id) {
      ID
      name
      email
    }
  }
`);

const SearchAdministratorsDocument = graphql(`
  query SearchAdministrators($name: String!) {
    searchAdministrators(name: $name) {
      ID
      name
      email
    }
  }
`);

const AdministratorsDocument = graphql(`
  query Administrators($limit: Int, $offset: Int) {
    administrators(limit: $limit, offset: $offset) {
      items {
        ID
        name
        email
      }
      total
    }
  }
`);

const DeleteAdministratorDocument = graphql(`
  mutation DeleteAdministrator($id: ID!) {
    deleteAdministrator(id: $id)
  }
`);

const UpdateAdministratorDocument = graphql(`
  mutation UpdateAdministrator($id: ID!, $input: UpdateAdministratorInput!) {
    updateAdministrator(id: $id, input: $input) {
      ID
      name
      email
    }
  }
`);

export const getAdministrators = async (limit = 20, offset = 0) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;
  return await requestDoc(AdministratorsDocument, { limit, offset }, token);
};

export const searchAdministrators = async (name: string) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;
  return await requestDoc(SearchAdministratorsDocument, { name }, token);
};

export const getAllAdministrators = async (limit = 20, offset = 0) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;
  return await requestDoc(AdministratorsDocument, { limit, offset }, token);
};

export const getAdministratorsByName = async (name: string) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;
  return await requestDoc(SearchAdministratorsDocument, { name }, token);
};

export const getAdministratorByID = async (id: string) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;
  return await requestDoc(GetAdministratorByIDDocument, { id }, token);
};

export const registerAdministrator = async (name: string, email: string, password: string) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;
  return await requestDoc(CreateAdministratorDocument, { input: { name, email, password } }, token);
};

export const deleteAdministrator = async (id: string) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;
  return await requestDoc(DeleteAdministratorDocument, { id }, token);
};

export const updateAdministrator = async (id: string, name?: string, email?: string, password?: string) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;
  const input: { name?: string; email?: string; password?: string } = {};
  if (name !== undefined) input.name = name;
  if (email !== undefined) input.email = email;
  if (password !== undefined) input.password = password;
  return await requestDoc(UpdateAdministratorDocument, { id, input }, token);
};

export const searchAdministratorsByName = async (name: string) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;
  return await requestDoc(SearchAdministratorsDocument, { name }, token);
};
