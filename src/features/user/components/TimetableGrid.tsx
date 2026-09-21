import { useState, type ReactNode } from 'react';
import { TIMETABLE_DAYS, TIMETABLE_PERIODS, TIMETABLE_PERIOD_TIMES } from './timetableConstants';
import styles from './Timetable.module.css';

type Props = {
  renderSlotContent: (day: string, period: number) => ReactNode;
  // 指定するとスマホ表示で選択中の曜日を sessionStorage に保持し、授業チャットなど
  // 別ページから戻ってきても同じ曜日を開き直す(未指定なら常に月曜から)。
  mobileDayStorageKey?: string;
  classNames?: {
    gridWrap?: string;
    mobileTimetable?: string;
    mobileDayList?: string;
    mobilePeriodRow?: string;
  };
};

const readStoredDay = (key: string | undefined) => {
  if (!key) return TIMETABLE_DAYS[0];
  try {
    const stored = sessionStorage.getItem(key);
    return stored && TIMETABLE_DAYS.includes(stored) ? stored : TIMETABLE_DAYS[0];
  } catch {
    return TIMETABLE_DAYS[0];
  }
};

export const TimetableGrid = ({ renderSlotContent, mobileDayStorageKey, classNames }: Props) => {
  const [mobileDay, setMobileDayState] = useState(() => readStoredDay(mobileDayStorageKey));

  const setMobileDay = (day: string) => {
    setMobileDayState(day);
    if (!mobileDayStorageKey) return;
    try {
      sessionStorage.setItem(mobileDayStorageKey, day);
    } catch {
      // ストレージが使えない環境では保持しないだけ
    }
  };

  return (
    <>
      <div className={`${styles.gridWrap}${classNames?.gridWrap ? ` ${classNames.gridWrap}` : ''}`}>
        <table className={styles.grid}>
          <thead>
            <tr>
              <th className={styles.periodHeader} />
              {TIMETABLE_DAYS.map((day) => <th key={day}>{day}</th>)}
            </tr>
          </thead>
          <tbody>
            {TIMETABLE_PERIODS.map((period) => (
              <tr key={period}>
                <td className={styles.periodCell}>
                  <span className={styles.periodNumber}>{period}</span>
                  <span className={styles.periodTime}>
                    {TIMETABLE_PERIOD_TIMES[period].map((time) => <span key={time}>{time}</span>)}
                  </span>
                </td>
                {TIMETABLE_DAYS.map((day) => (
                  <td key={day} className={styles.cell}>
                    {renderSlotContent(day, period)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={`${styles.mobileTimetable}${classNames?.mobileTimetable ? ` ${classNames.mobileTimetable}` : ''}`}>
        <div className={styles.mobileDayTabs}>
          {TIMETABLE_DAYS.map((day) => (
            <button
              key={day}
              type="button"
              className={`${styles.mobileDayButton} ${mobileDay === day ? styles.mobileDayButtonActive : ''}`}
              onClick={() => setMobileDay(day)}
            >
              {day}
            </button>
          ))}
        </div>
        <div className={`${styles.mobileDayList}${classNames?.mobileDayList ? ` ${classNames.mobileDayList}` : ''}`}>
          {TIMETABLE_PERIODS.map((period) => (
            <div key={period} className={`${styles.mobilePeriodRow}${classNames?.mobilePeriodRow ? ` ${classNames.mobilePeriodRow}` : ''}`}>
              <div className={styles.mobilePeriodMeta}>
                <span className={styles.periodNumber}>{period}</span>
                <span className={styles.periodTime}>
                  {TIMETABLE_PERIOD_TIMES[period].map((time) => <span key={time}>{time}</span>)}
                </span>
              </div>
              <div className={styles.mobileSlot}>
                {renderSlotContent(mobileDay, period)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
