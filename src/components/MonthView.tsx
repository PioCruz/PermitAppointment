import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, isToday, isBefore } from 'date-fns';
import { CalendarEvent, CATEGORY_COLORS, CalendarSettings, UserRole } from '../types';
import { cn } from '../lib/utils';

import { toast } from 'sonner';

interface MonthViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  settings: CalendarSettings;
  onSelectEvent: (event: CalendarEvent) => void;
  onUpdateEvent: (event: CalendarEvent) => void;
  currentUser: UserRole;
  currentUserId: string | null;
}

/**
 * MonthView Component
 * Renders a standard 7-column calendar grid for a specific month.
 * Displays events as compact bars within each day cell.
 * Supports dragging events between days.
 */
export const MonthView: React.FC<MonthViewProps> = ({ events, currentDate, settings, onSelectEvent, onUpdateEvent, currentUser, currentUserId }) => {
  const timeFormat = settings.use24HourFormat ? 'HH:mm' : 'hh:mm a';
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(event.start, day));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetDay: Date) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('text/plain');
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    // Keep the same time, just change the date
    const duration = event.end.getTime() - event.start.getTime();
    
    const newStart = new Date(targetDay);
    newStart.setHours(event.start.getHours());
    newStart.setMinutes(event.start.getMinutes());
    newStart.setSeconds(event.start.getSeconds());
    
    if (isBefore(newStart, new Date())) {
      toast.error("Cannot schedule an event in the past.");
      return;
    }

    const newEnd = new Date(newStart.getTime() + duration);

    onUpdateEvent({
      ...event,
      start: newStart,
      end: newEnd
    });
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((day) => (
          <div key={day} className="py-2 text-center text-[10px] font-bold text-foreground/40 uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>
      
      <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto">
        {calendarDays.map((day, idx) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, monthStart);
          
          return (
            <div 
              key={idx} 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day)}
              onClick={() => {
                // Optional: trigger add event for this day
                // For now just add cursor-pointer to indicate it's a target
              }}
              className={cn(
                "min-h-[120px] p-2 border-r border-b border-border flex flex-col gap-1 transition-colors hover:bg-foreground/[0.02] cursor-pointer",
                !isCurrentMonth && "opacity-20"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full",
                  isToday(day) ? "bg-foreground text-background" : "text-foreground/60"
                )}>
                  {format(day, 'd')}
                </span>
              </div>
              
              <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] scrollbar-hide">
                {dayEvents.map((event) => {
                  const canModify = currentUser === 'Admin' || event.createdBy === currentUserId;
                  
                  return (
                    <div 
                      key={event.id}
                      draggable={canModify}
                      onDragStart={(e) => {
                        if (!canModify) return;
                        e.dataTransfer.setData('text/plain', event.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(event);
                      }}
                      className={cn(
                        "px-2 py-1 rounded text-[10px] font-bold truncate border flex items-center gap-1.5 hover:scale-[1.02] transition-transform active:opacity-50",
                        CATEGORY_COLORS[event.category] || CATEGORY_COLORS.Other,
                        canModify ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                      )}
                    >
                      {settings.useDotBadge && (
                        <div className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                      )}
                      <div className="flex items-center justify-between flex-1 min-w-0">
                        <span className="truncate">{event.title}</span>
                        <span className="opacity-60 ml-1 shrink-0">{format(event.start, timeFormat)}</span>
                      </div>
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] font-bold text-foreground/40 px-1">
                    {dayEvents.length - 3} more...
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
