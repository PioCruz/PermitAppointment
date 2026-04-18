/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { addMonths, subMonths, addDays, subDays, addWeeks, subWeeks, addYears, subYears } from 'date-fns';
import { Header } from './components/Header';
import { AgendaView } from './components/AgendaView';
import { DayView } from './components/DayView';
import { WeekView } from './components/WeekView';
import { MonthView } from './components/MonthView';
import { YearView } from './components/YearView';
import { Sidebar } from './components/Sidebar';
import { AddEventModal } from './components/AddEventModal';
import { SettingsPopover } from './components/SettingsPopover';
import { EventDetailModal } from './components/EventDetailModal';
import { DayEventsPopover } from './components/DayEventsPopover';
import { ViewMode, CalendarEvent, CalendarSettings, UserRole, Permit, CATEGORY_COLORS, Group, MemberProfile } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { isSameDay, isSameWeek, isSameMonth, isSameYear } from 'date-fns';
import { PermitsView } from './components/PermitsView';
import { AddPermitModal } from './components/AddPermitModal';
import { Login } from './components/Login';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useFirestoreSync } from './hooks/useFirebase';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Loading...</div>;
  }

  if (!user) {
    return <Login onSuccess={() => {}} />;
  }

  return <AuthenticatedApp user={user} />;
}

