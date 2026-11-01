import { UnreadCountBadge } from '../atoms/UnreadCountBadge';
import styles from './Tabs.module.css';

type Tab<T extends string> = {
  key: T;
  label: string;
  // ラベルの横に出す件数。0 以下なら何も出さない。
  badge?: number;
};

type Props<T extends string> = {
  tabs: Tab<T>[];
  activeTab: T;
  onChange: (key: T) => void;
  justify?: 'start' | 'end';
};

export const Tabs = <T extends string>({ tabs, activeTab, onChange, justify = 'start' }: Props<T>) => (
  <div className={`${styles.tabs} ${justify === 'end' ? styles.tabsEnd : ''}`}>
    {tabs.map((tab) => (
      <button
        key={tab.key}
        className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
        onClick={() => onChange(tab.key)}
      >
        {tab.label}
        {tab.badge !== undefined && tab.badge > 0 && (
          <span className={styles.tabBadge}><UnreadCountBadge count={tab.badge} /></span>
        )}
      </button>
    ))}
  </div>
);
