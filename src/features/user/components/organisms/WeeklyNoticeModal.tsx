import { useState } from 'react';
import { Modal } from '../../../../components/molecules/Modal';
import styles from './NoticeModal.module.css';

interface Props {
  onClose: (hideForWeek: boolean) => void;
}

// Senshu-Universe を開いたときに出す、使い方のお願い（10/9 決定）。
// 禁止事項より「お願い」のトーンで書く（第33回の議論）。
export const WeeklyNoticeModal = ({ onClose }: Props) => {
  const [hideForWeek, setHideForWeek] = useState(false);

  return (
    <Modal overlayClassName={styles.overlay} className={styles.modal} closeOnOverlayClick={false}>
      <div className={styles.body}>
        <h2 className={styles.title}>Senshu-Universeをご利用のみなさまへ</h2>
        <p className={styles.lead}>
          みなさんが安心して使えるように、次のことはしないようお願いします。
        </p>
        <ul className={styles.list}>
          <li>レスポンの共有</li>
          <li>授業資料の共有</li>
          <li>他人の個人情報の無断転載</li>
          <li>その他マナー違反や不適切な行為</li>
        </ul>
        <p className={styles.closing}>ご協力をお願いします。</p>
      </div>
      <div className={styles.footer}>
        <label className={styles.checkLabel}>
          <input
            type="checkbox"
            checked={hideForWeek}
            onChange={(e) => setHideForWeek(e.target.checked)}
          />
          1週間表示しない
        </label>
        <button type="button" className={styles.okButton} onClick={() => onClose(hideForWeek)}>
          わかった
        </button>
      </div>
    </Modal>
  );
};