function AuthenticatedApp({ user }: { user: User }) {
  const {
    groups,
    members,
    events,
    permits,
    loading,
    isAdmin,
    addGroup,
    deleteGroup,
    addMember,
    updateMember,
    deleteMember,
    addEvent,
    updateEvent,
    deleteEvent,
    addPermit,
    updatePermit,
  } = useFirestoreSync(user);

  const [currentDate, setCurrentDate] = useState(new Date()); // Start at actual today
  const [viewMode, setViewMode] = useState<ViewMode>('Agenda');
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isPermitModalOpen, setIsPermitModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDayPopoverOpen, setIsDayPopoverOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [activeCategories, setActiveCategories] = useState<string[]>(Object.keys(CATEGORY_COLORS));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [settings, setSettings] = useState<CalendarSettings>({
    darkMode: true,
    use24HourFormat: true,
    agendaGroupBy: 'Date',
    showPersonalEvents: true,
  });

  // Set active group automatically if none selected
  useEffect(() => {
    if (groups.length > 0 && !activeGroupId) {
      setActiveGroupId(groups[0].id);
    }
  }, [groups, activeGroupId]);

  const activeGroupMembers = members.filter(m => m.groupId === activeGroupId);
  const myMemberProfile = activeGroupMembers.find(m => m.email === user.email || m.name === user.email);
  const currentUserRole: UserRole = myMemberProfile?.role || 'Member';

  // Set active member ID when profile is found
  useEffect(() => {
    if (myMemberProfile && activeMemberId !== myMemberProfile.id) {
      setActiveMemberId(myMemberProfile.id);
    }
  }, [myMemberProfile, activeMemberId]);

  const filteredEvents = events.filter(e => {
    const isInGroup = e.groupId === activeGroupId;
    const isPersonal = e.category === 'Personal';
    
    // 1. Basic contextual check: Must be in active group OR be my personal event
    if (!isInGroup && !(isPersonal && e.createdBy === user.uid)) return false;

    // 2. Involvement/Permission check
    const isCreator = e.createdBy === user.uid;
    const isAttendee = activeMemberId && e.attendees?.includes(activeMemberId);
    const isWorkspaceAdmin = currentUserRole === 'Admin';

    if (isPersonal) {
      // Personal events: strictly owner-only visibility
      if (!isCreator) return false;
    } else {
      // Workspace events: Admins see all, Members see only if involved
      if (!isWorkspaceAdmin && !isCreator && !isAttendee) return false;
    }

    // 3. Category & UI preference filters
    const isCategoryActive = activeCategories.includes(e.category);
    const isPersonalVisible = isPersonal ? settings.showPersonalEvents : true;
    
    return isCategoryActive && isPersonalVisible;
  });

  const groupPermits = permits.filter(p => p.groupId === activeGroupId);

  const handleUpdateSettings = (newSettings: Partial<CalendarSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleAddPermit = (newPermit: Permit) => {
    if (!activeGroupId) return;
    addPermit({ ...newPermit, groupId: activeGroupId });
    toast.success('Permit request submitted');
  };

  const handleUpdatePermitStatus = (id: string, status: Permit['status']) => {
    const permit = permits.find(p => p.id === id);
    if (permit) {
      updatePermit({ ...permit, status, updatedAt: new Date() });
      if (status === 'Accepted') {
        toast.success('Permit accepted');
      } else if (status === 'cancelled') {
        toast.error('Permit rejected');
      } else {
        toast.info(`Permit status updated to ${status}`);
      }
    }
  };

  const handleScheduleAppointment = (permit: Permit) => {
    if (!activeGroupId) return;
    // 1. Prepare a new event based on the permit
    const newEvent: CalendarEvent = {
      id: `permit-event-${permit.id}`,
      groupId: activeGroupId,
      title: `In Sched: ${permit.title}`,
      description: `Appointment to discuss permit request: ${permit.description}\n\nSender: ${permit.sender}`,
      start: new Date(),
      end: new Date(Date.now() + 60 * 60 * 1000), // 1 hour duration
      color: 'blue',
      category: 'Meeting',
      createdBy: activeMemberId || 'Admin',
    };

    // 2. Open the event modal
    setSelectedEvent(newEvent);
    setIsEventModalOpen(true);
    setViewMode('Day');
  };

  const pendingPermitsCount = groupPermits.filter(p => p.status === 'pending' && p.receiver === activeMemberId).length;

  const handleAddEvent = (newEvent: CalendarEvent) => {
    if (!activeGroupId) return;
    
    const isEdit = events.some(e => e.id === newEvent.id);
    
    if (isEdit) {
      updateEvent({ ...newEvent, groupId: activeGroupId });
      toast.success('Event updated successfully');
    } else {
      addEvent({ ...newEvent, groupId: activeGroupId });
      toast.success('Event created successfully');
    }

    // If this event was created from a permit scheduling action
    if (newEvent.id.startsWith('permit-event-')) {
      const permitId = newEvent.id.replace('permit-event-', '');
      handleUpdatePermitStatus(permitId, 'In Sched');
    }

    setSelectedEvent(null);
  };

  const handleDeleteEvent = (id: string) => {
    const eventToDelete = events.find(e => e.id === id);
    deleteEvent(id, eventToDelete?._userId);
    setIsDetailOpen(false);
    setSelectedEvent(null);
    toast.success('Event deleted');
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDetailOpen(false);
    setIsEventModalOpen(true);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDetailOpen(true);
    setIsDayPopoverOpen(false);
  };

  const handleSelectDay = (day: Date) => {
    setSelectedDay(day);
    setIsDayPopoverOpen(true);
  };

  const handleSidebarDateSelect = (date: Date) => {
    setCurrentDate(date);
    setViewMode('Day');
  };

  const handlePrev = () => {
    switch (viewMode) {
      case 'Agenda':
      case 'Month': setCurrentDate(subMonths(currentDate, 1)); break;
      case 'Day': setCurrentDate(subDays(currentDate, 1)); break;
      case 'Week': setCurrentDate(subWeeks(currentDate, 1)); break;
      case 'Year': setCurrentDate(subYears(currentDate, 1)); break;
    }
  };

  const handleNext = () => {
    switch (viewMode) {
      case 'Agenda':
      case 'Month': setCurrentDate(addMonths(currentDate, 1)); break;
      case 'Day': setCurrentDate(addDays(currentDate, 1)); break;
      case 'Week': setCurrentDate(addWeeks(currentDate, 1)); break;
      case 'Year': setCurrentDate(addYears(currentDate, 1)); break;
    }
  };

  const handleToday = () => setCurrentDate(new Date());

  const handleUpdateEvent = (updatedEvent: CalendarEvent) => {
    const originalEvent = events.find(e => e.id === updatedEvent.id);
    if (originalEvent) {
      const canModify = currentUserRole === 'Admin' || originalEvent.createdBy === activeMemberId;
      if (!canModify) return;
    }
    updateEvent(updatedEvent);
    toast.success('Event updated successfully');
  };

  const getFilteredEventCount = () => {
    switch (viewMode) {
      case 'Day':
        return filteredEvents.filter(e => isSameDay(e.start, currentDate)).length;
      case 'Week':
        return filteredEvents.filter(e => isSameWeek(e.start, currentDate)).length;
      case 'Month':
        return filteredEvents.filter(e => isSameMonth(e.start, currentDate)).length;
      case 'Year':
        return filteredEvents.filter(e => isSameYear(e.start, currentDate)).length;
      case 'Agenda':
        // For Agenda, we might want to show events in the current month or all events.
        // Given handleNext/Prev for Agenda uses months, let's show events in the current month.
        return filteredEvents.filter(e => isSameMonth(e.start, currentDate)).length;
      default:
        return filteredEvents.length;
    }
  };

  const renderView = () => {
    const commonProps = {
      events: filteredEvents,
      currentDate,
      settings,
      onSelectEvent: handleSelectEvent,
      onUpdateEvent: handleUpdateEvent,
      searchQuery,
      setSearchQuery,
      currentUser: currentUserRole,
      currentUserId: activeMemberId,
    };

    switch (viewMode) {
      case 'Agenda': return <AgendaView {...commonProps} />;
      case 'Day': return <DayView {...commonProps} />;
      case 'Week': return <WeekView {...commonProps} />;
      case 'Month': return <MonthView {...commonProps} />;
      case 'Year': return <YearView {...commonProps} onSelectDay={handleSelectDay} />;
      case 'Permits': return <PermitsView permits={groupPermits} currentUser={currentUserRole} currentUserName={user.email || ''} onUpdatePermit={handleUpdatePermitStatus} onScheduleAppointment={handleScheduleAppointment} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />;
      default: return <AgendaView {...commonProps} />;
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Loading data...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-sans selection:bg-foreground/10">
      <Toaster position="top-right" theme={settings.darkMode ? 'dark' : 'light'} />
      <Header 
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        currentDate={currentDate}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        onAddEvent={() => setIsEventModalOpen(true)}
        onAddPermit={() => setIsPermitModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(!isSettingsOpen)}
        eventCount={getFilteredEventCount()}
        currentUser={currentUserRole}
        pendingPermitsCount={pendingPermitsCount}
        activeCategories={activeCategories}
        setActiveCategories={setActiveCategories}
        groups={groups}
        members={activeGroupMembers}
        activeGroupId={activeGroupId}
        onSelectGroup={setActiveGroupId}
        onAddGroup={addGroup}
        onDeleteGroup={deleteGroup}
        onAddMember={addMember}
        onUpdateMember={updateMember}
        onDeleteMember={deleteMember}
        user={user}
        isAdmin={isAdmin}
      />
      
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          currentDate={currentDate}
          onDateSelect={handleSidebarDateSelect}
          events={filteredEvents}
          pendingPermitsCount={pendingPermitsCount}
          currentUser={currentUserRole}
          onSelectEvent={handleSelectEvent}
        />
        
        <main className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode + currentDate.getTime()}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full flex flex-col"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AddPermitModal 
        isOpen={isPermitModalOpen}
        onClose={() => setIsPermitModalOpen(false)}
        onAdd={handleAddPermit}
        currentUserName={user.email || ''}
        activeGroupId={activeGroupId}
        members={activeGroupMembers}
      />

      <AddEventModal 
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setSelectedEvent(null);
        }}
        onAdd={handleAddEvent}
        initialEvent={selectedEvent}
        currentUser={currentUserRole}
        currentUserId={activeMemberId}
        activeGroupId={activeGroupId}
        members={activeGroupMembers}
      />

      <SettingsPopover
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      <EventDetailModal
        event={selectedEvent}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedEvent(null);
        }}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        currentUser={currentUserRole}
        members={members}
        currentUserId={activeMemberId}
      />

      <DayEventsPopover
        day={selectedDay}
        events={filteredEvents.filter(e => selectedDay && isSameDay(e.start, selectedDay))}
        isOpen={isDayPopoverOpen}
        onClose={() => {
          setIsDayPopoverOpen(false);
          setSelectedDay(null);
        }}
        onSelectEvent={handleSelectEvent}
      />

      {/* Global styles for hiding scrollbars but keeping functionality */}
      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
