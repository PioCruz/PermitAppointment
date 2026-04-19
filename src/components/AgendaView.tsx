import React from 'react';
import { format, isSameDay, startOfDay, isSameMonth, isBefore } from 'date-fns';
import { Search } from 'lucide-react';
import { CalendarEvent, CATEGORY_COLORS, CalendarSettings, UserRole } from '../types';
import { cn } from '../lib/utils';

import { toast } from 'sonner';

interface AgendaViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  settings: CalendarSettings;
  onSelectEvent: (event: CalendarEvent) => void;
  onUpdateEvent: (event: CalendarEvent) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentUser: UserRole;
  currentUserId: string | null;
}

/**
 * AgendaView Component
 * Renders a list of events grouped by date or category.
 * Supports drag-and-drop for rescheduling events between dates.
 */
export const AgendaView: React.FC<AgendaViewProps> = ({ events, currentDate, settings, onSelectEvent, onUpdateEvent, searchQuery, setSearchQuery, currentUser, currentUserId }) => {
  const timeFormat = settings.use24HourFormat ? 'HH:mm' : 'hh:mm a';

  // Filter events to current month AND search query
  const filteredEvents = events.filter(e => {
    const matchesMonth = isSameMonth(e.start, currentDate);
    const matchesSearch = 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesMonth && matchesSearch;
  });

  // Group events based on settings
  const groupedEvents = filteredEvents.reduce((acc, event) => {
    let key = '';
    if (settings.agendaGroupBy === 'Date') {
      key = format(startOfDay(event.start), 'yyyy-MM-dd');
    } else {
      key = event.category;
    }

    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  const sortedKeys = Object.keys(groupedEvents).sort((a, b) => {
    if (settings.agendaGroupBy === 'Date') return a.localeCompare(b);
    return a.localeCompare(b);
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    if (settings.agendaGroupBy !== 'Date') return;

    const eventId = e.dataTransfer.getData('text/plain');
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const targetDate = new Date(targetKey);
    const duration = event.end.getTime() - event.start.getTime();
    
    const newStart = new Date(targetDate);
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

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-8 bg-background scrollbar-hide">
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20" />
        <input
          id="agenda-search"
          name="agenda-search"
          aria-label="Search events"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Type a command or search..."
          className="w-full bg-card border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-border transition-colors"
        />
      </div>
      {sortedKeys.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-foreground/20">
          <p className="text-lg font-medium">No events scheduled</p>
        </div>
      ) : (
        sortedKeys.map((key) => {
          const label = settings.agendaGroupBy === 'Date' 
            ? format(new Date(key), 'EEEE, MMMM d, yyyy')
            : key;

          return (
            <div 
              key={key} 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, key)}
              className="space-y-3"
            >
              <h3 className="text-xs font-bold text-foreground/40 uppercase tracking-widest px-1">
                {label}
              </h3>
              <div className="space-y-2">
                {groupedEvents[key].map((event) => {
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
                      onClick={() => onSelectEvent(event)}
                      className={cn(
                        "group relative flex items-center justify-between p-4 rounded-xl border transition-all hover:scale-[1.01] active:scale-[0.99] active:opacity-50",
                        CATEGORY_COLORS[event.category] || CATEGORY_COLORS.Other,
                        canModify ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-background/20 flex items-center justify-center text-xs font-bold border border-border">
                          {event.title.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground group-hover:underline decoration-white/30 underline-offset-4">{event.title}</h4>
                          <p className="text-xs text-foreground/60 mt-0.5">{event.description}</p>
                        </div>
                      </div>
                      <div className="text-xs font-mono font-bold text-foreground/80">
                        {format(event.start, timeFormat)} - {format(event.end, timeFormat)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
