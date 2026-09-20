import styles from './FormError.module.css';

type Props = {
  message: string;
};

export const FormError = ({ message }: Props) => (
  <p role="alert" className={styles.error}>
    <span aria-hidden="true">⚠</span>
    {message}
  </p>
);
