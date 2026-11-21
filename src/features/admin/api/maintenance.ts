import { request, requestDoc } from '../../../lib/graphql';
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

const ToggleCourseChatDocument = graphql(`
  mutation ToggleCourseChat($enabled: Boolean!) {
    toggleCourseChat(enabled: $enabled)
  }
`);

const CourseChatEnabledDocument = graphql(`
  query CourseChatEnabled {
    courseChatEnabled
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

export const toggleCourseChat = async (enabled: boolean, token: string): Promise<boolean> => {
  const data = await requestDoc(ToggleCourseChatDocument, { enabled }, token);
  return data.toggleCourseChat;
};

export const getCourseChatEnabled = async (token: string): Promise<boolean> => {
  const data = await requestDoc(CourseChatEnabledDocument, {}, token);
  return data.courseChatEnabled;
};

export const getTimetableEnabled = async (token: string): Promise<boolean> => {
  const data = await request<{ timetableEnabled: boolean }>(
    'query TimetableEnabled { timetableEnabled }',
    {},
    token,
  );
  return data.timetableEnabled;
};

export const toggleTimetableEnabled = async (enabled: boolean, token: string): Promise<boolean> => {
  const data = await request<{ toggleTimetableEnabled: boolean }>(
    'mutation ToggleTimetableEnabled($enabled: Boolean!) { toggleTimetableEnabled(enabled: $enabled) }',
    { enabled },
    token,
  );
  return data.toggleTimetableEnabled;
};
