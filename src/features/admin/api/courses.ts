import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import { ADMIN_TOKEN_KEY } from '../../../lib/authStorage';

const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;

export type CurrentSemester = {
  year: number;
  semester: string;
};

export type CourseImportState = 'IDLE' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';

export type CourseImportStatus = {
  state: CourseImportState;
  year?: number | null;
  imported?: number | null;
  skipped?: number | null;
  errorMessage?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
};

export type Course = {
  ID: string;
  roomID: string;
  dayOfWeek: string;
  period: number;
  teacherName: string;
  courseName: string;
  year: number;
  semester: string;
  createdAt: string;
};

export type CoursePage = {
  items: Course[];
  total: number;
};

const CurrentSemesterDocument = graphql(`
  query AdminCurrentSemester {
    currentSemester {
      year
      semester
    }
  }
`);

const UpdateCurrentSemesterDocument = graphql(`
  mutation AdminUpdateCurrentSemester($year: Int!, $semester: String!) {
    updateCurrentSemester(year: $year, semester: $semester) {
      year
      semester
    }
  }
`);

const AdminCourseImportStatusDocument = graphql(`
  query AdminCourseImportStatus {
    adminCourseImportStatus {
      state
      year
      imported
      skipped
      errorMessage
      startedAt
      finishedAt
    }
  }
`);

const AdminTriggerCourseImportDocument = graphql(`
  mutation AdminTriggerCourseImport($year: Int!) {
    adminTriggerCourseImport(year: $year) {
      state
      year
      imported
      skipped
      errorMessage
      startedAt
      finishedAt
    }
  }
`);

const AdminListCoursesDocument = graphql(`
  query AdminListCourses($year: Int, $semester: String, $dayOfWeek: String, $keyword: String, $limit: Int, $offset: Int) {
    adminListCourses(year: $year, semester: $semester, dayOfWeek: $dayOfWeek, keyword: $keyword, limit: $limit, offset: $offset) {
      items {
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
      total
    }
  }
`);

const AdminListCourseYearsDocument = graphql(`
  query AdminListCourseYears {
    adminListCourseYears
  }
`);

export const listCourseYears = async (): Promise<number[]> => {
  const data = await requestDoc(AdminListCourseYearsDocument, {}, getAdminToken());
  return data.adminListCourseYears;
};

export const listCourses = async (
  filter: { year?: number; semester?: string; dayOfWeek?: string; keyword?: string },
  limit = 20,
  offset = 0,
): Promise<CoursePage> => {
  const data = await requestDoc(
    AdminListCoursesDocument,
    { ...filter, limit, offset },
    getAdminToken(),
  );
  return data.adminListCourses;
};

export const getCurrentSemester = async (): Promise<CurrentSemester> => {
  const data = await requestDoc(CurrentSemesterDocument, {}, getAdminToken());
  return data.currentSemester;
};

export const updateCurrentSemester = async (year: number, semester: string): Promise<CurrentSemester> => {
  const data = await requestDoc(UpdateCurrentSemesterDocument, { year, semester }, getAdminToken());
  return data.updateCurrentSemester;
};

export const getCourseImportStatus = async (): Promise<CourseImportStatus> => {
  const data = await requestDoc(AdminCourseImportStatusDocument, {}, getAdminToken());
  return data.adminCourseImportStatus;
};

export const triggerCourseImport = async (year: number): Promise<CourseImportStatus> => {
  const data = await requestDoc(AdminTriggerCourseImportDocument, { year }, getAdminToken());
  return data.adminTriggerCourseImport;
};
