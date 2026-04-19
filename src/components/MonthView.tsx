import React from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  startOfWeek,
  endOfWeek,
  isToday,
  isBefore,
  addDays,
  startOfDay,
  differenceInDays,
} from 'date-fns';
import { CalendarEvent, CATEGORY_COLORS, CalendarSettings, UserRole } from '../types';
import { cn } from '../lib/utils';

import { toast } from 'sonner';

interface MonthViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  settings: CalendarSettings;
  onSelectEvent: (event: CalendarEvent) => void;
  onUpdateEvent: (event: CalendarEvent) => void;
  onShowMore?: (day: Date) => void;
  currentUser: UserRole;
  currentUserId: string | null;
}

/**
 * Assigns each multi-day event a row index within a week so that
 * multiple spanning bars don't overlap each other.
 */
function assignMultiDayRows(
  events: CalendarEvent[]
): Map<string, number> {
  const sorted = [...events].sort((a, b) => {
    // Longer events first, then by start time
    const aDur = a.end.getTime() - a.start.getTime();
    const bDur = b.end.getTime() - b.start.getTime();
    return bDur - aDur || a.start.getTime() - b.start.getTime();
  });

  const rows: CalendarEvent[][] = [];
  const rowMap = new Map<string, number>();

  for (const event of sorted) {
    let row = 0;
    while (true) {
      if (!rows[row]) rows[row] = [];
      const conflicts = rows[row].some(
        other => event.start < other.end && event.end > other.start
      );
      if (!conflicts) {
        rows[row].push(event);
        rowMap.set(event.id, row);
        break;
      }
      row++;
    }
  }

  return rowMap;
}

/** Height of one multi-day bar row in pixels */
const MD_ROW_HEIGHT = 22;
/** Height of the date-number row at the top of each day cell */
const DATE_NUM_HEIGHT = 28;

/**
 * MonthView Component
 * Renders a standard 7-column calendar grid for a specific month.
 *
 * - Single-day events appear as compact bars within each day cell.
 * - Multi-day events span continuously across all the days they cover,
 *   rendered as absolute-positioned bars per week row (like Google Calendar).
 * - Supports dragging single-day events between days.
 */
