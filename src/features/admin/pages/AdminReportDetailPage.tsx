import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { ReportedContentView } from '../components/molecules/ReportedContentView';
import { adminUpdateReportStatus, getReport, type ReportDetail } from '../api/report';
import { reasonJa, statusJa, targetTypeJa } from '../lib/reportLabels';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import styles from '../styles/AdminShared.module.css';

const linkStyle = { color: '#2563eb', textDecoration: 'underline' };

// 通報対象の管理画面。メッセージ・質問・回答・投票には専用の画面が無く、通報時点の内容をこのページで見る。
const getTargetUrl = (report: ReportDetail) => {
  if (report.targetType === 'POST') return `/admin/posts/${report.targetID}`;
  if (report.targetType === 'USER') return `/admin/users/${report.targetID}`;
  if (report.targetType === 'COMMUNITY') return `/admin/communities/${report.targetID}`;
  return null;
};

export const AdminReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getReport(id)
      .then((data) => {
        setReport(data);
        setNotFound(data === null);
      })
      .catch((err) => {
        console.error(err);
        setError('通報の取得に失敗しました');
      });
  }, [id]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!id || !window.confirm(`ステータスを「${statusJa[newStatus]}」に変更しますか？`)) return;
    try {
      setError('');
      await adminUpdateReportStatus(id, newStatus);
      setReport((prev) => prev ? { ...prev, status: newStatus } : prev);
      // サイドバーのバッジカウントを再計算させるイベントを発行
      window.dispatchEvent(new Event('report-status-updated'));
    } catch (err) {
      console.error(err);
      setError('ステータスの更新に失敗しました');
    }
  };

  const targetUrl = report && getTargetUrl(report);
  // 退会済みの通報者は利用者ページが無いのでリンクにしない
  const reporterHasPage = report && report.reporter.accountID !== 'deleted-account';

  return (
    <div>
      <AdminHeader />
      <main className={styles.pageCenteredNarrow}>
        <div className={styles.pageIntro}>
          <button onClick={() => navigate('/admin/reports')}>
            <ChevronLeft /> 通報一覧に戻る
          </button>
          <h1 className={styles.titleLarge}>通報詳細</h1>
        </div>

        {error && <p className={styles.errorPadded}>{error}</p>}
        {notFound && <p className={styles.emptyState}>通報が見つかりませんでした</p>}

        {report && (
          <div className={styles.detailPanel}>
            <div className={styles.statusHeader}>
              <span className={styles.statusBadgeLarge} data-status={report.status}>
                {statusJa[report.status] ?? report.status}
              </span>
              <span className={styles.countText}>
                受付：{new Date(report.createdAt).toLocaleString('ja-JP')}
              </span>
            </div>

            <table className={styles.detailTable}>
              <tbody>
                <tr className={styles.tableRow}>
                  <th className={styles.detailTableHeader}>対象タイプ</th>
                  <td className={styles.tableCellBody}>
                    {targetTypeJa[report.targetType] ?? report.targetType}
                    {targetUrl && (
                      <>
                        {' '}
                        <Link to={targetUrl} style={linkStyle}>対象を開く</Link>
                      </>
                    )}
                  </td>
                </tr>
                <tr className={styles.tableRow}>
                  <th className={styles.detailTableHeader}>通報者</th>
                  <td className={styles.tableCellBody}>
                    {reporterHasPage ? (
                      <>
                        <Link to={`/admin/users/${report.reporter.ID}`} style={linkStyle}>{report.reporter.name}</Link>
                        {` (@${report.reporter.accountID})`}
                      </>
                    ) : (
                      report.reporter.name
                    )}
                  </td>
                </tr>
                <tr className={styles.tableRow}>
                  <th className={styles.detailTableHeader}>通報理由</th>
                  <td className={styles.tableCellBody}>{reasonJa[report.reason] ?? report.reason}</td>
                </tr>
              </tbody>
            </table>

            <div className={styles.detailSection}>
              <p className={styles.detailSectionLabel}>詳細説明</p>
              <div className={styles.preWrapContent}>
                {report.customReason || <span className={styles.cellMuted}>(入力なし)</span>}
              </div>
            </div>

            {report.reportedContent && (
              <div className={styles.detailSection}>
                <p className={styles.detailSectionLabel}>通報時点の内容</p>
                <ReportedContentView content={report.reportedContent} isThread={report.targetType === 'THREAD'} />
              </div>
            )}

            {report.content && (
              <div className={styles.detailSection}>
                <p className={styles.detailSectionLabel}>通報時点の投稿</p>
                <div className={styles.preWrapContent}>{report.content}</div>
              </div>
            )}

            {report.status !== 'RESOLVED' && (
              <div className={styles.buttonRow}>
                {report.status === 'PENDING' && (
                  <button onClick={() => handleUpdateStatus('REVIEWING')} className={styles.primaryButton}>
                    対応中にする
                  </button>
                )}
                <button
                  onClick={() => handleUpdateStatus('RESOLVED')}
                  className={`${styles.primaryButton} ${styles.successButton}`}
                >
                  対応済にする
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
