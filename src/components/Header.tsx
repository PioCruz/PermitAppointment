import React, { useState } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ChevronLeft, ChevronRight, Filter, Calendar as CalendarIcon, List, LayoutGrid, Columns, Grid3X3, Plus, Settings, User, Bell, Search, Check, ChevronDown, Users, Shield, LogOut, Trash2, Menu, X } from 'lucide-react';
import { ViewMode, UserRole, CATEGORY_COLORS, Group, MemberProfile } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../firebase';

interface HeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  currentDate: Date;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onAddEvent: () => void;
  onAddPermit: () => void;
  onOpenSettings: () => void;
  eventCount: number;
  currentUser: UserRole;
  pendingPermitsCount: number;
  activeCategories: string[];
  setActiveCategories: (categories: string[]) => void;
  groups: Group[];
  members: MemberProfile[];
  activeGroupId: string | null;
  onSelectGroup: (id: string) => void;
  onAddGroup: (group: Group) => void;
  onDeleteGroup: (id: string, userId?: string) => void;
  onAddMember: (member: MemberProfile) => void;
  onUpdateMember: (member: MemberProfile) => void;
  onDeleteMember: (id: string, userId?: string) => void;
  user: any;
  isAdmin: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  currentDate,
  viewMode,
  setViewMode,
  onPrev,
  onNext,
  onToday,
  onAddEvent,
  onAddPermit,
  onOpenSettings,
  eventCount,
  currentUser,
  pendingPermitsCount,
  activeCategories,
  setActiveCategories,
  groups,
  members,
  activeGroupId,
  onSelectGroup,
  onAddGroup,
  onDeleteGroup,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  user,
  isAdmin,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);

  const today = new Date();
  const views: { id: ViewMode; icon: React.ReactNode; label: string }[] = [
    { id: 'Agenda', icon: <List className="w-4 h-4" />, label: 'Agenda' },
    { id: 'Day', icon: <CalendarIcon className="w-4 h-4" />, label: 'Day' },
    { id: 'Week', icon: <Columns className="w-4 h-4" />, label: 'Week' },
    { id: 'Month', icon: <LayoutGrid className="w-4 h-4" />, label: 'Month' },
    { id: 'Year', icon: <Grid3X3 className="w-4 h-4" />, label: 'Year' },
    { id: 'Permits', icon: <Bell className={cn("w-4 h-4", pendingPermitsCount > 0 && "text-rose-400 animate-pulse")} />, label: 'Permits' },
  ];

  const getDateRangeLabel = () => {
    switch (viewMode) {
      case 'Permits':
        return 'Permit History & Management';
      case 'Day':
        return format(currentDate, 'MMMM d, yyyy');
      case 'Week': {
        const start = startOfWeek(currentDate);
        const end = endOfWeek(currentDate);
        return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
      }
      case 'Month':
      case 'Agenda': {
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
      }
      case 'Year': {
        const start = startOfYear(currentDate);
        const end = endOfYear(currentDate);
        return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
      }
      default:
        return format(currentDate, 'MMMM d, yyyy');
    }
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const newGroup: Group = {
      id: crypto.randomUUID(),
      name: newGroupName.trim(),
      createdAt: new Date(),
    };
    onAddGroup(newGroup);
    onSelectGroup(newGroup.id);
    setNewGroupName('');
    setIsAddingGroup(false);
  };

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !activeGroupId) return;
    const email = newMemberName.trim();
    const name = email.includes('@') ? email.split('@')[0] : email;
    const newMember: MemberProfile = {
      id: crypto.randomUUID(),
      groupId: activeGroupId,
      name: name,
      email: email,
      role: 'Member',
      color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`,
    };
    onAddMember(newMember);
    setNewMemberName('');
    setIsAddingMember(false);
  };

  const toggleMemberRole = (e: React.MouseEvent, member: MemberProfile) => {
    e.preventDefault(); // Prevent left click action if any
    onUpdateMember({
      ...member,
      role: member.role === 'Admin' ? 'Member' : 'Admin'
    });
  };

  const activeGroup = groups.find(g => g.id === activeGroupId);

  return (
    <div className="flex flex-col gap-2 sm:gap-3 lg:gap-4 p-2 sm:p-3 lg:p-4 border-b border-border bg-background">
      {/* Top Segment: Navigation, Group Management, and Actions */}
      <div className="flex items-center justify-between gap-1 sm:gap-2">
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 sm:p-2 lg:hidden hover:bg-foreground/5 rounded-lg transition-colors text-foreground/60"
          >
            {isSidebarOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          <button 
            onClick={onToday}
            className="flex flex-col items-center justify-center w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg bg-card border border-border hover:bg-foreground/5 transition-colors group shrink-0"
          >
            <span className="text-[7px] sm:text-[8px] lg:text-[10px] font-bold text-foreground/40 uppercase tracking-wider group-hover:text-foreground/60">{format(today, 'MMM')}</span>
            <span className="text-sm sm:text-lg lg:text-xl font-bold text-foreground leading-none group-hover:scale-110 transition-transform">{format(today, 'd')}</span>
          </button>
          
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1 sm:gap-2">
              <h1 className="text-sm sm:text-base lg:text-xl font-bold text-foreground truncate max-w-[80px] sm:max-w-[120px] lg:max-w-none">
                {viewMode === 'Permits' ? 'Permits' : format(currentDate, 'MMMM yyyy')}
              </h1>
              <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-bold bg-foreground/10 text-foreground/60 rounded-full uppercase shrink-0">
                {viewMode === 'Permits' ? `${pendingPermitsCount} pending` : `${eventCount} events`}
              </span>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1 mt-0.5">
              <button 
                onClick={onPrev}
                className="p-0.5 hover:bg-foreground/5 rounded transition-colors text-foreground/40 hover:text-foreground"
              >
                <ChevronLeft className="w-3 h-3 lg:w-4 h-4" />
              </button>
              <span className="text-[8px] sm:text-[10px] lg:text-xs text-foreground/40 font-medium min-w-[70px] sm:min-w-[100px] lg:min-w-[240px] text-center truncate">
                {getDateRangeLabel()}
              </span>
              <button 
                onClick={onNext}
                className="p-0.5 hover:bg-foreground/5 rounded transition-colors text-foreground/40 hover:text-foreground"
              >
                <ChevronRight className="w-3 h-3 lg:w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-3">
          {/* Group selector */}
          <div className="relative">
            <button 
              onClick={() => setIsGroupOpen(!isGroupOpen)}
              className="flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-1.5 bg-card rounded-lg border border-border hover:bg-foreground/5 transition-colors"
            >
              <Users className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-foreground/40" />
              <span className="text-[10px] lg:text-xs font-bold text-foreground uppercase tracking-widest truncate max-w-[60px] lg:max-w-none hidden sm:inline portrait:max-sm:hidden ml-1">
                {activeGroup ? activeGroup.name : 'Group'}
              </span>
              <ChevronDown className={cn("w-3 h-3 text-foreground/40 transition-transform hidden sm:inline portrait:max-sm:hidden", isGroupOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isGroupOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsGroupOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute -right-12 sm:right-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[80vh]"
                  >
                    <div className="p-3 border-b border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Groups</span>
                        <button 
                          onClick={() => setIsAddingGroup(!isAddingGroup)}
                          className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          {isAddingGroup ? 'Cancel' : '+ New Group'}
                        </button>
                      </div>
                      
                      {isAddingGroup && (
                        <form onSubmit={handleCreateGroup} className="mb-3">
                          <input
                            autoFocus
                            id="new-group-name"
                            name="group-name"
                            aria-label="Group name"
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="Group name..."
                            className="w-full bg-background border border-border rounded-lg py-1.5 px-3 text-xs text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-indigo-500"
                          />
                        </form>
                      )}

                      <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-hide">
                        {groups.map(group => (
                          <div key={group.id} className="flex items-center gap-1">
                            <button
                              onClick={() => onSelectGroup(group.id)}
                              className={cn(
                                "flex items-center justify-between flex-1 px-3 py-2 rounded-lg text-xs transition-colors",
                                activeGroupId === group.id ? "bg-foreground/10 text-foreground" : "text-foreground/60 hover:bg-foreground/5"
                              )}
                            >
                              <span className="font-medium">{group.name}</span>
                              {activeGroupId === group.id && <Check className="w-3 h-3 text-indigo-400" />}
                            </button>
                            {(isAdmin || (activeGroupId === group.id && currentUser === 'Admin')) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteGroup(group.id, group._userId);
                                }}
                                className="p-2 text-foreground/20 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                title="Delete Group"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                        {groups.length === 0 && !isAddingGroup && (
                          <p className="text-xs text-foreground/40 text-center py-2">No groups yet</p>
                        )}
                      </div>
                    </div>

                    {activeGroupId && (
                      <div className="p-3 flex-1 overflow-y-auto scrollbar-hide">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Members</span>
                          {(isAdmin || currentUser === 'Admin') && (
                            <button 
                              onClick={() => setIsAddingMember(!isAddingMember)}
                              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                              {isAddingMember ? 'Cancel' : '+ Add Member'}
                            </button>
                          )}
                        </div>

                        {isAddingMember && (
                          <form onSubmit={handleCreateMember} className="mb-3">
                            <input
                              autoFocus
                              id="new-member-email"
                              name="member-email"
                              aria-label="Member email"
                              type="email"
                              value={newMemberName}
                              onChange={(e) => setNewMemberName(e.target.value)}
                              placeholder="User email..."
                              className="w-full bg-background border border-border rounded-lg py-1.5 px-3 text-xs text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-indigo-500"
                            />
                          </form>
                        )}

                        <div className="space-y-1">
                          {members.map(member => (
                            <div key={member.id} className="flex items-center gap-1">
                              <div
                                className={cn(
                                  "flex items-center justify-between flex-1 px-3 py-2 rounded-lg text-xs transition-colors group/member",
                                  "text-foreground/60"
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  {member.pictureUrl ? (
                                    <img src={member.pictureUrl} alt={member.name} className="w-6 h-6 rounded-full object-cover" />
                                  ) : (
                                    <div 
                                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-foreground" 
                                      style={{ backgroundColor: member.color }}
                                    >
                                      {member.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <span className="font-medium truncate max-w-[100px]">{member.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                                    member.role === 'Admin' ? "bg-amber-500/20 text-amber-400" : "bg-foreground/10 text-foreground/40"
                                  )}>
                                    {member.role}
                                  </span>
                                </div>
                              </div>
                              {(isAdmin || currentUser === 'Admin') && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteMember(member.id, member._userId);
                                  }}
                                  className="p-2 text-foreground/20 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                  title="Remove Member"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                          {members.length === 0 && !isAddingMember && (
                            <p className="text-xs text-foreground/40 text-center py-2">No members in this group</p>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter controls for Desktop (View in top bar for PC is okay too, but user asked for segments on mobile) */}
            <div className="hidden lg:flex items-center gap-2">
              <div className="relative">
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={cn(
                    "p-2 hover:bg-foreground/5 rounded-lg transition-colors relative",
                    activeCategories.length < Object.keys(CATEGORY_COLORS).length ? "text-indigo-400" : "text-foreground/60"
                  )}
                >
                  <Filter className="w-5 h-5" />
                  {activeCategories.length < Object.keys(CATEGORY_COLORS).length && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border border-background" />
                  )}
                </button>

                <AnimatePresence>
                  {isFilterOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
                      >
                        <div className="p-3 border-b border-border flex items-center justify-between">
                          <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Filter Categories</span>
                          <button 
                            onClick={() => setActiveCategories(Object.keys(CATEGORY_COLORS))}
                            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            Reset
                          </button>
                        </div>
                        <div className="p-2 space-y-1">
                          {Object.entries(CATEGORY_COLORS).map(([name, colorClass]) => {
                            const isActive = activeCategories.includes(name);
                            return (
                              <button
                                key={name}
                                onClick={() => {
                                  if (isActive) {
                                    setActiveCategories(activeCategories.filter(c => c !== name));
                                  } else {
                                    setActiveCategories([...activeCategories, name]);
                                  }
                                }}
                                className={cn(
                                  "flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs transition-colors",
                                  isActive ? "bg-foreground/5 text-foreground" : "text-foreground/40 hover:bg-foreground/5 hover:text-foreground/60"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={cn("w-2 h-2 rounded-full", colorClass.split(' ')[0])} />
                                  <span>{name}</span>
                                </div>
                                {isActive && <Check className="w-3 h-3 text-indigo-400" />}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center p-1 bg-card rounded-lg border border-border">
                {views.map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setViewMode(view.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all relative",
                      viewMode === view.id 
                        ? "bg-foreground/10 text-foreground shadow-sm" 
                        : "text-foreground/40 hover:text-foreground/60"
                    )}
                    title={view.label}
                  >
                    {view.icon}
                    <span className="hidden xl:inline">{view.label}</span>
                    {view.id === 'Permits' && pendingPermitsCount > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 text-[8px] font-bold bg-rose-500 text-foreground rounded-full">
                        {pendingPermitsCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Create button */}
            <div className="relative">
              <button 
                onClick={() => setIsCreateOpen(!isCreateOpen)}
                className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-foreground text-background rounded-lg text-xs lg:text-sm font-bold hover:bg-foreground/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline portrait:max-sm:hidden">Create</span>
                <ChevronDown className={cn("w-3 h-3 transition-transform hidden sm:inline portrait:max-sm:hidden", isCreateOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isCreateOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsCreateOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-1">
                        <button
                          onClick={() => {
                            onAddEvent();
                            setIsCreateOpen(false);
                          }}
                          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs font-medium text-foreground/80 hover:bg-foreground/5 hover:text-foreground transition-colors"
                        >
                          <CalendarIcon className="w-4 h-4 text-foreground/40" />
                          New Event
                        </button>
                        <button
                          onClick={() => {
                            onAddPermit();
                            setIsCreateOpen(false);
                          }}
                          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs font-medium text-foreground/80 hover:bg-foreground/5 hover:text-foreground transition-colors"
                        >
                          <Bell className="w-4 h-4 text-foreground/40" />
                          New Permit
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            
            {/* Profile */}
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 hover:bg-indigo-500/30 transition-colors"
              >
                {user?.email ? user.email.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col"
                    >
                      <div className="p-4 border-b border-border flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-2xl font-bold mb-3">
                          {user?.email ? user.email.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
                        </div>
                        
                        <div className="flex flex-col items-center">
                          <p className="text-sm font-medium text-foreground truncate max-w-[150px]">
                            {user?.email}
                          </p>
                          <p className="text-[10px] text-foreground/40 mt-0.5">
                            {isAdmin ? 'System Administrator' : 'System User'}
                          </p>
                        </div>
                        
                        <div className="mt-3 flex flex-col items-center gap-1">
                          <span className={cn(
                            "px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-full",
                            currentUser === 'Admin' ? "bg-amber-500/20 text-amber-400" : "bg-foreground/10 text-foreground/40"
                          )}>
                            Workspace {currentUser}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-1">
                        <button
                          onClick={() => {
                            onOpenSettings();
                            setIsProfileOpen(false);
                          }}
                          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs font-medium text-foreground/80 hover:bg-foreground/5 hover:text-foreground transition-colors"
                        >
                          <Settings className="w-4 h-4 text-foreground/40" />
                          Settings
                        </button>
                        <button
                          onClick={() => auth.signOut()}
                          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Segment: Filter and Views (Mobile/Tablet only) */}
      <div className="flex lg:hidden items-center justify-between gap-2 border-t border-border/40 pt-2">
        <div className="flex items-center gap-2">
          {/* Mobile Filter button */}
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                "p-2 hover:bg-foreground/5 rounded-lg transition-colors relative",
                activeCategories.length < Object.keys(CATEGORY_COLORS).length ? "text-indigo-400" : "text-foreground/60"
              )}
            >
              <Filter className="w-5 h-5" />
              {activeCategories.length < Object.keys(CATEGORY_COLORS).length && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border border-background" />
              )}
            </button>

            <AnimatePresence>
              {isFilterOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute left-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-3 border-b border-border flex items-center justify-between">
                      <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Filter Categories</span>
                      <button 
                        onClick={() => setActiveCategories(Object.keys(CATEGORY_COLORS))}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Reset
                      </button>
                    </div>
                    <div className="p-2 space-y-1">
                      {Object.entries(CATEGORY_COLORS).map(([name, colorClass]) => {
                        const isActive = activeCategories.includes(name);
                        return (
                          <button
                            key={name}
                            onClick={() => {
                              if (isActive) {
                                setActiveCategories(activeCategories.filter(c => c !== name));
                              } else {
                                setActiveCategories([...activeCategories, name]);
                              }
                            }}
                            className={cn(
                              "flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs transition-colors",
                              isActive ? "bg-foreground/5 text-foreground" : "text-foreground/40 hover:bg-foreground/5 hover:text-foreground/60"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn("w-2 h-2 rounded-full", colorClass.split(' ')[0])} />
                              <span>{name}</span>
                            </div>
                            {isActive && <Check className="w-3 h-3 text-indigo-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile View selectors */}
        <div className="flex items-center p-1 bg-card rounded-lg border border-border overflow-x-auto scrollbar-hide flex-1">
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => setViewMode(view.id)}
              className={cn(
                "flex items-center justify-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-all relative flex-1 shrink-0",
                viewMode === view.id 
                  ? "bg-foreground/10 text-foreground shadow-sm" 
                  : "text-foreground/40 hover:text-foreground/60"
              )}
              title={view.label}
            >
              {view.icon}
              <span className="hidden sm:inline portrait:max-sm:hidden">{view.label}</span>
              {view.id === 'Permits' && pendingPermitsCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[8px] font-bold bg-rose-500 text-foreground rounded-full">
                  {pendingPermitsCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
