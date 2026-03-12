import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, eachDayOfInterval, eachHourOfInterval, startOfDay, addHours, isSameDay, setMinutes, setHours, differenceInSeconds, isBefore } from 'date-fns';
import { CalendarEvent, CATEGORY_COLORS, CalendarSettings, UserRole } from '../types';
import { cn } from '../lib/utils';

import { toast } from 'sonner';

interface WeekViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  settings: CalendarSettings;
  onSelectEvent: (event: CalendarEvent) => void;
  onUpdateEvent: (event: CalendarEvent) => void;
  currentUser: UserRole;
  currentUserId: string | null;
}

/**
 * WeekView Component
 * Renders a 7-day grid with a vertical timeline for each day.
 * Supports dragging events between days and times.
 */
export const WeekView: React.FC<WeekViewProps> = ({ events, currentDate, settings, onSelectEvent, onUpdateEvent, currentUser, currentUserId }) => {
  const [now, setNow] = useState(new Date());
  const timeFormat = settings.use24HourFormat ? 'HH:mm' : 'hh:mm a';

  // Keep the current time indicator updated
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const startDate = startOfWeek(currentDate);
  const endDate = addDays(startDate, 6);
  const weekDays = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Create the vertical time slots (30-minute intervals)
  const intervals = Array.from({ length: 48 }).map((_, i) => {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    return setMinutes(setHours(startOfDay(currentDate), hour), minute);
  });

  /**
   * Calculate the vertical position of the current time indicator.
   * 2 pixels per minute.
   */
  const currentTimePosition = ((now.getHours() * 60) + now.getMinutes() + (now.getSeconds() / 60)) * 2;

  /**
   * Handles the drag-over event to allow dropping.
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  /**
   * Handles dropping an event onto a specific day column.
   */
  const handleDrop = (e: React.DragEvent, targetDay: Date) => {
    e.preventDefault();
    const eventData = e.dataTransfer.getData('application/json');
    if (!eventData) return;

    const { id, offsetTop } = JSON.parse(eventData);
    const event = events.find(e => e.id === id);
    if (!event) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    // Calculate new start time in minutes from midnight (2px per minute)
    const totalMinutes = Math.max(0, Math.min(1440, (y - offsetTop) / 2));
    const snappedMinutes = Math.round(totalMinutes / 15) * 15;
    
    const newStart = setMinutes(setHours(startOfDay(targetDay), 0), snappedMinutes);
    
    if (isBefore(newStart, new Date())) {
      toast.error("Cannot schedule an event in the past.");
      return;
    }

    const duration = event.end.getTime() - event.start.getTime();
    const newEnd = new Date(newStart.getTime() + duration);

    onUpdateEvent({
      ...event,
      start: newStart,
      end: newEnd
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
        <div className="border-r border-border"></div>
        {weekDays.map((day) => (
          <div key={day.toString()} className="py-3 text-center border-r border-border last:border-r-0">
            <div className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">{format(day, 'eee')}</div>
            <div className="text-sm font-bold text-foreground mt-0.5">{format(day, 'd')}</div>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto relative scrollbar-hide">
        <div className="relative w-full h-[2880px] grid grid-cols-[60px_repeat(7,1fr)] group/grid">
          {/* Time column */}
          <div className="border-r border-border relative">
            {intervals.map((time, i) => (
              <div 
                key={time.toString()} 
                className="absolute left-0 right-0 h-[60px]"
                style={{ top: `${i * 60}px` }}
              >
                {i % 2 === 0 && (
                  <span className="absolute -top-2.5 left-0 right-0 text-center text-[10px] font-bold text-foreground/20 z-10">
                    {format(time, timeFormat)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIndex) => (
            <div 
              key={day.toString()} 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day)}
              className="relative border-r border-border last:border-r-0 group/col"
            >
              {intervals.map((time, i) => (
                <div 
                  key={time.toString()} 
                  className={cn(
                    "absolute left-0 right-0 h-[60px] border-b hover:bg-foreground/[0.03] transition-colors cursor-pointer",
                    i % 2 === 0 
                      ? "border-dashed border-border" // This line is at :30
                      : "border-solid border-border"  // This line is at :00 (next hour)
                  )}
                  style={{ top: `${i * 60}px` }}
                >
                </div>
              ))}

              {/* Current Time Indicator for this day */}
              {isSameDay(day, now) && (
                <div 
                  className="absolute left-0 right-0 z-40 pointer-events-none flex items-center -translate-y-1/2"
                  style={{ top: `${currentTimePosition}px` }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.25 shadow-[0_0_12px_rgba(239,68,68,0.8)]"></div>
                  <div className="flex-1 h-[1.5px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                </div>
              )}

              {/* Events for this day */}
              {events
                .filter((event) => isSameDay(event.start, day))
                .map((event) => {
                  const startHour = event.start.getHours();
                  const startMin = event.start.getMinutes();
                  const durationMin = (event.end.getTime() - event.start.getTime()) / (1000 * 60);
                  
                  const top = ((startHour * 60) + startMin) * 2;
                  let height = Math.max(durationMin * 2, 40);
                  
                  if (top + height > 2880) {
                    height = 2880 - top;
                  }

                  const canModify = currentUser === 'Admin' || event.createdBy === currentUserId;

                  return (
                    <div 
                      key={event.id}
                      draggable={canModify}
                      onDragStart={(e) => {
                        if (!canModify) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const offsetTop = e.clientY - rect.top;
                        e.dataTransfer.setData('application/json', JSON.stringify({ id: event.id, offsetTop }));
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onClick={() => onSelectEvent(event)}
                      className={cn(
                        "absolute left-1 right-1 rounded-md border px-1.5 py-1 flex flex-col justify-center gap-0.5 overflow-hidden shadow-lg z-10 transition-all hover:z-20 hover:scale-[1.02] active:opacity-50",
                        CATEGORY_COLORS[event.category] || CATEGORY_COLORS.Other,
                        canModify ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                      )}
                      style={{ top: `${top}px`, height: `${height}px` }}
                    >
                      <h4 className="text-[10px] font-bold truncate leading-tight">{event.title}</h4>
                      <span className="text-[9px] font-mono opacity-60">{format(event.start, timeFormat)}</span>
                    </div>
                  );
                })}
            </div>
          ))}

          {/* Global Current Time Label (only if today is in view) */}
          {weekDays.some(day => isSameDay(day, now)) && (
            <div 
              className="absolute left-0 w-[60px] z-50 pointer-events-none flex justify-end pr-2 -translate-y-1/2"
              style={{ top: `${currentTimePosition}px` }}
            >
              <span className="text-[10px] font-bold text-red-500 bg-background px-1 tabular-nums">
                {format(now, timeFormat)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
