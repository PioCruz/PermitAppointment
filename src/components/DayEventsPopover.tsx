import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { CalendarEvent, CATEGORY_COLORS } from '../types';
import { cn } from '../lib/utils';

interface DayEventsPopoverProps {
  day: Date | null;
  events: CalendarEvent[];
  isOpen: boolean;
  onClose: () => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

export const DayEventsPopover: React.FC<DayEventsPopoverProps> = ({
  day,
  events,
  isOpen,
  onClose,
  onSelectEvent,
}) => {
  if (!day) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-sm bg-popover border border-border rounded-2xl shadow-2xl flex flex-col max-h-[85vh]"
          >
            <div className="px-5 pt-5 pb-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                <h3 className="text-sm font-bold text-foreground">
                  Events on {format(day, 'EEEE, MMMM d, yyyy')}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-foreground/5 rounded-full text-foreground/40 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 pt-1 pb-5 overflow-y-auto">
              <div className="space-y-2">
                {events.length === 0 ? (
                  <div className="py-8 text-center text-foreground/20 italic text-xs">
                    No events scheduled for this day
                  </div>
                ) : (
                  events.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => onSelectEvent(event)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left hover:scale-[1.02] active:scale-[0.98]",
                        CATEGORY_COLORS[event.category] || CATEGORY_COLORS.Other
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-current" />
                        <span className="text-sm font-bold text-foreground">{event.title}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-foreground/60">
                        {format(event.start, 'HH:mm')}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.div>

        </div>
      )}
    </AnimatePresence>
  );
};
