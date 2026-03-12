import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Circle, Clock, Check } from 'lucide-react';
import { CalendarSettings } from '../types';
import { cn } from '../lib/utils';
import { useTheme } from 'next-themes';

interface SettingsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CalendarSettings;
  onUpdateSettings: (settings: Partial<CalendarSettings>) => void;
}

export const SettingsPopover: React.FC<SettingsPopoverProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed right-4 top-20 w-64 bg-popover border border-border rounded-xl shadow-2xl z-[101] overflow-hidden"
          >
            <div className="p-4 space-y-6">
              <h2 className="text-sm font-bold text-foreground">Calendar settings</h2>
              
              <div className="space-y-4">
                {/* Dark Mode Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground/80">Use dark mode</span>
                  <button
                    onClick={() => {
                      setTheme(isDark ? 'light' : 'dark');
                      onUpdateSettings({ darkMode: !isDark });
                    }}
                    className={cn(
                      "relative w-12 h-6 rounded-full transition-colors flex items-center px-1",
                      isDark ? "bg-foreground" : "bg-foreground/10"
                    )}
                  >
                    <motion.div
                      animate={{ x: isDark ? 24 : 0 }}
                      className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center transition-colors",
                        isDark ? "bg-background" : "bg-foreground/40"
                      )}
                    >
                      <Moon className={cn("w-2.5 h-2.5", isDark ? "text-foreground" : "text-background")} />
                    </motion.div>
                  </button>
                </div>

                {/* Show Personal Events Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground/80">Show personal events</span>
                  <button
                    onClick={() => onUpdateSettings({ showPersonalEvents: !settings.showPersonalEvents })}
                    className={cn(
                      "relative w-12 h-6 rounded-full transition-colors flex items-center px-1",
                      settings.showPersonalEvents ? "bg-foreground" : "bg-foreground/10"
                    )}
                  >
                    <motion.div
                      animate={{ x: settings.showPersonalEvents ? 24 : 0 }}
                      className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center transition-colors",
                        settings.showPersonalEvents ? "bg-background" : "bg-foreground/40"
                      )}
                    >
                      <Check className={cn("w-2.5 h-2.5", settings.showPersonalEvents ? "text-foreground" : "text-background")} />
                    </motion.div>
                  </button>
                </div>

                {/* 24 Hour Format Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground/80">Use 24 hour format</span>
                  <button
                    onClick={() => onUpdateSettings({ use24HourFormat: !settings.use24HourFormat })}
                    className={cn(
                      "relative w-12 h-6 rounded-full transition-colors flex items-center px-1",
                      settings.use24HourFormat ? "bg-foreground" : "bg-foreground/10"
                    )}
                  >
                    <motion.div
                      animate={{ x: settings.use24HourFormat ? 24 : 0 }}
                      className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center transition-colors",
                        settings.use24HourFormat ? "bg-background" : "bg-foreground/40"
                      )}
                    >
                      <span className={cn("text-[8px] font-bold", settings.use24HourFormat ? "text-foreground" : "text-background")}>24</span>
                    </motion.div>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-3">
                <h3 className="text-sm font-bold text-foreground">Agenda view group by</h3>
                <div className="space-y-2">
                  {(['Date', 'Color'] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => onUpdateSettings({ agendaGroupBy: option })}
                      className="flex items-center gap-3 w-full group"
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                        settings.agendaGroupBy === option 
                          ? "border-border bg-foreground" 
                          : "border-border group-hover:border-border"
                      )}>
                        {settings.agendaGroupBy === option && (
                          <div className="w-1.5 h-1.5 rounded-full bg-background" />
                        )}
                      </div>
                      <span className={cn(
                        "text-sm transition-colors",
                        settings.agendaGroupBy === option ? "text-foreground" : "text-foreground/40 group-hover:text-foreground/60"
                      )}>
                        {option}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
