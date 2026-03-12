import React, { useState, useEffect } from 'react';
import { format, startOfDay, eachHourOfInterval, addHours, isSameDay, setMinutes, setHours, differenceInSeconds, isBefore } from 'date-fns';
import { CalendarEvent, CATEGORY_COLORS, CalendarSettings, UserRole } from '../types';
import { cn } from '../lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { toast } from 'sonner';

interface DayViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  settings: CalendarSettings;
  onSelectEvent: (event: CalendarEvent) => void;
  onUpdateEvent: (event: CalendarEvent) => void;
  currentUser: UserRole;
  currentUserId: string | null;
}

/**
 * DayView Component
 * Renders a detailed 24-hour vertical timeline for a single day.
 * Supports drag-and-drop for rescheduling events and displays a real-time current time indicator.
 */
export const DayView: React.FC<DayViewProps> = ({ events, currentDate, settings, onSelectEvent, onUpdateEvent, currentUser, currentUserId }) => {
  const [now, setNow] = useState(new Date());
  const gridRef = React.useRef<HTMLDivElement>(null);
  const timeFormat = settings.use24HourFormat ? 'HH:mm' : 'hh:mm a';

  // Update the current time every second to keep the indicator perfectly accurate
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Generate 48 half-hour intervals for the 24-hour grid
  const intervals = Array.from({ length: 48 }).map((_, i) => {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    return setMinutes(setHours(startOfDay(currentDate), hour), minute);
  });

  // Filter events that occur on the currently viewed day
  const dayEvents = events.filter(event => isSameDay(event.start, currentDate));

  const isToday = isSameDay(currentDate, new Date());
  
  /**
   * Calculate the vertical position of the current time indicator.
   * We use the difference in seconds from the start of the day for maximum precision.
   * 2 pixels per minute (since the grid is 2880px high for 1440 minutes in a day).
   */
  const startOfToday = startOfDay(now);
  const currentTimePosition = (differenceInSeconds(now, startOfToday) / 60) * 2;

  /**
   * Handles the drag-over event to allow dropping.
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  /**
   * Handles dropping an event onto the grid to reschedule it.
   * Calculates the new start time based on the drop Y-coordinate.
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!gridRef.current) return;

    const eventData = e.dataTransfer.getData('application/json');
    if (!eventData) return;

    const { id, offsetTop } = JSON.parse(eventData);
    const event = events.find(e => e.id === id);
    if (!event) return;

    const rect = gridRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    // Calculate new start time in minutes from midnight
    // We divide by 2 because our grid is 2px per minute
    const totalMinutes = Math.max(0, Math.min(1440, (y - offsetTop) / 2));
    
    // Snap to 15-minute intervals for a cleaner user experience
    const snappedMinutes = Math.round(totalMinutes / 15) * 15;
    
    const newStart = setMinutes(setHours(startOfDay(currentDate), 0), snappedMinutes);
    
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
    <div className="flex-1 flex bg-background overflow-hidden">
      {/* Timeline */}
      <div className="flex-1 flex flex-col overflow-y-auto border-r border-border scrollbar-hide">
        <div className="sticky top-0 z-30 bg-background border-b border-border py-2 text-center">
          <span className="text-xs font-bold text-foreground uppercase tracking-widest">
            {format(currentDate, 'eee d')}
          </span>
        </div>
        
        {/* Fixed height container for absolute coordinate system */}
        <div 
          ref={gridRef}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="relative w-full h-[2880px] group/grid"
        >
          {/* Time Labels and Grid Lines */}
          {intervals.map((time, i) => (
            <div 
              key={time.toString()} 
              className="absolute left-0 right-0 h-[60px]"
              style={{ top: `${i * 60}px` }}
            >
              {/* Hour Label (only on the hour) */}
              {i % 2 === 0 && (
                <div className="absolute top-0 left-4 w-10 text-[10px] font-bold text-foreground/40 z-10 -translate-y-1/2">
                  {format(time, timeFormat)}
                </div>
              )}
              
              {/* Grid Lines */}
              <div className={cn(
                "ml-16 h-full border-b relative group/slot hover:bg-foreground/[0.03] transition-colors cursor-pointer",
                i % 2 === 0 
                  ? "border-dashed border-border" // This line is at :30
                  : "border-solid border-border"  // This line is at :00 (next hour)
              )}>
              </div>
            </div>
          ))}

          {/* Current Time Indicator */}
          {isToday && (
            <div 
              className="absolute left-0 right-0 z-40 pointer-events-none flex items-center -translate-y-1/2"
              style={{ top: `${currentTimePosition}px` }}
            >
              <div className="w-16 flex justify-end pr-2">
                <span className="text-[10px] font-bold text-red-500 bg-background px-1 tabular-nums">
                  {format(now, timeFormat)}
                </span>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.25 shadow-[0_0_12px_rgba(239,68,68,0.8)]"></div>
              <div className="flex-1 h-[1.5px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
            </div>
          )}

          {/* Events Overlay */}
          {dayEvents.map((event) => {
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
                  "absolute left-20 right-4 rounded-lg border px-3 py-2 flex flex-col justify-center gap-0.5 overflow-hidden shadow-xl transition-all hover:scale-[1.005] hover:z-10 active:opacity-50",
                  CATEGORY_COLORS[event.category] || CATEGORY_COLORS.Other,
                  canModify ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                )}
                style={{ top: `${top}px`, height: `${height}px` }}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold truncate">{event.title}</h4>
                  <span className="text-[10px] font-mono opacity-60">{format(event.start, timeFormat)}</span>
                </div>
                <p className="text-xs opacity-60 line-clamp-2">{event.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
