import { useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import useSWR from 'swr';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { CourseChatTab } from '../components/organisms/CourseChatTab';
import { QuestionList } from '../components/organisms/QuestionList';
import { PollList } from '../components/organisms/PollList';
import { Tabs } from '../../../components/molecules/Tabs';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import { getRoom, type Room } from '../api/message';
import { getMyTimetable, getCurrentSemester, type Course } from '../api/course';
import { stableCacheOptions, staticCacheOptions, semesterCacheOptions } from '../cache/swrOptions';
import styles from '../components/ChatRoom.module.css';

type TabKey = 'chat' | 'question' | 'poll';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'chat', label: 'チャット' },
  { key: 'question', label: '質問箱' },
  { key: 'poll', label: '投票' },
];

export const CourseRoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { course?: Course } | null;
  const [activeTab, setActiveTab] = useState<TabKey>('chat');

  const { data: room } = useSWR<Room | null>(
    roomId ? ['course-room', roomId] : null,
    async ([, id]: [string, string]) => (await getRoom(id)).room ?? null,
    stableCacheOptions,
  );

  const { data: timetable } = useSWR('my-timetable', () => getMyTimetable(), staticCacheOptions);
  const { data: currentSemester } = useSWR('current-semester', () => getCurrentSemester(), semesterCacheOptions);

  const course = useMemo((): Course | null => {
    const fromTimetable = timetable?.find((t) => t.course.roomID === roomId)?.course;
    return fromTimetable ?? locationState?.course ?? null;
  }, [timetable, roomId, locationState]);

  // 過去の学期（アーカイブ）かどうか。通年の授業はその年度の前期・後期どちらでも
  // 進行中として扱う（年度が変わった時だけアーカイブになる）。まだ course/
  // currentSemester が読み込めていない間はちらつき防止のため「アーカイブではない」
  // 扱いにしておく。
  const isArchived = useMemo(() => {
    if (!course || !currentSemester) return false;
    if (course.year !== currentSemester.year) return true;
    return course.semester !== currentSemester.semester && course.semester !== '通年';
  }, [course, currentSemester]);

  // 現在の学期の自分の時間割にこの授業が登録されているか。timetable がまだ読み込め
  // ていない間はちらつき防止のため「登録済み」扱いにしておく。
  const isRegistered = useMemo(() => {
    if (!timetable) return true;
    return timetable.some((t) => t.course.roomID === roomId);
  }, [timetable, roomId]);

  const isWritable = !isArchived && isRegistered;

  if (!roomId) return null;

  return (
    <div className={styles.container}>
      <UserSidebar />

      <div className={styles.roomHeader}>
        <button onClick={() => navigate('/timetable')}><ChevronLeft /></button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <strong className={styles.roomTitle}>{course?.courseName ?? room?.name ?? '...'}</strong>
          {course && (
            <div style={{ fontSize: '0.75rem', color: '#888' }}>
              {course.teacherName} ・ {course.dayOfWeek}曜{course.period}限
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '0.5rem 1.5rem 0', borderBottom: '1px solid #ccc', flexShrink: 0 }}>
        <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {isArchived && (
        <div style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.8rem', padding: '0.5rem 1.5rem', flexShrink: 0 }}>
          この学期は終了したため閲覧のみです。
        </div>
      )}
      {!isArchived && !isRegistered && (
        <div style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.8rem', padding: '0.5rem 1.5rem', flexShrink: 0 }}>
          この授業を時間割に登録していないため、書き込みできません。
        </div>
      )}

      {activeTab === 'chat' && <CourseChatTab roomId={roomId} roomWritable={isWritable} />}
      {activeTab === 'question' && <QuestionList roomId={roomId} roomWritable={isWritable} />}
      {activeTab === 'poll' && <PollList roomId={roomId} roomWritable={isWritable} />}
    </div>
  );
};
