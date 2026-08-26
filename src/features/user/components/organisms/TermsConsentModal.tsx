import { useState } from 'react';
import { type TermsOfService, consentToTerms } from '../../api/terms';
import { TermsContent } from '../molecules/TermsContent';
import styles from './TermsConsentModal.module.css';

interface Props {
  terms: TermsOfService;
  onConsented: () => void;
}

export const TermsConsentModal = ({ terms, onConsented }: Props) => {
  const [submitting, setSubmitting] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [docError, setDocError] = useState(false);

  const handleConsent = async () => {
    setSubmitting(true);
    try {
      await consentToTerms(terms.ID);
      onConsented();
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            利用規約への同意
          </h2>
          <p className={styles.versionInfo}>
            バージョン {terms.version}　施行日:{' '}
            {new Date(terms.effectiveDate).toLocaleDateString('ja-JP')}
          </p>
        </div>

        <TermsContent
          documentUrl={terms.documentUrl}
          onScrolledToBottom={() => setScrolled(true)}
          onError={() => setDocError(true)}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem 1.5rem',
            lineHeight: 1.8,
            fontSize: '0.9rem',
            color: 'var(--color-text)',
          }}
        />

        <div className={styles.footer}>
          {!scrolled && !docError && (
            <p className={styles.scrollHint}>
              最後までスクロールすると同意ボタンが有効になります
            </p>
          )}
          <button
            onClick={handleConsent}
            disabled={submitting || docError || !scrolled}
            className={`${styles.consentButton} ${submitting || docError || !scrolled ? styles.consentButtonDisabled : styles.consentButtonActive}`}
          >
            {submitting ? '処理中...' : '上記の利用規約に同意する'}
          </button>
        </div>
      </div>
    </div>
  );
};
