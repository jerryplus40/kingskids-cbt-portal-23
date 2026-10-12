import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useSchoolSettings } from '@/hooks/useReferenceData';

/** Centred, calm frame shared by the sign-in pages. */
export function AuthPageFrame({ children }: { children: ReactNode }) {
  const { data: settings } = useSchoolSettings();
  return (
    <div className="min-h-screen bg-muted/40 px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <Link to="/" aria-label="Home">
            <img src={settings?.logo_url ?? '/brand/logo.png'} alt={settings?.school_name ?? "King's Kids Christian Schools"} className="mx-auto mb-3 h-20 w-auto" />
          </Link>
          <p className="text-sm text-muted-foreground">CBT Portal</p>
        </div>
        {children}
      </div>
    </div>
  );
}
