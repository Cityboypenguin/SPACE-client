import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import { getUserToken } from './auth';

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
  isProfileVisible: boolean;
  createdAt: string;
};

export type CurrentSemester = {
  year: number;
  semester: string;
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
      isProfileVisible
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

const RegisterTimetableEntryDocument = graphql(`
  mutation RegisterTimetableEntry($courseID: ID!) {
    registerTimetableEntry(courseID: $courseID) {
      ID
      isProfileVisible
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

const RemoveTimetableEntryDocument = graphql(`
  mutation RemoveTimetableEntry($id: ID!) {
    removeTimetableEntry(id: $id)
  }
`);

const SetTimetableProfileVisibilityDocument = graphql(`
  mutation SetTimetableProfileVisibility($id: ID!, $visible: Boolean!) {
    setTimetableProfileVisibility(id: $id, visible: $visible) {
      ID
      isProfileVisible
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

export const getCurrentSemester = async (): Promise<CurrentSemester> => {
  const data = await requestDoc(CurrentSemesterDocument, {}, getUserToken());
  return data.currentSemester;
};

export const getCourseYears = async (): Promise<number[]> => {
  const data = await requestDoc(CourseYearsDocument, {}, getUserToken());
  return data.courseYears;
};

export const registerTimetableEntry = async (courseID: string): Promise<TimetableEntry> => {
  const data = await requestDoc(RegisterTimetableEntryDocument, { courseID }, getUserToken());
  return data.registerTimetableEntry;
};

export const removeTimetableEntry = async (id: string): Promise<boolean> => {
  const data = await requestDoc(RemoveTimetableEntryDocument, { id }, getUserToken());
  return data.removeTimetableEntry;
};

export const setTimetableProfileVisibility = async (id: string, visible: boolean): Promise<TimetableEntry> => {
  const data = await requestDoc(SetTimetableProfileVisibilityDocument, { id, visible }, getUserToken());
  return data.setTimetableProfileVisibility;
};
