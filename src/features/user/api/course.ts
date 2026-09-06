import { request, requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import { getUserToken } from './auth';
import type { TimetableEntryColor } from '../lib/timetableColors';

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

export type TimetableEntry = {
  ID: string;
  course: Course;
  color: TimetableEntryColor;
  createdAt: string;
};

export type CurrentSemester = {
  year: number;
  semester: string;
};

const PRIVATE_TIMETABLE_ERROR_PATTERNS = [
  'timetable is private',
  'timetable not public',
  'timetable profile visibility',
  'not visible',
  'not published',
  '非公開',
  '公開されていません',
  '公開していません',
  'forbidden',
  '403',
];

export const isPrivateTimetableError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const normalized = message.toLowerCase();
  return PRIVATE_TIMETABLE_ERROR_PATTERNS.some((pattern) => normalized.includes(pattern.toLowerCase()));
};

const SearchCoursesDocument = graphql(`
  query SearchCourses($dayOfWeek: String!, $period: Int!, $keyword: String, $limit: Int, $offset: Int) {
    searchCourses(dayOfWeek: $dayOfWeek, period: $period, keyword: $keyword, limit: $limit, offset: $offset) {
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

const MyTimetableDocument = graphql(`
  query MyTimetable($year: Int, $semester: String) {
    myTimetable(year: $year, semester: $semester) {
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

const CurrentSemesterDocument = graphql(`
  query CurrentSemester {
    currentSemester {
      year
      semester
    }
  }
`);

const CourseYearsDocument = graphql(`
  query CourseYears {
    courseYears
  }
`);

const SetTimetableEntryColorDocument = graphql(`
  mutation SetTimetableEntryColor($id: ID!, $color: TimetableEntryColor!) {
    setTimetableEntryColor(id: $id, color: $color) {
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

const SetMyTimetableDocument = graphql(`
  mutation SetMyTimetable($year: Int!, $semester: String!, $baselineEntryIDs: [ID!]!, $courseIDs: [ID!]!) {
    setMyTimetable(year: $year, semester: $semester, baselineEntryIDs: $baselineEntryIDs, courseIDs: $courseIDs) {
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

export type SearchCoursesResult = { items: Course[]; total: number };

export const searchCourses = async (
  dayOfWeek: string,
  period: number,
  keyword?: string,
  limit = 50,
  offset = 0,
): Promise<SearchCoursesResult> => {
  const data = await requestDoc(
    SearchCoursesDocument,
    { dayOfWeek, period, keyword, limit, offset },
    getUserToken(),
  );
  return data.searchCourses;
};

export const getMyTimetable = async (year?: number, semester?: string): Promise<TimetableEntry[]> => {
  const data = await requestDoc(MyTimetableDocument, { year, semester }, getUserToken());
  return data.myTimetable;
};

const UserTimetableQuery = `
  query UserTimetable($userID: ID!, $year: Int, $semester: String) {
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
`;

export const getUserTimetable = async (
  userID: string,
  year?: number,
  semester?: string,
): Promise<TimetableEntry[]> => {
  let data: { userTimetable: TimetableEntry[] | null };
  try {
    data = await request<{ userTimetable: TimetableEntry[] | null }>(
      UserTimetableQuery,
      { userID, year, semester },
      getUserToken(),
    );
  } catch (error) {
    if (isPrivateTimetableError(error)) {
      throw new Error('timetable is private');
    }
    throw error;
  }
  if (data.userTimetable == null) {
    throw new Error('timetable is private');
  }
  return data.userTimetable;
};

export type UserTimetableProfile = {
  visible: boolean;
  entries: TimetableEntry[];
};

const UserTimetableProfileQuery = `
  query UserTimetableProfile($userID: ID!, $year: Int, $semester: String) {
    userTimetableProfile(userID: $userID, year: $year, semester: $semester) {
      visible
      entries {
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
  }
`;

// 対象ユーザーの時間割公開設定を含めて取得する。visible が false の場合は
// entries が空でも「非公開」であって「未登録」ではないことが判別できる。
export const getUserTimetableProfile = async (
  userID: string,
  year?: number,
  semester?: string,
): Promise<UserTimetableProfile> => {
  const data = await request<{ userTimetableProfile: UserTimetableProfile }>(
    UserTimetableProfileQuery,
    { userID, year, semester },
    getUserToken(),
  );
  return data.userTimetableProfile;
};

export const getCurrentSemester = async (): Promise<CurrentSemester> => {
  const data = await requestDoc(CurrentSemesterDocument, {}, getUserToken());
  return data.currentSemester;
};

export const getCourseYears = async (): Promise<number[]> => {
  const data = await requestDoc(CourseYearsDocument, {}, getUserToken());
  return data.courseYears;
};

export const setTimetableEntryColor = async (id: string, color: TimetableEntryColor): Promise<TimetableEntry> => {
  const data = await requestDoc(SetTimetableEntryColorDocument, { id, color }, getUserToken());
  return data.setTimetableEntryColor;
};

export const setMyTimetable = async (
  year: number,
  semester: string,
  baselineEntryIDs: string[],
  courseIDs: string[],
): Promise<TimetableEntry[]> => {
  const data = await requestDoc(
    SetMyTimetableDocument,
    { year, semester, baselineEntryIDs, courseIDs },
    getUserToken(),
  );
  return data.setMyTimetable;
};
