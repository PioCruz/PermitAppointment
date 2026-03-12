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

  // Form state: when editing, pre-fill the fields from the existing event; when creating, reset to defaults
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

  // Events: validate times and build the CalendarEvent object before saving it
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-popover border border-border rounded-2xl shadow-2xl z-[101] overflow-hidden"
          >
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{initialEvent ? 'Edit Event' : 'Add New Event'}</h2>
                  <p className="text-sm text-foreground/40">{initialEvent ? 'Modify your existing event.' : 'Create a new event for your calendar.'}</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-foreground/5 rounded-full text-foreground/40 hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-foreground/60 h-4">
                    <Tag className="w-3 h-3" />
                    <label className="text-xs font-bold uppercase tracking-wider leading-none">Title</label>
                  </div>
                  <input
                    autoFocus
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a title"
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-border transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-foreground/60 h-4">
                      <Calendar className="w-3 h-3" />
                      <label className="text-xs font-bold uppercase tracking-wider leading-none">Start Date</label>
                    </div>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-border transition-colors [color-scheme:dark]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-foreground/60 h-4">
                      <Clock className="w-3 h-3" />
                      <label className="text-xs font-bold uppercase tracking-wider leading-none">End Date</label>
                    </div>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-border transition-colors [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2 relative">
                    <div className="flex items-center gap-2 text-foreground/60 h-4">
                      <User className="w-3 h-3" />
                      <label className="text-xs font-bold uppercase tracking-wider leading-none">Attendees</label>
                    </div>
                    <div 
                      className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground focus-within:border-border transition-colors cursor-pointer min-h-[48px] flex flex-wrap gap-2 items-center"
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

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-foreground/60 h-4">
                      <Tag className="w-3 h-3" />
                      <label className="text-xs font-bold uppercase tracking-wider leading-none">Variant</label>
                    </div>
                    <div className="relative group">
                      <select
                        value={variant.name}
                        onChange={(e) => setVariant(VARIANTS.find(v => v.name === e.target.value) || VARIANTS[0])}
                        className="w-full bg-card border border-border rounded-xl px-10 py-3 text-foreground appearance-none focus:outline-none focus:border-border transition-colors cursor-pointer"
                      >
                        {VARIANTS.map((v) => (
                          <option key={v.name} value={v.name}>{v.name}</option>
                        ))}
                      </select>
                      <div className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full", variant.color)} />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-foreground/20">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-foreground/60 h-4">
                    <AlignLeft className="w-3 h-3" />
                    <label className="text-xs font-bold uppercase tracking-wider leading-none">Description</label>
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter a description"
                    rows={3}
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-border transition-colors resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-foreground hover:bg-foreground/5 transition-colors border border-border"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl text-sm font-bold bg-foreground text-background hover:bg-foreground/90 transition-colors"
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
