import { UserSidebar } from '../components/organisms/UserSidebar';
import styles from './TimetableMaintenancePage.module.css';

export const TimetableMaintenancePage = () => (
  <div>
    <UserSidebar />
    <main className={styles.main}>
      <section className={styles.message} role="status">
        <h1 className={styles.title}>授業内チャット機能は一時停止中です</h1>
        <p>現在、授業内チャット機能はご利用いただけません。</p>
        <p>サービス再開までお待ちください。</p>
      </section>
    </main>
  </div>
);