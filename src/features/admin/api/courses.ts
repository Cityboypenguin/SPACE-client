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
  dryRun: boolean;
  syncRunID?: string | null;
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
  discontinued: boolean;
};

// registeredCount（その授業を時間割に登録している人数）はサーバー側で都度集計されるため、
// 実際に表示する一覧・作成のレスポンスでのみ選択している。個別取得や時間割経由の参照は
// 集計を必要としないので、選択セットに合わせて基本形の Course と型を分けておく。
export type CourseWithRegisteredCount = Course & {
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
  items: CourseWithRegisteredCount[];
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
      dryRun
      syncRunID
    }
  }
`);

const AdminTriggerCourseImportDocument = graphql(`
  mutation AdminTriggerCourseImport($year: Int!, $dryRun: Boolean) {
    adminTriggerCourseImport(year: $year, dryRun: $dryRun) {
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
      dryRun
      syncRunID
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
        discontinued
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
      discontinued
      registeredCount
    }
  }
`);

export const createCourse = async (input: AdminCreateCourseInput): Promise<CourseWithRegisteredCount> => {
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
      discontinued
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

export const triggerCourseImport = async (year: number, dryRun: boolean): Promise<CourseImportStatus> => {
  const data = await requestDoc(AdminTriggerCourseImportDocument, { year, dryRun }, getAdminToken());
  return data.adminTriggerCourseImport;
};

// ■ シラバス同期の結果
//
// 取り込みは DB の授業をシラバスの今の内容に合わせる（作成・更新・廃止）。実行ごとの
// 集計と授業1件ごとの変更、自動で判断しなかった変化（確認待ち）をここで引く。

export type CourseSyncChangeKind = 'CREATED' | 'UPDATED' | 'DISCONTINUED' | 'RESTORED' | 'REVIEW';
export type CourseSyncReviewKind = 'CODE_REUSED' | 'CODE_REISSUED' | 'SLOT_AMBIGUOUS';
export type CourseSyncReviewStatus = 'PENDING' | 'SAME' | 'DIFFERENT' | 'IGNORED' | 'APPLIED';
export type CourseSyncReviewDecision = 'SAME' | 'DIFFERENT' | 'IGNORED';

export type CourseSnapshot = {
  courseID?: string | null;
  sourceRef: string;
  semester: string;
  dayOfWeek: string;
  period: number;
  courseName: string;
  teacherName: string;
};

export type CourseSyncRun = {
  ID: string;
  year: number;
  dryRun: boolean;
  siteTotal: number;
  listedRows: number;
  unidentifiedRows: number;
  createdCount: number;
  updatedCount: number;
  discontinuedCount: number;
  restoredCount: number;
  reviewCount: number;
  unchangedCount: number;
  unregisteredCount: number;
  discontinueSkippedReason?: string | null;
  startedAt: string;
  finishedAt: string;
};

export type CourseSyncChange = {
  ID: string;
  kind: CourseSyncChangeKind;
  courseID?: string | null;
  reviewID?: string | null;
  courseName: string;
  teacherName: string;
  detail: string;
  before?: CourseSnapshot | null;
  after?: CourseSnapshot | null;
  registeredCount: number;
  // コマが変わり、移った先のコマに別の授業があったため時間割から外した（ドライランでは外す予定の）人数。
  unregisteredCount: number;
};

export type CourseSyncReview = {
  ID: string;
  year: number;
  kind: CourseSyncReviewKind;
  status: CourseSyncReviewStatus;
  message: string;
  existing: CourseSnapshot[];
  proposed: CourseSnapshot[];
  createdAt: string;
  resolvedAt?: string | null;
};

const AdminCourseSyncRunsDocument = graphql(`
  query AdminCourseSyncRuns($year: Int, $limit: Int, $offset: Int) {
    adminCourseSyncRuns(year: $year, limit: $limit, offset: $offset) {
      items {
        ID
        year
        dryRun
        siteTotal
        listedRows
        unidentifiedRows
        createdCount
        updatedCount
        discontinuedCount
        restoredCount
        reviewCount
        unchangedCount
        unregisteredCount
        discontinueSkippedReason
        startedAt
        finishedAt
      }
      total
    }
  }
