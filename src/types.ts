export type ViewMode = 'Agenda' | 'Day' | 'Week' | 'Month' | 'Year' | 'Permits';

export type UserRole = 'Admin' | 'Member';

export interface Group {
  id: string;
  name: string;
  createdAt: Date;
  _userId?: string;
}

export interface MemberProfile {
  id: string;
  groupId: string;
  name: string;
  email?: string;
  role: UserRole;
  color: string;
  pictureUrl?: string;
  _userId?: string;
}

export type PermitStatus = 'pending' | 'Accepted' | 'cancelled' | 'In Sched';

export type PermitType = 'Leave' | 'Access' | 'Budget';

export interface Permit {
  id: string;
  groupId: string;
  type: PermitType;
  title: string;
  description: string;
  sender: string;
  receiver: string;
  status: PermitStatus;
  createdAt: Date;
  updatedAt: Date;
  _userId?: string;
  metadata?: {
    startDate?: string;
    endDate?: string;
    location?: string;
    amount?: string;
    project?: string;
  };
}

export interface CalendarSettings {
  darkMode: boolean;
  use24HourFormat: boolean;
  agendaGroupBy: 'Date' | 'Color';
  showPersonalEvents: boolean;
}

export interface CalendarEvent {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  color: string;
  category: string;
  attendees?: string[];
  createdBy: string;
  creatorName?: string;
  _userId?: string;
}

export const CATEGORY_COLORS: Record<string, string> = {
  Meeting: 'bg-blue-600/20 border-blue-500 text-blue-400',
  Personal: 'bg-purple-600/20 border-purple-500 text-purple-400',
  Work: 'bg-emerald-600/20 border-emerald-500 text-emerald-400',
  Urgent: 'bg-rose-600/20 border-rose-500 text-rose-400',
  Other: 'bg-amber-600/20 border-amber-500 text-amber-400',
};

export const MOCK_EVENTS: CalendarEvent[] = [];
