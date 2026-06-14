import styles from './Tabs.module.css';

type Tab<T extends string> = {
  key: T;
  label: string;
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
      </button>
    ))}
  </div>
);
