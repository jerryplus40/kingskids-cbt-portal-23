import {
  BookOpen,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  Award,
  GraduationCap,
  History,
  LayoutDashboard,
  School,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { AppRole } from '@/types/db';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Shown only to these roles */
  roles?: AppRole[];
  /** Shown only to holders of this permission */
  permission?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    label: 'Home',
    items: [
      { label: 'Overview', to: '/admin', icon: LayoutDashboard, roles: ['admin'] },
      { label: 'Overview', to: '/staff', icon: LayoutDashboard, roles: ['teacher', 'exam_officer'] },
      { label: 'My exams', to: '/student', icon: ClipboardList, roles: ['student'] },
      { label: 'Report cards', to: '/student/reports', icon: FileText, roles: ['student'] },
      { label: 'My children', to: '/parent', icon: GraduationCap, roles: ['parent'] },
    ],
  },
  {
    label: 'Assessment',
    items: [
      { label: 'Question bank', to: '/staff/questions', icon: BookOpen, permission: 'questions.author' },
      { label: 'Exams', to: '/staff/exams', icon: ClipboardList, permission: 'exams.manage' },
      { label: 'Scores', to: '/staff/scores', icon: FileSpreadsheet, permission: 'scores.enter' },
      { label: 'Results and report cards', to: '/staff/results', icon: Award, roles: ['admin', 'exam_officer', 'teacher'] },
    ],
  },
  {
    label: 'School',
    items: [
      { label: 'People', to: '/admin/users', icon: Users, permission: 'users.manage' },
      { label: 'Classes and subjects', to: '/admin/academics', icon: School, permission: 'academics.manage' },
      { label: 'Settings', to: '/admin/settings', icon: Settings, permission: 'settings.manage' },
      { label: 'Audit log', to: '/admin/audit', icon: History, permission: 'audit.view' },
    ],
  },
];
