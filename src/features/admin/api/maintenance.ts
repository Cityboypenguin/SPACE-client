import { request } from '../../../lib/graphql';

const TOGGLE_MAINTENANCE_MUTATION = `
  mutation ToggleMaintenanceMode($enabled: Boolean!) {
    toggleMaintenanceMode(enabled: $enabled)
  }
`;

const MAINTENANCE_MODE_QUERY = `
  query MaintenanceMode {
    maintenanceMode
  }
`;

export const toggleMaintenanceMode = async (enabled: boolean, token: string): Promise<boolean> => {
  const data = await request<{ toggleMaintenanceMode: boolean }>(
    TOGGLE_MAINTENANCE_MUTATION,
    { enabled },
    token,
  );
  return data.toggleMaintenanceMode;
};

export const getMaintenanceMode = async (token: string): Promise<boolean> => {
  const data = await request<{ maintenanceMode: boolean }>(
    MAINTENANCE_MODE_QUERY,
    {},
    token,
  );
  return data.maintenanceMode;
};
