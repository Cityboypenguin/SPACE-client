import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import { ADMIN_TOKEN_KEY } from '../../../lib/authStorage';
import type { Course } from './courses';
import type { TimetableEntryColor } from '../../user/lib/timetableColors';

const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;

export type TimetableEntry = {
  ID: string;
  color: TimetableEntryColor;
  createdAt: string;
  course: Course;
};

const AdminUserTimetableDocument = graphql(`
  query AdminUserTimetable($userID: ID!, $year: Int, $semester: String) {
    userTimetable(userID: $userID, year: $year, semester: $semester) {
      ID
      color
      createdAt
      course {
        ID
        roomID
        dayOfWeek
        period
        teacherName
        courseName
        year
        semester
        createdAt
      }
    }
  }
`);

export const getUserTimetable = async (
  userID: string,
  year?: number,
  semester?: string,
): Promise<TimetableEntry[]> => {
  const data = await requestDoc(AdminUserTimetableDocument, { userID, year, semester }, getAdminToken());
  return data.userTimetable;
};

const AdminRegisterTimetableEntryDocument = graphql(`
  mutation AdminRegisterTimetableEntry($userID: ID!, $courseID: ID!) {
    adminRegisterTimetableEntry(userID: $userID, courseID: $courseID) {
      ID
      color
      createdAt
      course {
        ID
        roomID
        dayOfWeek
        period
        teacherName
        courseName
        year
        semester
        createdAt
      }
    }
  }
`);

export const adminRegisterTimetableEntry = async (userID: string, courseID: string): Promise<TimetableEntry> => {
  const data = await requestDoc(AdminRegisterTimetableEntryDocument, { userID, courseID }, getAdminToken());
  return data.adminRegisterTimetableEntry;
};

const AdminRemoveTimetableEntryDocument = graphql(`
  mutation AdminRemoveTimetableEntry($id: ID!, $userID: ID!) {
    adminRemoveTimetableEntry(id: $id, userID: $userID)
  }
`);

export const adminRemoveTimetableEntry = async (id: string, userID: string): Promise<boolean> => {
  const data = await requestDoc(AdminRemoveTimetableEntryDocument, { id, userID }, getAdminToken());
  return data.adminRemoveTimetableEntry;
};
