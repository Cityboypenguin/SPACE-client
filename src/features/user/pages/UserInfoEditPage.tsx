import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { useAuth } from '../context/AuthContext';
import { getProfileByUserID, updateMyProfile } from '../api/profile';
import { toUserMessage } from '../../../lib/errorMessages';
import { useToast } from '../../../context/ToastContext';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import styles from './UserInfoEditPage.module.css';

const accountIDRe = /^[a-zA-Z0-9_-]+$/;
const MAX_NAME_LENGTH = 50;
const MAX_ACCOUNT_ID_LENGTH = 25;

const validateAccountID = (value: string): string => {
  if (value && !accountIDRe.test(value)) return 'ユーザーIDは半角英数字・_・-のみ使用できます';
  if ([...value].length > MAX_ACCOUNT_ID_LENGTH) return `ユーザーIDは${MAX_ACCOUNT_ID_LENGTH}文字以内で入力してください`;
  return '';
};

const validateName = (value: string): string => {
  if ([...value].length > MAX_NAME_LENGTH) return `名前は${MAX_NAME_LENGTH}文字以内で入力してください`;
  return '';
};

export const UserInfoEditPage = () => {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { addToast } = useToast();

  const { data: profileData } = useSWR(
    userId ? ['profile', userId] : null,
    ([, id]: [string, string]) => getProfileByUserID(id).then((d) => d.getProfileByUserID),
  );

  const [newAccountID, setNewAccountID] = useState('');
  const [accountIDError, setAccountIDError] = useState('');
  const [newName, setNewName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const currentAccountID = profileData?.user.accountID ?? '読み込み中...';
  const currentName = profileData?.user.name ?? '読み込み中...';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newAccountID.trim()) {
      const accountIDErr = validateAccountID(newAccountID.trim());
      if (accountIDErr) {
        setError(accountIDErr);
        return;
      }
    }

    if (newName.trim()) {
      const nameErr = validateName(newName.trim());
      if (nameErr) {
        setError(nameErr);
        return;
      }
    }

    const input: { accountID?: string; name?: string } = {};
    if (newAccountID.trim()) input.accountID = newAccountID.trim();
    if (newName.trim()) input.name = newName.trim();

    if (Object.keys(input).length === 0) return;

    setSubmitting(true);
    try {
      await updateMyProfile(input);
      addToast('ユーザー情報を更新しました', 'success');
      navigate('/mypage');
    } catch (err) {
      setError(toUserMessage(err, 'ユーザー情報の更新に失敗しました。'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <UserSidebar />
      <main className={styles.main}>
        <div className={styles.header}>
          <button onClick={() => navigate(-1)}>
            <ChevronLeft />
          </button>
          <h1 className={styles.title}>ユーザー情報の編集</h1>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>ユーザーID変更</h2>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>現在のユーザーID</span>
              <span className={styles.fieldValue}>{currentAccountID}</span>
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>新しいユーザーID</span>
              <input
                type="text"
                className={styles.input}
                value={newAccountID}
                maxLength={MAX_ACCOUNT_ID_LENGTH}
                onChange={(e) => {
                  setNewAccountID(e.target.value);
                  setAccountIDError(validateAccountID(e.target.value));
                }}
                placeholder="ユーザーIDを入力してください"
              />
              {accountIDError && <p className={styles.errorMsg}>{accountIDError}</p>}
            </div>
          </section>

          <hr className={styles.divider} />

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>名前変更</h2>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>現在の名前</span>
              <span className={styles.fieldValue}>{currentName}</span>
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>新しい名前</span>
              <input
                type="text"
                className={styles.input}
                value={newName}
                maxLength={MAX_NAME_LENGTH}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="名前を入力してください"
              />
            </div>
          </section>

          {error && <p className={styles.errorMsg}>{error}</p>}

          <div className={styles.submitWrap}>
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? '更新中...' : '更新する'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
