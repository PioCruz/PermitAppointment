import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Clock, Bell, AlertCircle, X } from 'lucide-react';
import { CalendarEvent, UserRole } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  events: CalendarEvent[];
  pendingPermitsCount: number;
  currentUser: UserRole;
  currentUserId: string | null;
  onSelectEvent: (event: CalendarEvent) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentDate, onDateSelect, events, pendingPermitsCount, currentUser, currentUserId, onSelectEvent }) => {
  const [viewDate, setViewDate] = useState(new Date(currentDate));

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // "Happening Now" only shows if the current user is listed as an attendee.
  // They can still see the event on the calendar — this is just the sidebar alert.
  const happeningNow = events.find(event => {
    const now = new Date();
    const isNow = now >= event.start && now <= event.end;
    if (!isNow) return false;
    // No attendees defined → treat as open to all (e.g. admin-created events without attendees)
    if (!event.attendees || event.attendees.length === 0) return true;
    return currentUserId ? event.attendees.includes(currentUserId) : false;
  });

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 sm:w-80 border-r border-border bg-background flex flex-col h-full transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:z-auto",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "overflow-y-hidden landscape:max-sm:overflow-y-auto lg:overflow-y-auto scrollbar-hide"
      )}>
        {/* Mobile Header in Sidebar for closing */}
        <div className="flex items-center justify-between p-4 lg:hidden border-b border-border">
          <span className="text-sm font-bold uppercase tracking-widest text-foreground/40">Calendar</span>
          <button onClick={onClose} className="p-2 hover:bg-foreground/5 rounded-lg text-foreground/60">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mini Calendar */}
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">{format(viewDate, 'MMMM yyyy')}</h3>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setViewDate(subMonths(viewDate, 1))}
              className="p-1.5 hover:bg-foreground/5 rounded-lg text-foreground/40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewDate(addMonths(viewDate, 1))}
              className="p-1.5 hover:bg-foreground/5 rounded-lg text-foreground/40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} className="text-[10px] font-bold text-foreground/20 text-center uppercase py-2">{d}</div>
          ))}
          {days.map((day, i) => {
            const isCurrentMonth = isSameMonth(day, viewDate);
            const isSelected = isSameDay(day, currentDate);
            
            return (
              <button
                key={i}
                onClick={() => onDateSelect(day)}
                className={cn(
                  "aspect-square flex items-center justify-center rounded-lg text-[11px] font-bold transition-all",
                  !isCurrentMonth && "text-foreground/10",
                  isCurrentMonth && !isSelected && "text-foreground/60 hover:bg-foreground/5",
                  isSelected && "bg-foreground text-background shadow-lg scale-110 z-10",
                  isToday(day) && !isSelected && "text-rose-500"
                )}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-6 py-4">
        <div className="h-px bg-foreground/5" />
      </div>

      {/* Notifications for Admin */}
      {currentUser === 'Admin' && pendingPermitsCount > 0 && (
        <div className="px-6 py-4">
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-rose-400">
              <Bell className="w-4 h-4 animate-bounce" />
              <span className="text-xs font-bold uppercase tracking-widest">Action Required</span>
            </div>
            <p className="text-sm text-foreground font-medium">
              You have {pendingPermitsCount} pending {pendingPermitsCount === 1 ? 'permit' : 'permits'} to review.
            </p>
          </div>
        </div>
      )}

      {/* Happening Now */}
      <div className="p-6 space-y-6">
        {happeningNow ? (
          <>
            <div className="flex items-center gap-2">
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                  boxShadow: [
                    "0 0 0px rgba(16,185,129,0)",
                    "0 0 15px rgba(16,185,129,0.8)",
                    "0 0 0px rgba(16,185,129,0)"
                  ]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-3 h-3 rounded-full bg-emerald-500" 
              />
              <h3 className="text-sm font-bold text-foreground">Happening now</h3>
            </div>

            <div 
              className="space-y-4 cursor-pointer group/happening hover:bg-foreground/[0.02] p-2 -m-2 rounded-xl transition-colors"
              onClick={() => onSelectEvent(happeningNow)}
            >
              <h4 className="text-lg font-bold text-foreground leading-tight group-hover/happening:text-indigo-400 transition-colors">{happeningNow.title}</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-foreground/40">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-medium">{format(happeningNow.start, 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2 text-foreground/40">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-medium">
                    {format(happeningNow.start, 'HH:mm')} - {format(happeningNow.end, 'HH:mm')}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="py-8 text-center border border-dashed border-border rounded-2xl">
            <p className="text-xs text-foreground/20 font-medium">No events active right now</p>
          </div>
        )}
      </div>
      </div>
    </>
  );
};
