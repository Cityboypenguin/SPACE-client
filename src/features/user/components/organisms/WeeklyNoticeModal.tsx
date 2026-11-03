import { useState } from 'react';
import { Modal } from '../../../../components/molecules/Modal';
import appIcon from '../../../../assets/Senshu-Universe.svg';
import styles from './WeeklyNoticeModal.module.css';

interface Props {
  onClose: (hideForWeek: boolean) => void;
}

// Senshu-Universe を開いたときに出す、使い方のお願い（10/9 決定）。
// 見た目は、小山さん・塩澤さんの画面設計（デザイン案3）の通り。
// 「1週間表示しない」は禁止事項の枠の外、「わかりました」の上に置く。
const RULES = [
  'responの共有',
  '授業資料の共有',
  '他人の個人情報の無断転載',
  'その他不適切な行為',
];

export const WeeklyNoticeModal = ({ onClose }: Props) => {
  const [hideForWeek, setHideForWeek] = useState(false);

  return (
    <Modal overlayClassName={styles.overlay} className={styles.modal} closeOnOverlayClick={false}>
      {/* 縦長・低い画面でも「わかりました」が隠れないよう、スクロールするのは本文だけにする。 */}
      <div className={styles.body}>
        <div className={styles.header}>
          <img src={appIcon} alt="Senshu-Universe" className={styles.logo} />
          <h2 className={styles.title}>Senshu-Universeをご利用のみなさまへ</h2>
          <p className={styles.lead}>
            誰もが快適に使えるSNSを作るため、以下の禁止事項についてご協力ください。
          </p>
        </div>
        <div className={styles.content}>
          <div className={styles.rules}>
            <span className={styles.rulesLabel}>禁止事項</span>
            <ul className={styles.rulesGrid}>
              {RULES.map((rule) => (
                <li key={rule} className={styles.rule}>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className={styles.footer}>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={hideForWeek}
            onChange={(e) => setHideForWeek(e.target.checked)}
          />
          1週間表示させない
        </label>
        <button type="button" className={styles.okButton} onClick={() => onClose(hideForWeek)}>
          わかりました
        </button>
      </div>
    </Modal>
  );
};
