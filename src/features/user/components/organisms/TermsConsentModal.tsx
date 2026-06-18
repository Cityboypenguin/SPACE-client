import { useState } from 'react';
import { type TermsOfService, consentToTerms } from '../../api/terms';
import { TermsContent } from '../molecules/TermsContent';

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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9000,
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
            利用規約への同意
          </h2>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
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
            color: '#334155',
          }}
        />

        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {!scrolled && !docError && (
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center' }}>
              最後までスクロールすると同意ボタンが有効になります
            </p>
          )}
          <button
            onClick={handleConsent}
            disabled={submitting || docError || !scrolled}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: submitting || docError || !scrolled ? '#93c5fd' : '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: submitting || docError || !scrolled ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              fontSize: '1rem',
            }}
          >
            {submitting ? '処理中...' : '上記の利用規約に同意する'}
          </button>
        </div>
      </div>
    </div>
  );
};
