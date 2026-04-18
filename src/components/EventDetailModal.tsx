import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Calendar, Clock, AlignLeft } from 'lucide-react';
import { format } from 'date-fns';
import { CalendarEvent, UserRole, MemberProfile } from '../types';
import { cn } from '../lib/utils';
import { Lock, AlertTriangle, Users } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';

interface EventDetailModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
  currentUser: UserRole;
  members: MemberProfile[];
  currentUserId: string | null;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  currentUser,
  members,
  currentUserId,
}) => {
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = React.useState(false);

  if (!event) return null;

  const canModify = currentUser === 'Admin' || event.createdBy === currentUserId;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-[95%] max-w-md bg-popover border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-4 sm:p-6 border-b border-border/10 flex items-center justify-between shrink-0">
                <h2 className="text-lg sm:text-xl font-bold text-foreground truncate mr-4">{event.title}</h2>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-foreground/5 rounded-full text-foreground/40 transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto scrollbar-hide">
                <div className="space-y-4 sm:space-y-6 text-foreground">
                  {/* Start Date */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-foreground/5 text-foreground/40 shrink-0">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] sm:text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-0.5">Start Date</p>
                      <p className="text-xs sm:text-sm text-foreground font-medium truncate">
                        {format(event.start, 'EEEE dd MMMM')} at {format(event.start, 'HH:mm')}
                      </p>
                    </div>
                  </div>

                  {/* End Date */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-foreground/5 text-foreground/40 shrink-0">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] sm:text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-0.5">End Date</p>
                      <p className="text-xs sm:text-sm text-foreground font-medium truncate">
                        {format(event.end, 'EEEE dd MMMM')} at {format(event.end, 'HH:mm')}
                      </p>
                    </div>
                  </div>

                  {/* Created By */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-foreground/5 text-foreground/40 shrink-0">
                      <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] sm:text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-0.5">Created By</p>
                      <p className="text-xs sm:text-sm text-foreground font-medium truncate">
                        {members.find(m => m.id === event.createdBy)?.name || event.createdBy}
                      </p>
                    </div>
                  </div>

                  {/* Attendees */}
                  {event.attendees && event.attendees.length > 0 && (
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-foreground/5 text-foreground/40 shrink-0">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] sm:text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-2">Attendees</p>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {event.attendees.map(id => {
                            const member = members.find(m => m.id === id);
                            if (!member) return null;
                            return (
                              <div key={id} className="flex items-center gap-1.5 bg-foreground/5 px-2 py-0.5 sm:py-1 rounded-md border border-border/50">
                                {member.pictureUrl ? (
                                  <img src={member.pictureUrl} alt={member.name} className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full object-cover" />
                                ) : (
                                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center text-[7px] sm:text-[8px] font-bold text-foreground" style={{ backgroundColor: member.color }}>
                                    {member.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="text-[10px] sm:text-xs text-foreground/80">{member.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-foreground/5 text-foreground/40 shrink-0">
                      <AlignLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] sm:text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-1">Description</p>
                      <p className="text-xs sm:text-sm text-foreground/60 leading-relaxed max-h-32 overflow-y-auto">
                        {event.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 shrink-0 border-t border-border/10">
                  {canModify ? (
                    <>
                      <button
                        onClick={() => onEdit(event)}
                        className="flex-1 sm:flex-none px-4 py-2 sm:px-6 sm:py-2.5 bg-card border border-border text-foreground rounded-xl text-xs sm:text-sm font-bold hover:bg-foreground/5 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setIsConfirmDeleteOpen(true)}
                        className="flex-1 sm:flex-none px-4 py-2 sm:px-6 sm:py-2.5 bg-destructive text-foreground rounded-xl text-xs sm:text-sm font-bold hover:bg-destructive/90 transition-colors"
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-foreground/5 border border-border rounded-xl text-foreground/40">
                      <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">Read Only</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={() => {
          onDelete(event.id);
          onClose();
        }}
        title="Delete Event"
        message={`Are you sure you want to delete "${event.title}"? This action cannot be undone.`}
        confirmLabel="Delete Event"
        variant="danger"
      />
    </>
  );
};