`);

export const listCourseSyncRuns = async (
  limit = 20,
  offset = 0,
): Promise<{ items: CourseSyncRun[]; total: number }> => {
  const data = await requestDoc(AdminCourseSyncRunsDocument, { limit, offset }, getAdminToken());
  return data.adminCourseSyncRuns;
};

const AdminCourseSyncChangesDocument = graphql(`
  query AdminCourseSyncChanges($runID: ID!, $kind: CourseSyncChangeKind, $limit: Int, $offset: Int) {
    adminCourseSyncChanges(runID: $runID, kind: $kind, limit: $limit, offset: $offset) {
      items {
        ID
        kind
        courseID
        reviewID
        courseName
        teacherName
        detail
        before {
          courseID
          sourceRef
          semester
          dayOfWeek
          period
          courseName
          teacherName
        }
        after {
          courseID
          sourceRef
          semester
          dayOfWeek
          period
          courseName
          teacherName
        }
        registeredCount
        unregisteredCount
      }
      total
    }
  }
`);

export const listCourseSyncChanges = async (
  runID: string,
  kind: CourseSyncChangeKind | undefined,
  limit = 50,
  offset = 0,
): Promise<{ items: CourseSyncChange[]; total: number }> => {
  const data = await requestDoc(AdminCourseSyncChangesDocument, { runID, kind, limit, offset }, getAdminToken());
  return data.adminCourseSyncChanges;
};

const AdminCourseSyncReviewsDocument = graphql(`
  query AdminCourseSyncReviews($status: CourseSyncReviewStatus, $limit: Int, $offset: Int) {
    adminCourseSyncReviews(status: $status, limit: $limit, offset: $offset) {
      items {
        ID
        year
        kind
        status
        message
        existing {
          courseID
          sourceRef
          semester
          dayOfWeek
          period
          courseName
          teacherName
        }
        proposed {
          courseID
          sourceRef
          semester
          dayOfWeek
          period
          courseName
          teacherName
        }
        createdAt
        resolvedAt
      }
      total
    }
  }
`);

export const listCourseSyncReviews = async (
  status: CourseSyncReviewStatus | undefined,
  limit = 20,
  offset = 0,
): Promise<{ items: CourseSyncReview[]; total: number }> => {
  const data = await requestDoc(AdminCourseSyncReviewsDocument, { status, limit, offset }, getAdminToken());
  return data.adminCourseSyncReviews;
};

const AdminResolveCourseSyncReviewDocument = graphql(`
  mutation AdminResolveCourseSyncReview($id: ID!, $decision: CourseSyncReviewDecision!) {
    adminResolveCourseSyncReview(id: $id, decision: $decision) {
      ID
      status
      resolvedAt
    }
  }
`);

export const resolveCourseSyncReview = async (id: string, decision: CourseSyncReviewDecision) => {
  const data = await requestDoc(AdminResolveCourseSyncReviewDocument, { id, decision }, getAdminToken());
  return data.adminResolveCourseSyncReview;
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
  // 一覧では件数しか使わない。回答そのものが要る画面ができたら、その画面だけが
  // answers を選ぶこと（一覧のクエリへ戻さない）。
  answerCount: number;
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
  query AdminGetCourseQuestions($roomID: ID!, $limit: Int, $offset: Int) {
    questions(roomID: $roomID, limit: $limit, offset: $offset) {
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
        # 一覧に出しているのは回答の件数だけ。以前は answers(limit: 200) で
        # 回答の本文と投稿者を全部取り、その length を件数にしていた。
        # 質問200件 × 回答200件で、最大4万行が1回の応答に乗っていた。
        answerCount
        createdAt
      }
      total
    }
  }
`);

// adminCoursePageSize は管理画面が一度に読む質問・投票の件数。
//
// 以前は 200 件を一度に取り、ページ送りを持っていなかった。授業が育つほど
// 1回の応答が重くなり、200 件を超えたぶんは管理画面から辿れなかった。
export const adminCoursePageSize = 50;

export const getCourseQuestions = async (
  roomID: string,
  limit = adminCoursePageSize,
  offset = 0,
): Promise<{ items: Question[]; total: number }> => {
  const data = await requestDoc(AdminGetCourseQuestionsDocument, { roomID, limit, offset }, getAdminToken());
  return {
    items: data.questions.items,
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
  query AdminGetCoursePolls($roomID: ID!, $limit: Int, $offset: Int) {
    polls(roomID: $roomID, limit: $limit, offset: $offset) {
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

export const getCoursePolls = async (
  roomID: string,
  limit = adminCoursePageSize,
  offset = 0,
): Promise<{ items: Poll[]; total: number }> => {
  const data = await requestDoc(AdminGetCoursePollsDocument, { roomID, limit, offset }, getAdminToken());
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
