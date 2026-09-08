import type { APIRequestContext } from '@playwright/test';
import { post, loginUserViaApi, loginAdminViaApi } from './api';
import { env } from './env';

// 授業チャットのE2Eテストは「テスト用に授業が時間割に登録済みで、その授業チャット
// ルームが存在する」状態を前提とする。テスト環境にそのようなデータが常に用意されて
// いるとは限らないため、他のspec（community-flow.spec.ts等）と同様にAPIを直叩きして
// テストの前提データ自体を都度セットアップする（README.md の「API直叩き」方針に倣う）。
//
// 手順:
//   1. 管理者トークンで現在の学期（year/semester）を取得
//   2. E2E_USER の現在学期の時間割（既存エントリ）を取得し、空いている曜日・時限を探す
//   3. 管理者権限で、その空きコマにユニークな授業名の授業を新規作成（専用チャットルームが自動作成される）
//   4. E2E_USER の時間割に、既存の登録を維持したまま新しい授業を追加する
//   5. テスト終了時、管理者権限で授業を削除する（登録・チャット履歴もサーバー側で連鎖削除される）

const CURRENT_SEMESTER_QUERY = `
  query CurrentSemester {
    currentSemester { year semester }
  }
`;

const MY_TIMETABLE_QUERY = `
  query MyTimetable($year: Int, $semester: String) {
    myTimetable(year: $year, semester: $semester) {
      ID
      course { ID dayOfWeek period }
    }
  }
`;

const ADMIN_CREATE_COURSE_MUTATION = `
  mutation AdminCreateCourse($input: AdminCreateCourseInput!) {
    adminCreateCourse(input: $input) {
      ID
      roomID
      courseName
      dayOfWeek
      period
    }
  }
`;

const SET_MY_TIMETABLE_MUTATION = `
  mutation SetMyTimetable($year: Int!, $semester: String!, $baselineEntryIDs: [ID!]!, $courseIDs: [ID!]!) {
    setMyTimetable(year: $year, semester: $semester, baselineEntryIDs: $baselineEntryIDs, courseIDs: $courseIDs) {
      ID
    }
  }
`;

const ADMIN_DELETE_COURSE_MUTATION = `
  mutation AdminDeleteCourse($id: ID!) {
    adminDeleteCourse(id: $id)
  }
`;

const SEND_MESSAGE_MUTATION = `
  mutation SendMessage($roomID: ID!, $content: String!) {
    sendMessage(roomID: $roomID, content: $content) {
      ID
      content
      createdAt
      user { ID name }
    }
  }
`;

const DAYS_OF_WEEK = ['月', '火', '水', '木', '金', '土'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

export type CourseChatFixture = {
  roomID: string;
  courseID: string;
  courseName: string;
  userToken: string;
  adminToken: string;
  cleanup: () => Promise<void>;
};

export const setupCourseChatFixture = async (
  request: APIRequestContext,
  baseURL: string,
): Promise<CourseChatFixture> => {
  const [{ token: userToken }, { token: adminToken }] = await Promise.all([
    loginUserViaApi(request, baseURL, env.user.email, env.user.password),
    loginAdminViaApi(request, baseURL, env.admin.email, env.admin.password),
  ]);

  const { currentSemester } = await post<{ currentSemester: { year: number; semester: string } }>(
    request,
    baseURL,
    CURRENT_SEMESTER_QUERY,
    {},
    adminToken,
  );

  const { myTimetable } = await post<{
    myTimetable: { ID: string; course: { ID: string; dayOfWeek: string; period: number } }[];
  }>(
    request,
    baseURL,
    MY_TIMETABLE_QUERY,
    { year: currentSemester.year, semester: currentSemester.semester },
    userToken,
  );

  const usedSlots = new Set(myTimetable.map((e) => `${e.course.dayOfWeek}-${e.course.period}`));
  let freeSlot: { dayOfWeek: string; period: number } | null = null;
  outer: for (const dayOfWeek of DAYS_OF_WEEK) {
    for (const period of PERIODS) {
      if (!usedSlots.has(`${dayOfWeek}-${period}`)) {
        freeSlot = { dayOfWeek, period };
        break outer;
      }
    }
  }
  if (!freeSlot) {
    throw new Error('テスト用ユーザーの時間割に空いている曜日・時限が見つかりませんでした。');
  }

  const courseName = `E2E授業チャット ${Date.now()}`;
  const { adminCreateCourse: course } = await post<{
    adminCreateCourse: { ID: string; roomID: string; courseName: string; dayOfWeek: string; period: number };
  }>(
    request,
    baseURL,
    ADMIN_CREATE_COURSE_MUTATION,
    {
      input: {
        dayOfWeek: freeSlot.dayOfWeek,
        period: freeSlot.period,
        teacherName: 'E2Eテスト教員',
        courseName,
        year: currentSemester.year,
        semester: currentSemester.semester,
      },
    },
    adminToken,
  );

  const baselineEntryIDs = myTimetable.map((e) => e.ID);
  const courseIDs = [...myTimetable.map((e) => e.course.ID), course.ID];
  await post(
    request,
    baseURL,
    SET_MY_TIMETABLE_MUTATION,
    {
      year: currentSemester.year,
      semester: currentSemester.semester,
      baselineEntryIDs,
      courseIDs,
    },
    userToken,
  );

  const cleanup = async () => {
    // テストが失敗していても後始末は試みる。既に削除済み等で失敗しても無視する。
    await post(request, baseURL, ADMIN_DELETE_COURSE_MUTATION, { id: course.ID }, adminToken).catch(() => {});
  };

  return {
    roomID: course.roomID,
    courseID: course.ID,
    courseName: course.courseName,
    userToken,
    adminToken,
    cleanup,
  };
};

// UI操作を介さず、APIで直接メッセージを投稿する（履歴表示テストなどで
// 「複数投稿が一貫した順序で表示される」ことだけを検証したい場合に、UI入力の
// 手間・flakinessを避けるために使う）。
export type SentMessage = {
  ID: string;
  content: string;
  createdAt: string;
  user: { ID: string; name: string };
};

export const sendMessageViaApi = async (
  request: APIRequestContext,
  baseURL: string,
  token: string,
  roomID: string,
  content: string,
): Promise<SentMessage> => {
  const data = await post<{ sendMessage: SentMessage }>(
    request,
    baseURL,
    SEND_MESSAGE_MUTATION,
    { roomID, content },
    token,
  );
  return data.sendMessage;
};
