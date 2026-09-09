import useSWR from 'swr';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { getAnnouncement } from '../api/announcement';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import { staticCacheOptions } from '../cache/swrOptions';
import styles from './AnnouncementDetailPage.module.css';

export const AnnouncementDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: announcement, isLoading, error } = useSWR(
    id ? ['announcement', id] : null,
    ([, announcementId]: [string, string]) => getAnnouncement(announcementId),
    staticCacheOptions,
  );

  return (
    <div>
      <UserSidebar />
      <main className={styles.main}>
        <button
          onClick={() => navigate(-1)}
        >
          <ChevronLeft /> 戻る
        </button>

        {error && <p className={styles.errorText}>お知らせの読み込みに失敗しました</p>}

        {isLoading ? (
          <p className={styles.loadingText}>読み込み中...</p>
        ) : !announcement ? (
          <p className={styles.loadingText}>お知らせが見つかりません</p>
        ) : (
          <div className={styles.card}>
            <div className={styles.badgeRow}>
              <span className={styles.badge}>
                運営からのお知らせ
              </span>
            </div>
            <h1 className={styles.title}>
              {announcement.title}
            </h1>
            <p className={styles.date}>
              {new Date(announcement.createdAt).toLocaleString('ja-JP')}
            </p>
            <div
              className={`announcement-body ${styles.body}`}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a({ href, children }) {
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.mdLink}
                      >
                        {children}
                      </a>
                    );
                  },
                }}
              >
                {announcement.body}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
