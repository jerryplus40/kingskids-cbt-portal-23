import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { HOME_BY_ROLE } from './home';
import type { AppRole } from '@/types/db';
import { FullPageSpinner } from '@/components/FullPageSpinner';

interface RequireAuthProps {
  children: ReactNode;
  roles?: AppRole[];
  permission?: string;
}

/**
 * Hides pages from people who should not see them. This is a convenience only:
 * the database refuses the same requests through row-level security.
 */
export function RequireAuth({ children, roles, permission }: RequireAuthProps) {
  const { session, profile, isLoading, needsMfa, can } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageSpinner />;
  if (!session || !profile) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (needsMfa) return <Navigate to="/mfa" replace state={{ from: location.pathname }} />;
  if (profile.must_change_password && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }
  const allowed = (!roles || roles.includes(profile.role)) && (!permission || can(permission));
  if (!allowed) return <Navigate to={HOME_BY_ROLE[profile.role]} replace />;
  return <>{children}</>;
}
