import { request } from '../../../lib/graphql';

const ADMIN_TOKEN_KEY = 'space_admin_token';

export type Administrator = {
  ID: string;
  name: string;
  email: string;
};

type CreateAdministratorResponse = {
  createAdministrator: Administrator;
};

type GetAdministratorByIDResponse = {
  getAdministratorByID: Administrator;
};

type SearchAdministratorsResponse = {
  searchAdministrators: Administrator[];
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

const GET_ADMINISTRATOR_BY_ID_QUERY = `
  query GetAdministratorByID($id: ID!) {
    getAdministratorByID(id: $id) {
      ID
      name
      email
    }
  }
`;

const SEARCH_ADMINISTRATORS_QUERY = `
  query SearchAdministrators($name: String!) {
    searchAdministrators(name: $name) {
      ID
      name
      email
    }
  }
`;

const GET_ADMINISTRATORS_QUERY = `
  query {
    administrators {
      ID
      name
      email
    }
  }
`;

export const getAdministrators = async () => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;
  return await request<{ administrators: Administrator[] }>(
    GET_ADMINISTRATORS_QUERY,
    {},
    token,
  );
};

export const searchAdministrators = async (name: string) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;
  return await request<SearchAdministratorsResponse>(
    SEARCH_ADMINISTRATORS_QUERY,
    { name },
    token,
  );
};

export const getAllAdministrators = async () => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;
  return await request<{ administrators: Administrator[] }>(
    GET_ADMINISTRATORS_QUERY,
    {},
    token,
  );
};

export const getAdministratorsByName = async (name: string) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;
  return await request<SearchAdministratorsResponse>(
    SEARCH_ADMINISTRATORS_QUERY,
    { name },
    token,
  );
};

export const getAdministratorByID = async (id: string) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;
  return await request<GetAdministratorByIDResponse>(
    GET_ADMINISTRATOR_BY_ID_QUERY,
    { id },
    token,
  );
};

export const registerAdministrator = async (name: string, email: string, password: string) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;
  return await request<CreateAdministratorResponse>(
    CREATE_ADMINISTRATOR_MUTATION,
    {
      input: { name, email, password },
      },
    token,
  );
};

export const deleteAdministrator = async (id: string) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;
  const DELETE_ADMINISTRATOR_MUTATION = `
    mutation DeleteAdministrator($id: ID!) {
      deleteAdministrator(id: $id)
    }
  `;
  return await request<{ deleteAdministrator: boolean }>(
    DELETE_ADMINISTRATOR_MUTATION,
    { id },
    token,
  );
};

export const updateAdministrator = async (id: string, name?: string, email?: string, password?: string) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;
  const UPDATE_ADMINISTRATOR_MUTATION = `
    mutation UpdateAdministrator($input: UpdateAdministratorInput!) {
      updateAdministrator(input: $input) {
        ID
        name
        email
      }
    }
  `;
  return await request<{ updateAdministrator: Administrator }>(
    UPDATE_ADMINISTRATOR_MUTATION,
    { input: { id, name, email, password } },
    token,
  );
};

export const searchAdministratorsByName = async (name: string) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;
  return await request<SearchAdministratorsResponse>(
    SEARCH_ADMINISTRATORS_QUERY,
    { name },
    token,
  );
};

export const getAdministratorByEmail = async (email: string) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;
  const GET_ADMINISTRATOR_BY_EMAIL_QUERY = `
    query GetAdministratorByEmail($email: String!) {
      getAdministratorByEmail(email: $email) {
        ID
        name
        email
      }
    }
  `;
  return await request<{ getAdministratorByEmail: Administrator }>(
    GET_ADMINISTRATOR_BY_EMAIL_QUERY,
    { email },
    token,
  );
}