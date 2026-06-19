import { useState } from 'react';
import { createInquiry, type InquiryCategory } from '../../api/inquiry';
import styles from '../../pages/InquiryPage.module.css';

const CATEGORIES: { value: InquiryCategory; label: string }[] = [
  { value: 'DM', label: 'DMに関して' },
  { value: 'POST', label: '投稿機能に関して' },
  { value: 'COMMUNITY', label: 'コミュニティに関して' },
  { value: 'PASSWORD', label: 'パスワード変更' },
  { value: 'LOGIN', label: 'ログインに関して' },
  { value: 'OTHER', label: 'その他のお問い合わせ' },
];

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type Props = {
  onSubmitted?: () => void;
  onComplete?: () => void;
};

export const InquiryForm = ({ onSubmitted, onComplete }: Props) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [category, setCategory] = useState<InquiryCategory>('DM');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (value && !EMAIL_REGEX.test(value)) {
      setEmailError('メールアドレスの形式が正しくありません');
    } else {
      setEmailError('');
    }
  };

  const isEmailValid = email !== '' && EMAIL_REGEX.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createInquiry(name, email, category, subject, content);
      setSubmitted(true);
      onSubmitted?.();
    } catch {
      setError('送信に失敗しました。しばらく時間をおいてから再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  if (submitted && onComplete) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <p className={styles.modalText}>
            送信が完了しました。<br />
            お問い合わせいただきありがとうございます。
          </p>
          <button className={styles.modalBackBtn} onClick={onComplete}>
            戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.card}>
        <div className={styles.field}>
          <span className={styles.label}>氏名</span>
          <input
            className={styles.input}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Value"
            required
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>メールアドレス</span>
          <input
            className={styles.input}
            type="text"
            value={email}
            onChange={handleEmailChange}
            placeholder="Value"
            required
          />
          {emailError && <p className={styles.error}>{emailError}</p>}
        </div>

        <div className={styles.categorySection}>
          <p className={styles.categoryTitle}>どのようなお問合せですか？</p>
          <div className={styles.radioGroup}>
            {CATEGORIES.map((cat) => (
              <label key={cat.value} className={styles.radioItem}>
                <input
                  className={styles.radioInput}
                  type="radio"
                  name="category"
                  value={cat.value}
                  checked={category === cat.value}
                  onChange={() => setCategory(cat.value)}
                />
                <span className={styles.radioLabel}>{cat.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>その他のお問い合わせを選択された方は記入をお願いします</span>
          <input
            className={styles.input}
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="件名を入力してください"
            required={category === 'OTHER'}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>お問い合せ内容</span>
          <textarea
            className={styles.textarea}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="詳細を入力してください"
            required
          />
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button className={styles.submitBtn} type="submit" disabled={loading || !isEmailValid}>
        {loading ? '送信中...' : '送信'}
      </button>
    </form>
  );
};
