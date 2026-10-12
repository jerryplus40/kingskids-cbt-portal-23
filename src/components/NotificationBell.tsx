import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase, unwrap } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';

interface Notification {
  id: number;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

const ago = (iso: string) => {
  const minutes = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} h ago`;
  return new Date(iso).toLocaleDateString('en-NG');
};

export function NotificationBell() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const notifications = useQuery({
    queryKey: ['notifications', profile?.id],
    enabled: !!profile,
    refetchInterval: 60_000,
    queryFn: async () =>
      unwrap(await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20)) as Notification[],
  });
  const unread = notifications.data?.filter((n) => !n.read_at) ?? [];

  const markAllRead = async () => {
    if (!unread.length) return;
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).in('id', unread.map((n) => n.id));
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  return (
    <Popover onOpenChange={(open) => !open && markAllRead()}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications${unread.length ? `, ${unread.length} unread` : ''}`}>
          <Bell className="h-5 w-5" />
          {unread.length > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unread.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-2 text-sm font-medium">Notifications</div>
        <ul className="max-h-96 overflow-y-auto">
          {notifications.data?.map((n) => (
            <li key={n.id}>
              <button
                className={`w-full border-b px-4 py-3 text-left text-sm hover:bg-muted ${n.read_at ? '' : 'bg-primary/5'}`}
                onClick={() => n.link && navigate(n.link)}
              >
                <div className="font-medium">{n.title}</div>
                {n.body && <div className="text-muted-foreground">{n.body}</div>}
                <div className="mt-1 text-xs text-muted-foreground">{ago(n.created_at)}</div>
              </button>
            </li>
          ))}
          {notifications.data?.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted-foreground">Nothing new.</li>}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
