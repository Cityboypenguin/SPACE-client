import { Outlet } from 'react-router-dom';
import { useTimetableEnabled } from '../hooks/useTimetableEnabled';
import { TimetableMaintenancePage } from './TimetableMaintenancePage';

export const TimetableMaintenanceGuard = () => {
  const { enabled, isLoading } = useTimetableEnabled();

  if (isLoading) return null;
  return enabled ? <Outlet /> : <TimetableMaintenancePage />;
};