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
  processedCount?: number | null;
  totalCount?: number | null;
  progressPercent?: number | null;
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
  registeredCount: number;
};

export type AdminCreateCourseInput = {
  dayOfWeek: string;
  period: number;
  teacherName: string;
  courseName: string;
  year: number;
  semester: string;
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
      processedCount
      totalCount
      progressPercent
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
      processedCount
      totalCount
      progressPercent
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
        registeredCount
      }
      total
    }
  }
`);

const AdminCreateCourseDocument = graphql(`
  mutation AdminCreateCourse($input: AdminCreateCourseInput!) {
    adminCreateCourse(input: $input) {
      ID
      roomID
      dayOfWeek
      period
      teacherName
      courseName
      year
      semester
      createdAt
      registeredCount
    }
  }
`);

export const createCourse = async (input: AdminCreateCourseInput): Promise<Course> => {
  const data = await requestDoc(AdminCreateCourseDocument, { input }, getAdminToken());
  return data.adminCreateCourse;
};

const AdminDeleteCourseDocument = graphql(`
  mutation AdminDeleteCourse($id: ID!) {
    adminDeleteCourse(id: $id)
  }
`);

export const deleteCourse = async (id: string): Promise<boolean> => {
  const data = await requestDoc(AdminDeleteCourseDocument, { id }, getAdminToken());
  return data.adminDeleteCourse;
};

const AdminListCourseYearsDocument = graphql(`
  query AdminListCourseYears {
    adminListCourseYears
  }
`);

export const listCourseYears = async (): Promise<number[]> => {
  const data = await requestDoc(AdminListCourseYearsDocument, {}, getAdminToken());
  return data.adminListCourseYears;
};

const AdminGetCourseDocument = graphql(`
  query AdminGetCourse($id: ID!) {
    adminGetCourse(id: $id) {
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
`);

export const getCourse = async (id: string): Promise<Course | null> => {
  const data = await requestDoc(AdminGetCourseDocument, { id }, getAdminToken());
  return data.adminGetCourse ?? null;
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

export type ChatUser = {
  ID: string;
  name: string;
  accountID: string;
  avatarUrl?: string | null;
};

export type Answer = {
  ID: string;
  questionID: string;
  user: ChatUser;
  body: string;
  createdAt: string;
};

export type Question = {
  ID: string;
  roomID: string;
  user: ChatUser;
  body: string;
  isAnswered: boolean;
  answers: Answer[];
  createdAt: string;
};

export type PollOption = {
  ID: string;
  label: string;
  voteCount: number;
};

export type Poll = {
  ID: string;
  roomID: string;
  user: ChatUser;
  question: string;
  allowMultipleChoice: boolean;
  options: PollOption[];
  createdAt: string;
};

const AdminGetCourseQuestionsDocument = graphql(`
  query AdminGetCourseQuestions($roomID: ID!, $limit: Int) {
    questions(roomID: $roomID, limit: $limit) {
      items {
        ID
        roomID
        user {
          ID
          name
          accountID
          avatarUrl
        }
        body
        isAnswered
        answers(limit: 200) {
          items {
            ID
            questionID
            user {
              ID
              name
              accountID
              avatarUrl
            }
            body
            createdAt
          }
        }
        createdAt
      }
      total
    }
  }
`);

export const getCourseQuestions = async (roomID: string, limit = 200): Promise<{ items: Question[]; total: number }> => {
  const data = await requestDoc(AdminGetCourseQuestionsDocument, { roomID, limit }, getAdminToken());
  return {
    items: data.questions.items.map((q) => ({ ...q, answers: q.answers.items })),
    total: data.questions.total,
  } as { items: Question[]; total: number };
};

const AdminDeleteQuestionDocument = graphql(`
  mutation AdminDeleteQuestion($id: ID!) {
    adminDeleteQuestion(id: $id)
  }
`);

export const adminDeleteQuestion = async (id: string): Promise<boolean> => {
  const data = await requestDoc(AdminDeleteQuestionDocument, { id }, getAdminToken());
  return data.adminDeleteQuestion;
};

const AdminGetCoursePollsDocument = graphql(`
  query AdminGetCoursePolls($roomID: ID!, $limit: Int) {
    polls(roomID: $roomID, limit: $limit) {
      items {
        ID
        roomID
        user {
          ID
          name
          accountID
          avatarUrl
        }
        question
        allowMultipleChoice
        options {
          ID
          label
          voteCount
        }
        createdAt
      }
      total
    }
  }
`);

export const getCoursePolls = async (roomID: string, limit = 200): Promise<{ items: Poll[]; total: number }> => {
  const data = await requestDoc(AdminGetCoursePollsDocument, { roomID, limit }, getAdminToken());
  return data.polls as { items: Poll[]; total: number };
};

const AdminDeletePollDocument = graphql(`
  mutation AdminDeletePoll($pollID: ID!) {
    deletePoll(pollID: $pollID)
  }
`);

export const adminDeletePoll = async (pollID: string): Promise<boolean> => {
  const data = await requestDoc(AdminDeletePollDocument, { pollID }, getAdminToken());
  return data.deletePoll;
};
