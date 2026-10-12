import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { KeyRound, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/auth/AuthProvider';
import { useSchoolSettings } from '@/hooks/useReferenceData';
import { ROLE_LABELS, STAFF_ROLES, fullName } from '@/types/db';
import { NAV } from './nav';
import { NotificationBell } from '@/components/NotificationBell';

export function AppShell() {
  const { profile, can, signOut } = useAuth();
  const { data: settings } = useSchoolSettings();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  if (!profile) return null;

  // Top-level pages match exactly; others also match their sub-pages (/staff/exams/123)
  const isActive = (to: string) =>
    to.split('/').length <= 2 ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);

  const groups = NAV.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => (!item.roles || item.roles.includes(profile.role)) && (!item.permission || can(item.permission)),
    ),
  })).filter((group) => group.items.length > 0);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={settings?.logo_url ?? '/brand/mark-192.png'} alt="" className="h-9 w-9 rounded object-contain" />
            <div className="leading-tight">
              <div className="text-sm font-semibold">King's Kids CBT</div>
              <div className="text-xs text-muted-foreground">{ROLE_LABELS[profile.role]}</div>
            </div>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          {groups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild isActive={isActive(item.to)}>
                        <NavLink to={item.to}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter className="border-t p-3 text-xs text-muted-foreground">
          {settings?.school_name}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger />
          <div className="flex-1" />
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <UserRound className="h-4 w-4" />
                <span className="hidden sm:inline">{fullName(profile)}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="font-medium">{fullName(profile)}</div>
                <div className="text-xs font-normal text-muted-foreground">{profile.login_id}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate('/change-password')}>
                <KeyRound className="mr-2 h-4 w-4" /> Change password
              </DropdownMenuItem>
              {STAFF_ROLES.includes(profile.role) && (
                <DropdownMenuItem onSelect={() => navigate('/security')}>
                  <ShieldCheck className="mr-2 h-4 w-4" /> Two-step sign-in
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
