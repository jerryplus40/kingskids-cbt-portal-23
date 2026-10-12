import type { ReactNode } from 'react';
import { useSchoolSettings } from '@/hooks/useReferenceData';

/** Centred, calm frame shared by the sign-in pages. */
export function AuthPageFrame({ children }: { children: ReactNode }) {
  const { data: settings } = useSchoolSettings();
  return (
    <div className="min-h-screen bg-muted/40 px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
            KK
          </div>
          <h1 className="text-lg font-semibold">{settings?.school_name ?? "King's Kids"}</h1>
          <p className="text-sm text-muted-foreground">CBT Portal</p>
        </div>
        {children}
      </div>
    </div>
  );
}
