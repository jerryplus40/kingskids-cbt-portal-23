import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { supabase, unwrap } from '@/lib/supabase';
import { fullName, type AuditEntry, type Profile } from '@/types/db';

type Row = AuditEntry & { actor: Pick<Profile, 'first_name' | 'last_name' | 'login_id'> | null };

const LIMIT = 1000;

function summarise(details: Record<string, unknown> | null): string {
  if (!details) return '';
  return Object.entries(details)
    .filter(([key]) => !['id', 'created_at', 'updated_at'].includes(key))
    .slice(0, 4)
    .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`)
    .join(' · ');
}

export default function AuditLog() {
  const log = useQuery({
    queryKey: ['audit_log'],
    queryFn: async () => {
      const entries = unwrap(await supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(LIMIT)) as AuditEntry[];
      // audit_log has no foreign key to profiles (actors can be deleted), so join in the browser
      const actorIds = [...new Set(entries.map((e) => e.actor_id).filter(Boolean))] as string[];
      const actors = actorIds.length
        ? (unwrap(await supabase.from('profiles').select('id, first_name, last_name, login_id').in('id', actorIds)) as (Profile & { id: string })[])
        : [];
      const byId = new Map(actors.map((a) => [a.id, a]));
      return entries.map((e) => ({ ...e, actor: e.actor_id ? byId.get(e.actor_id) ?? null : null })) as Row[];
    },
  });

  const columns: ColumnDef<Row, unknown>[] = [
    { id: 'when', header: 'When', accessorFn: (r) => r.created_at, cell: ({ row }) => new Date(row.original.created_at).toLocaleString('en-NG') },
    { id: 'who', header: 'Who', accessorFn: (r) => (r.actor ? fullName(r.actor) : 'System') },
    { accessorKey: 'action', header: 'Action' },
    { accessorKey: 'entity', header: 'Record' },
    { id: 'details', header: 'Details', accessorFn: (r) => summarise(r.details), cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{getValue() as string}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Audit log" description={`Who changed what. Showing the latest ${LIMIT} entries.`} />
      <DataTable columns={columns} data={log.data} isLoading={log.isLoading} error={log.error} searchPlaceholder="Search person, action or record" pageSize={50} />
    </div>
  );
}
