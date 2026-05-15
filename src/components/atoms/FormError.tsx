type Props = {
  message: string;
};

export const FormError = ({ message }: Props) => (
  <p
    role="alert"
    style={{
      margin: '0.25rem 0 0',
      color: '#f43f5e',
      fontSize: '0.8rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.3rem',
    }}
  >
    <span aria-hidden="true">⚠</span>
    {message}
  </p>
);
