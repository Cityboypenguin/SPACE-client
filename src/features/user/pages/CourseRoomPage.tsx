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

  const isWritable = useMemo(() => {
    if (!course || !currentSemester) return true;
    return course.year === currentSemester.year && course.semester === currentSemester.semester;
  }, [course, currentSemester]);

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

      {!isWritable && (
        <div style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.8rem', padding: '0.5rem 1.5rem', flexShrink: 0 }}>
          この学期は終了したため閲覧のみです。
        </div>
      )}

      {activeTab === 'chat' && <CourseChatTab roomId={roomId} roomWritable={isWritable} />}
      {activeTab === 'question' && <QuestionList roomId={roomId} roomWritable={isWritable} />}
      {activeTab === 'poll' && <PollList roomId={roomId} roomWritable={isWritable} />}
    </div>
  );
};
