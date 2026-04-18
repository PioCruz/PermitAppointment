import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, Tag, AlignLeft, ChevronDown, User } from 'lucide-react';
import { format, isBefore } from 'date-fns';
import { CalendarEvent, UserRole, MemberProfile } from '../types';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (event: CalendarEvent) => void;
  initialEvent?: CalendarEvent | null;
  currentUser: UserRole;
  currentUserId: string | null;
  activeGroupId: string | null;
  members: MemberProfile[];
}

const VARIANTS = [
  { name: 'blue', color: 'bg-blue-500', category: 'Meeting' },
  { name: 'purple', color: 'bg-purple-500', category: 'Personal' },
  { name: 'emerald', color: 'bg-emerald-500', category: 'Work' },
  { name: 'rose', color: 'bg-rose-500', category: 'Urgent' },
  { name: 'amber', color: 'bg-amber-500', category: 'Other' },
];

export const AddEventModal: React.FC<AddEventModalProps> = ({ isOpen, onClose, onAdd, initialEvent, currentUser, currentUserId, activeGroupId, members }) => {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [endDate, setEndDate] = useState(format(new Date(Date.now() + 30 * 60000), "yyyy-MM-dd'T'HH:mm"));
  const [variant, setVariant] = useState(VARIANTS[0]);
  const [description, setDescription] = useState('');
  const [attendees, setAttendees] = useState<string[]>([]);
  const [isAttendeesOpen, setIsAttendeesOpen] = useState(false);
  const [isVariantOpen, setIsVariantOpen] = useState(false);

  useEffect(() => {
    if (initialEvent) {
      setTitle(initialEvent.title);
      setStartDate(format(initialEvent.start, "yyyy-MM-dd'T'HH:mm"));
      setEndDate(format(initialEvent.end, "yyyy-MM-dd'T'HH:mm"));
      setVariant(VARIANTS.find(v => v.name === initialEvent.color) || VARIANTS[0]);
      setDescription(initialEvent.description || '');
      setAttendees(initialEvent.attendees || []);
    } else {
      setTitle('');
      setStartDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      setEndDate(format(new Date(Date.now() + 30 * 60000), "yyyy-MM-dd'T'HH:mm"));
      setVariant(VARIANTS[0]);
      setDescription('');
      setAttendees([]);
    }
  }, [initialEvent, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !activeGroupId) return;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isBefore(start, new Date()) && !initialEvent) {
      toast.error("Cannot schedule an event in the past.");
      return;
    }

    if (isBefore(end, start)) {
      toast.error("End time cannot be before start time.");
      return;
    }

    const newEvent: CalendarEvent = {
      id: initialEvent?.id || Math.random().toString(36).substr(2, 9),
      groupId: activeGroupId,
      title,
      start,
      end,
      description,
      category: variant.category,
      color: variant.name,
      attendees,
      createdBy: initialEvent?.createdBy || currentUserId || currentUser,
      ...(initialEvent?._userId ? { _userId: initialEvent._userId } : {}),
    };

    onAdd(newEvent);
    onClose();
  };

  const rowsOnMobile = typeof window !== 'undefined' && window.innerWidth < 640 ? 2 : 3;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-md bg-popover border border-border rounded-2xl shadow-2xl z-[101] flex flex-col max-h-[90vh]"
          >
            <div className="p-4 sm:p-6 border-b border-border/5 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground leading-none">{initialEvent ? 'Edit Event' : 'Add New Event'}</h2>
                <p className="text-[11px] sm:text-sm text-foreground/40 mt-1">{initialEvent ? 'Modify your existing event.' : 'Create a new event for your calendar.'}</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-foreground/5 rounded-full text-foreground/40 hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto scrollbar-hide">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center gap-2 text-foreground/60 h-4">
                    <Tag className="w-3 h-3" />
                    <label className="text-[10px] font-bold uppercase tracking-wider leading-none">Title</label>
                  </div>
                  <input
                    autoFocus
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a title"
                    className="w-full bg-card border border-border rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-border transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center gap-2 text-foreground/60 h-4">
                      <Calendar className="w-3 h-3" />
                      <label className="text-[10px] font-bold uppercase tracking-wider leading-none">Start Date</label>
                    </div>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-card border border-border rounded-xl px-4 py-2.5 sm:py-3 text-sm text-foreground focus:outline-none focus:border-border transition-colors [color-scheme:dark]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center gap-2 text-foreground/60 h-4">
                      <Clock className="w-3 h-3" />
                      <label className="text-[10px] font-bold uppercase tracking-wider leading-none">End Date</label>
                    </div>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-card border border-border rounded-xl px-4 py-2.5 sm:py-3 text-sm text-foreground focus:outline-none focus:border-border transition-colors [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5 sm:space-y-2 relative">
                    <div className="flex items-center gap-2 text-foreground/60 h-4">
                      <User className="w-3 h-3" />
                      <label className="text-[10px] font-bold uppercase tracking-wider leading-none">Attendees</label>
                    </div>
                    <div 
                      className="w-full bg-card border border-border rounded-xl px-4 py-2.5 sm:py-3 text-sm text-foreground focus-within:border-border transition-colors cursor-pointer min-h-[44px] sm:min-h-[48px] flex flex-wrap gap-2 items-center"
                      onClick={() => setIsAttendeesOpen(!isAttendeesOpen)}
                    >
                      {attendees.length === 0 ? (
                        <span className="text-foreground/20">Select attendees...</span>
                      ) : (
                        attendees.map(id => {
                          const member = members.find(m => m.id === id);
                          return member ? (
                            <span key={id} className="bg-foreground/10 text-foreground text-xs px-2 py-1 rounded-md flex items-center gap-1">
                              {member.name}
                              <button 
                                type="button" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAttendees(attendees.filter(a => a !== id));
                                }}
                                className="hover:text-rose-400"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ) : null;
                        })
                      )}
                      <ChevronDown className={cn("w-4 h-4 text-foreground/20 ml-auto transition-transform", isAttendeesOpen && "rotate-180")} />
                    </div>
                    
                    <AnimatePresence>
                      {isAttendeesOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsAttendeesOpen(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto"
                          >
                            {members.length === 0 ? (
                              <div className="p-3 text-sm text-foreground/40 text-center">No members in this group</div>
                            ) : (
                              <div className="p-1">
                                {members.map(member => {
                                  const isSelected = attendees.includes(member.id);
                                  return (
                                    <button
                                      key={member.id}
                                      type="button"
                                      onClick={() => {
                                        if (isSelected) {
                                          setAttendees(attendees.filter(id => id !== member.id));
                                        } else {
                                          setAttendees([...attendees, member.id]);
                                        }
                                      }}
                                      className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm text-foreground hover:bg-foreground/5 transition-colors"
                                    >
                                      <div className="flex items-center gap-2">
                                        {member.pictureUrl ? (
                                          <img src={member.pictureUrl} alt={member.name} className="w-5 h-5 rounded-full object-cover" />
                                        ) : (
                                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-foreground" style={{ backgroundColor: member.color }}>
                                            {member.name.charAt(0).toUpperCase()}
                                          </div>
                                        )}
                                        {member.name}
                                      </div>
                                      {isSelected && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Personal Event</label>
                    <button
                      type="button"
                      onClick={() => {
                        if (variant.category === 'Personal') {
                          setVariant(VARIANTS[0]);
                        } else {
                          setVariant(VARIANTS.find(v => v.category === 'Personal') || VARIANTS[1]);
                        }
                      }}
                      className={cn(
                        "w-10 h-5 rounded-full transition-colors relative cursor-pointer",
                        variant.category === 'Personal' ? "bg-purple-500" : "bg-foreground/10"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-3 h-3 rounded-full bg-foreground transition-transform",
                        variant.category === 'Personal' ? "left-6" : "left-1"
                      )} />
                    </button>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center gap-2 text-foreground/60 h-4">
                      <Tag className="w-3 h-3" />
                      <label className="text-[10px] font-bold uppercase tracking-wider leading-none">Variant</label>
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsVariantOpen(!isVariantOpen)}
                        className="w-full flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-2.5 sm:py-3 text-sm text-foreground hover:bg-foreground/5 transition-colors focus:outline-none"
                      >
                        <div className={cn("w-3 h-3 rounded-full shrink-0", variant.color)} />
                        <span className="flex-1 text-left">{variant.category}</span>
                        <ChevronDown className={cn("w-4 h-4 text-foreground/20 transition-transform", isVariantOpen && "rotate-180")} />
                      </button>

                      <AnimatePresence>
                        {isVariantOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsVariantOpen(false)} />
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
                            >
                              <div className="p-1">
                                {VARIANTS.map((v) => (
                                  <button
                                    key={v.name}
                                    type="button"
                                    onClick={() => {
                                      setVariant(v);
                                      setIsVariantOpen(false);
                                    }}
                                    className={cn(
                                      "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs transition-colors",
                                      variant.name === v.name ? "bg-foreground/10 text-foreground" : "text-foreground/60 hover:bg-foreground/5"
                                    )}
                                  >
                                    <div className={cn("w-2 h-2 rounded-full", v.color)} />
                                    <span>{v.category}</span>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center gap-2 text-foreground/60 h-4">
                    <AlignLeft className="w-3 h-3" />
                    <label className="text-[10px] font-bold uppercase tracking-wider leading-none">Description</label>
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter a description"
                    rows={rowsOnMobile}
                    className="w-full bg-card border border-border rounded-xl px-4 py-2.5 sm:py-3 text-sm text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-border transition-colors resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 sm:flex-none px-4 py-3 rounded-xl text-sm font-bold text-foreground hover:bg-foreground/5 transition-colors border border-border"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] sm:flex-none px-4 py-3 rounded-xl text-sm font-bold bg-foreground text-background hover:bg-foreground/90 transition-colors"
                  >
                    {initialEvent ? 'Save Changes' : 'Create Event'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
