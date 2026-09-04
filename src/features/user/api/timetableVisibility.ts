import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import { getUserToken } from './auth';

const TimetableProfileVisibilityDocument = graphql(`
  query TimetableProfileVisibility {
    timetableProfileVisibility
  }
`);

const SetTimetableProfileVisibilityDocument = graphql(`
  mutation SetTimetableProfileVisibility($visible: Boolean!) {
    setTimetableProfileVisibility(visible: $visible)
  }
`);

export const getTimetableProfileVisibility = async (): Promise<boolean> => {
  const data = await requestDoc(TimetableProfileVisibilityDocument, {}, getUserToken());
  return data.timetableProfileVisibility;
};

export const setTimetableProfileVisibility = async (visible: boolean): Promise<boolean> => {
  const data = await requestDoc(SetTimetableProfileVisibilityDocument, { visible }, getUserToken());
  return data.setTimetableProfileVisibility;
};
