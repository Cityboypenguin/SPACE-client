import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';

const ToggleMaintenanceModeDocument = graphql(`
  mutation ToggleMaintenanceMode($enabled: Boolean!) {
    toggleMaintenanceMode(enabled: $enabled)
  }
`);

const MaintenanceModeDocument = graphql(`
  query MaintenanceMode {
    maintenanceMode
  }
`);

export const toggleMaintenanceMode = async (enabled: boolean, token: string): Promise<boolean> => {
  const data = await requestDoc(ToggleMaintenanceModeDocument, { enabled }, token);
  return data.toggleMaintenanceMode;
};

export const getMaintenanceMode = async (token: string): Promise<boolean> => {
  const data = await requestDoc(MaintenanceModeDocument, {}, token);
  return data.maintenanceMode;
};
