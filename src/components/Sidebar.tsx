import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Clock, Bell, AlertCircle } from 'lucide-react';
import { CalendarEvent, UserRole } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface SidebarProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  events: CalendarEvent[];
  pendingPermitsCount: number;
  currentUser: UserRole;
  onSelectEvent: (event: CalendarEvent) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentDate, onDateSelect, events, pendingPermitsCount, currentUser, onSelectEvent }) => {
  const [viewDate, setViewDate] = useState(new Date(currentDate));

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const happeningNow = events.find(event => {
    const now = new Date();
    return now >= event.start && now <= event.end;
  });

  return (
    <div className="w-80 border-r border-border bg-background flex flex-col h-full overflow-y-auto scrollbar-hide">
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
  );
};
