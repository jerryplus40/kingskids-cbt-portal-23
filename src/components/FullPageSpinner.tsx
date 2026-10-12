export function FullPageSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center" role="status" aria-live="polite">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
