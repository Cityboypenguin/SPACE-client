import styles from './OtpInputSection.module.css';

type Props = {
  email: string;
  otp: string;
  onOtpChange: (otp: string) => void;
  otpError?: string;
  onResend: () => void;
  resending?: boolean;
  cooldown?: number;
  sendError?: string;
  warningText?: string;
};

export const OtpInputSection = ({
  email,
  otp,
  onOtpChange,
  otpError,
  onResend,
  resending,
  cooldown = 0,
  sendError,
  warningText,
}: Props) => (
  <div>
    {warningText && <p className={styles.warningText}>{warningText}</p>}
    <p className={styles.hint}>
      <strong>{email}</strong> に送信した6桁の認証コードを入力してください（有効期限10分）
    </p>
    <input
      type="text"
      inputMode="numeric"
      maxLength={6}
      value={otp}
      onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, ''))}
      placeholder="認証コード（6桁）"
      className={styles.inputOtp}
    />
    {otpError && <p className={styles.fieldError}>{otpError}</p>}
    <div className={styles.resendRow}>
      <button
        type="button"
        className={styles.resendBtn}
        onClick={onResend}
        disabled={resending || cooldown > 0}
      >
        {resending
          ? '送信中...'
          : cooldown > 0
          ? `${cooldown}秒後に再送信可能`
          : 'メールを再度送信する'}
      </button>
      {sendError && <p className={styles.fieldError}>{sendError}</p>}
    </div>
  </div>
);
