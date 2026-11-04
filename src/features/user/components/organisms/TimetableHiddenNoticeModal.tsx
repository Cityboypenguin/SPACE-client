import { Modal } from '../../../../components/molecules/Modal';
import styles from './NoticeModal.module.css';

interface Props {
  onClose: () => void;
}

// 時間割を非公開にしようとしたときに出す注意（10/9 決定）。
// 非公開にしても、授業内チャットで発言すると履修していることが分かるため。
export const TimetableHiddenNoticeModal = ({ onClose }: Props) => (
  <Modal overlayClassName={styles.overlay} className={styles.modal} onClose={onClose}>
    <div className={styles.body}>
      <h2 className={styles.title}>時間割を非公開にするときの注意</h2>
      <p className={styles.closing}>
        時間割を非公開にしても、授業内チャットで発言したり質問を投稿したりすると、アカウント名が表示されます。
      </p>
    </div>
    <div className={styles.footer}>
      <button type="button" className={styles.okButton} onClick={onClose}>
        わかった
      </button>
    </div>
  </Modal>
);
