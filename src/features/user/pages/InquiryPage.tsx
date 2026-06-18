import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import { InquiryForm } from '../components/organisms/InquiryForm';
import styles from './InquiryPage.module.css';

export const InquiryPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ChevronLeft />
        </button>
        <h1 className={styles.title}>お問い合わせ</h1>
      </div>

      <InquiryForm onSubmitted={() => setSubmitted(true)} />

      {submitted && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <p className={styles.modalText}>
              送信が完了しました。<br />
              お問い合わせいただきありがとうございます。
            </p>
            <button className={styles.modalBackBtn} onClick={() => navigate(-1)}>
              戻る
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