export const MonthView: React.FC<MonthViewProps> = ({
  events,
  currentDate,
  settings,
  onSelectEvent,
  onUpdateEvent,
  onShowMore,
  currentUser,
  currentUserId,
}) => {
  const timeFormat = settings.use24HourFormat ? 'HH:mm' : 'hh:mm a';

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  // Split calendar days into weeks (rows of 7)
  const weeks: Date[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  // Separate multi-day events from single-day events
  const multiDayEvents = events.filter(e => !isSameDay(e.start, e.end));
  const singleDayEvents = events.filter(e => isSameDay(e.start, e.end));

  // ─── Drag handlers (single-day events only) ───────────────────────────────

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetDay: Date) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('text/plain');
    const event = events.find(ev => ev.id === eventId);
    if (!event) return;

    const duration = event.end.getTime() - event.start.getTime();

    const newStart = new Date(targetDay);
    newStart.setHours(event.start.getHours());
    newStart.setMinutes(event.start.getMinutes());
    newStart.setSeconds(event.start.getSeconds());

    if (isBefore(newStart, new Date())) {
      toast.error("Cannot schedule an event in the past.");
      return;
    }

    onUpdateEvent({ ...event, start: newStart, end: new Date(newStart.getTime() + duration) });
  };

  const weekDayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 border-b border-border shrink-0">
        {weekDayLabels.map(d => (
          <div key={d} className="py-2 text-center text-[10px] font-bold text-foreground/40 uppercase tracking-widest">
            {d}
          </div>
        ))}
      </div>

      {/* Week rows */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          display: 'grid',
          gridTemplateRows: `repeat(${weeks.length}, 1fr)`,
        }}
      >
        {weeks.map((week, weekIdx) => {
          const weekStart = startOfDay(week[0]);
          const weekSaturday = addDays(weekStart, 6); // last day of this week row

          // Multi-day events that overlap this week
          const weekMdEvents = multiDayEvents.filter(
            e => e.start < addDays(weekStart, 7) && e.end > weekStart
          );

          // Assign non-overlapping rows to multi-day bars
          const mdRowMap = assignMultiDayRows(weekMdEvents);
          const mdRowCount = weekMdEvents.length > 0
            ? Math.max(...weekMdEvents.map(e => mdRowMap.get(e.id)!)) + 1
            : 0;

          const multiDayAreaHeight = mdRowCount * MD_ROW_HEIGHT;

          return (
            <div
              key={weekIdx}
              className="relative grid grid-cols-7"
              style={{ minHeight: `${DATE_NUM_HEIGHT + multiDayAreaHeight + 60}px` }}
            >
              {/* ── Day cells ─────────────────────────────────────────────── */}
              {week.map((day, dayIdx) => {
                const daySingleEvents = singleDayEvents.filter(e => isSameDay(e.start, day));
                const isCurrentMonth = isSameMonth(day, monthStart);

                return (
                  <div
                    key={dayIdx}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, day)}
                    className={cn(
                      'border-r border-b border-border flex flex-col transition-colors hover:bg-foreground/[0.02]',
                      !isCurrentMonth && 'opacity-20'
                    )}
                  >
                    {/* Date number */}
                    <div
                      className="flex items-center px-1.5 shrink-0"
                      style={{ height: `${DATE_NUM_HEIGHT}px` }}
                    >
                      <span
                        className={cn(
                          'text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full',
                          isToday(day)
                            ? 'bg-foreground text-background'
                            : 'text-foreground/60'
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                    </div>

                    {/* Reserved space so multi-day bars don't cover single-day events */}
                    <div style={{ height: `${multiDayAreaHeight}px`, flexShrink: 0 }} />

                    {/* Single-day events */}
                    <div className="flex-1 px-1 pb-1 flex flex-col gap-0.5 overflow-visible">
                      {daySingleEvents.slice(0, 3).map(event => {
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
                            onClick={(e) => { e.stopPropagation(); onSelectEvent(event); }}
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-bold truncate border flex items-center gap-1 hover:scale-[1.02] transition-transform active:opacity-50',
                              CATEGORY_COLORS[event.category] || CATEGORY_COLORS.Other,
                              canModify ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                            )}
                          >
                            <span className="truncate">{event.title}</span>
                            <span className="opacity-60 ml-auto shrink-0 text-[9px]">
                              {format(event.start, timeFormat)}
                            </span>
                          </div>
                        );
                      })}
                      {daySingleEvents.length > 3 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onShowMore?.(day); }}
                          className="text-[10px] font-bold text-foreground/40 px-0.5 text-left hover:text-foreground/70 transition-colors"
                        >
                          +{daySingleEvents.length - 3} more
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* ── Multi-day spanning bars ────────────────────────────────── */}
              {weekMdEvents.map(event => {
                const row = mdRowMap.get(event.id) ?? 0;
                const canModify = currentUser === 'Admin' || event.createdBy === currentUserId;

                // "Effective end day" — if an event ends exactly at midnight we don't
                // count that calendar day (e.g. an event ending at 2024-01-08T00:00
                // visually ends on Jan 7).
                const rawEndDay = startOfDay(event.end);
                const effectiveEndDay =
                  event.end.getTime() === rawEndDay.getTime()
                    ? addDays(rawEndDay, -1)
                    : rawEndDay;

                // Clamp to this week's boundaries
                const clampedStartDay = startOfDay(event.start) >= weekStart
                  ? startOfDay(event.start)
                  : weekStart;
                const clampedEndDay = effectiveEndDay <= weekSaturday
                  ? effectiveEndDay
                  : weekSaturday;

                const startCol = differenceInDays(clampedStartDay, weekStart); // 0–6
                const span = differenceInDays(clampedEndDay, clampedStartDay) + 1; // 1–7

                const startsThisWeek = startOfDay(event.start) >= weekStart;
                const endsThisWeek = effectiveEndDay <= weekSaturday;

                const top = DATE_NUM_HEIGHT + row * MD_ROW_HEIGHT + 2;

                return (
                  <div
                    key={event.id}
                    onClick={(e) => { e.stopPropagation(); onSelectEvent(event); }}
                    title={event.title}
                    className={cn(
                      'absolute flex items-center text-[10px] font-bold px-2 border-y z-10 cursor-pointer hover:brightness-110 transition-all overflow-hidden',
                      CATEGORY_COLORS[event.category] || CATEGORY_COLORS.Other,
                      startsThisWeek ? 'border-l rounded-l' : 'border-l-0 pl-1',
                      endsThisWeek ? 'border-r rounded-r' : 'border-r-0 pr-0',
                      canModify ? 'cursor-pointer' : 'cursor-pointer'
                    )}
                    style={{
                      top: `${top}px`,
                      height: `${MD_ROW_HEIGHT - 4}px`,
                      left: `calc(${(startCol / 7) * 100}% + 2px)`,
                      width: `calc(${(span / 7) * 100}% - 4px)`,
                    }}
                  >
                    {/* Title + start time. Show full opacity when the event starts this week. */}
                    <span className={cn('truncate flex-1 min-w-0', !startsThisWeek && 'opacity-70')}>
                      {event.title}
                    </span>
                    {startsThisWeek && (
                      <span className="opacity-60 shrink-0 ml-1.5 font-mono text-[9px]">
                        {format(event.start, timeFormat)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
