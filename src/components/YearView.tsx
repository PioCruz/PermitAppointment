import React from 'react';
import { format, startOfYear, eachMonthOfInterval, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, isToday } from 'date-fns';
import { CalendarEvent, CalendarSettings } from '../types';
import { cn } from '../lib/utils';

interface YearViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  settings: CalendarSettings;
  onSelectDay: (day: Date) => void;
}

export const YearView: React.FC<YearViewProps> = ({ events, currentDate, settings, onSelectDay }) => {
  const yearStart = startOfYear(currentDate);
  const months = eachMonthOfInterval({
    start: yearStart,
    end: new Date(yearStart.getFullYear(), 11, 31),
  });

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(event.start, day));
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-background scrollbar-hide">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {months.map((month) => {
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(monthStart);
          const startDate = startOfWeek(monthStart);
          const endDate = endOfWeek(monthEnd);
          const days = eachDayOfInterval({ start: startDate, end: endDate });
          
          const monthEvents = events.filter(e => isSameMonth(e.start, month));
          const isCrowded = monthEvents.length > 10;

          return (
            <div key={month.toString()} className="space-y-4 p-4 rounded-2xl bg-card border border-border flex flex-col">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-foreground">{format(month, 'MMMM')}</h3>
                {monthEvents.length > 0 && (
                  <span className="text-[10px] font-bold text-foreground/40 bg-foreground/5 px-2 py-0.5 rounded-full">
                    {monthEvents.length}
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-7 gap-1 flex-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="text-[8px] font-bold text-foreground/20 text-center uppercase">{d}</div>
                ))}
                
                {days.map((day, i) => {
                  const isCurrentMonth = isSameMonth(day, month);
                  const dayEvents = getEventsForDay(day);
                  const hasEvents = dayEvents.length > 0;
                  const maxDots = isCrowded ? 1 : 2;

                  return (
                    <div 
                      key={i}
                      onClick={() => onSelectDay(day)}
                      className={cn(
                        "aspect-square flex flex-col items-center justify-center rounded-md relative cursor-pointer hover:bg-foreground/5 transition-colors",
                        !isCurrentMonth && "opacity-0 pointer-events-none"
                      )}
                    >
                      <span className={cn(
                        "text-[10px] font-bold",
                        isToday(day) ? "text-indigo-400" : "text-foreground/60",
                        !isCurrentMonth && "text-foreground/10"
                      )}>
                        {format(day, 'd')}
                      </span>
                      
                      {hasEvents && (
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {dayEvents.slice(0, maxDots).map((e, idx) => (
                            <div 
                              key={idx} 
                              className={cn(
                                "w-1 h-1 rounded-full",
                                e.color === 'blue' ? 'bg-blue-500' : 
                                e.color === 'orange' ? 'bg-orange-500' : 
                                e.color === 'green' ? 'bg-green-500' : 
                                e.color === 'red' ? 'bg-red-500' : 'bg-purple-500'
                              )}
                            />
                          ))}
                          {dayEvents.length > maxDots && (
                            <span className="text-[6px] font-bold text-foreground/40">
                              +{dayEvents.length - maxDots}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
