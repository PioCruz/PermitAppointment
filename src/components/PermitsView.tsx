import React from 'react';
import { Permit, UserRole, CATEGORY_COLORS } from '../types';
import { format } from 'date-fns';
import { Check, X, MessageSquare, Clock, Shield, CreditCard, LogOut, Search, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmationModal } from './ConfirmationModal';

interface PermitsViewProps {
  permits: Permit[];
  currentUser: UserRole;
  currentUserName: string;
  onUpdatePermit: (id: string, status: Permit['status']) => void;
  onScheduleAppointment: (permit: Permit) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const PermitsView: React.FC<PermitsViewProps> = ({ permits, currentUser, currentUserName, onUpdatePermit, onScheduleAppointment, searchQuery, setSearchQuery }) => {
  const [activeTab, setActiveTab] = React.useState<'Incoming' | 'History' | 'Outgoing'>(currentUser === 'Admin' ? 'Incoming' : 'Outgoing');
  const [expandedPermitId, setExpandedPermitId] = React.useState<string | null>(null);
  const [confirmReject, setConfirmReject] = React.useState<{ isOpen: boolean; permitId: string | null }>({
    isOpen: false,
    permitId: null,
  });

  const filteredPermits = permits.filter(p => {
    // Search filter
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // Role and Tab filter
    if (currentUser === 'Admin') {
      if (activeTab === 'Incoming') {
        return p.receiver === currentUserName && (p.status === 'pending' || p.status === 'In Sched');
      } else if (activeTab === 'History') {
        return p.receiver === currentUserName && (p.status === 'Accepted' || p.status === 'cancelled');
      } else {
        return p.sender === currentUserName;
      }
    } else {
      // Members only see their own outgoing permits
      return p.sender === currentUserName;
    }
  });

  const getIcon = (type: Permit['type']) => {
    switch (type) {
      case 'Leave': return <LogOut className="w-4 h-4" />;
      case 'Access': return <Shield className="w-4 h-4" />;
      case 'Budget': return <CreditCard className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: Permit['status']) => {
    switch (status) {
      case 'pending': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'Accepted': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'cancelled': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      case 'In Sched': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedPermitId(expandedPermitId === id ? null : id);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-background">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {currentUser === 'Admin' ? (activeTab === 'Incoming' ? 'Permit Management' : activeTab === 'History' ? 'Permit History' : 'My Permits') : 'My Permits'}
            </h2>
            <p className="text-sm text-foreground/40 mt-1">
              {currentUser === 'Admin' 
                ? (activeTab === 'Incoming' ? 'Review and manage incoming requests' : activeTab === 'History' ? 'View resolved incoming requests' : 'Track your own sent requests') 
                : 'Track the status of your sent requests'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {currentUser === 'Admin' && (
              <div className="flex p-1 bg-foreground/5 rounded-xl border border-border">
                <button
                  onClick={() => setActiveTab('Incoming')}
                  className={cn(
                    "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                    activeTab === 'Incoming' ? "bg-foreground text-background shadow-lg" : "text-foreground/40 hover:text-foreground/60"
                  )}
                >
                  Incoming
                </button>
                <button
                  onClick={() => setActiveTab('History')}
                  className={cn(
                    "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                    activeTab === 'History' ? "bg-foreground text-background shadow-lg" : "text-foreground/40 hover:text-foreground/60"
                  )}
                >
                  History
                </button>
                <button
                  onClick={() => setActiveTab('Outgoing')}
                  className={cn(
                    "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                    activeTab === 'Outgoing' ? "bg-foreground text-background shadow-lg" : "text-foreground/40 hover:text-foreground/60"
                  )}
                >
                  My Permits
                </button>
              </div>
            )}
            <div className="relative group/search">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-focus-within/search:text-foreground/40 transition-colors" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search permits..."
                className="w-64 bg-card border border-border rounded-lg py-2 pl-10 pr-4 text-xs text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-border transition-all focus:w-80"
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-foreground/5 rounded-lg border border-border">
              <Clock className="w-4 h-4 text-foreground/40" />
              <span className="text-xs font-medium text-foreground/60">{filteredPermits.length} Total</span>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredPermits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-foreground/20 border-2 border-dashed border-border rounded-2xl">
              <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-lg font-medium">No permits found</p>
            </div>
          ) : (
            filteredPermits.sort((a, b) => {
              if (a.status === 'pending' && b.status !== 'pending') return -1;
              if (a.status !== 'pending' && b.status === 'pending') return 1;
              return b.createdAt.getTime() - a.createdAt.getTime();
            }).map((permit) => {
              const isExpanded = expandedPermitId === permit.id;
              
              return (
                <div 
                  key={permit.id}
                  onClick={() => toggleExpand(permit.id)}
                  className={cn(
                    "group bg-card border border-border rounded-2xl p-6 transition-all hover:border-border hover:bg-muted cursor-pointer",
                    isExpanded && "border-border bg-muted"
                  )}
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-foreground/5 flex items-center justify-center text-foreground/60 border border-border shrink-0">
                        {getIcon(permit.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-foreground">{permit.title}</h3>
                          <span className={cn(
                            "px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider border",
                            getStatusColor(permit.status)
                          )}>
                            {permit.status}
                          </span>
                          <div className="ml-auto text-foreground/20">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-2 text-[10px] font-bold text-foreground/40 uppercase tracking-widest">
                          <span>From: {permit.sender}</span>
                          <span>•</span>
                          <span>To: {permit.receiver}</span>
                          <span>•</span>
                          <span>{format(permit.createdAt, 'MMM d, HH:mm')}</span>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                                <p className="text-sm text-foreground/60">{permit.description}</p>
                                
                                {permit.metadata && (
                                  <div className="grid grid-cols-2 gap-3">
                                    {permit.type === 'Leave' && permit.metadata.startDate && (
                                      <div className="p-3 rounded-xl bg-foreground/5 border border-border">
                                        <span className="block text-[8px] font-bold text-foreground/20 uppercase tracking-widest mb-1">Duration</span>
                                        <span className="text-xs font-medium text-foreground/80">
                                          {permit.metadata.startDate} to {permit.metadata.endDate}
                                        </span>
                                      </div>
                                    )}
                                    {permit.type === 'Access' && permit.metadata.location && (
                                      <div className="p-3 rounded-xl bg-foreground/5 border border-border">
                                        <span className="block text-[8px] font-bold text-foreground/20 uppercase tracking-widest mb-1">Location</span>
                                        <span className="text-xs font-medium text-foreground/80">{permit.metadata.location}</span>
                                      </div>
                                    )}
                                    {permit.type === 'Budget' && permit.metadata.amount && (
                                      <>
                                        <div className="p-3 rounded-xl bg-foreground/5 border border-border">
                                          <span className="block text-[8px] font-bold text-foreground/20 uppercase tracking-widest mb-1">Amount</span>
                                          <span className="text-xs font-medium text-emerald-400">${permit.metadata.amount}</span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-foreground/5 border border-border">
                                          <span className="block text-[8px] font-bold text-foreground/20 uppercase tracking-widest mb-1">Project</span>
                                          <span className="text-xs font-medium text-foreground/80">{permit.metadata.project}</span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {currentUser === 'Member' && permit.status === 'pending' && (
                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => setConfirmReject({ isOpen: true, permitId: permit.id })}
                          className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors text-xs font-bold"
                          title="Cancel Permit"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {currentUser === 'Admin' && activeTab === 'Incoming' && (permit.status === 'pending' || permit.status === 'In Sched') && (
                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {permit.status === 'pending' && (
                          <button 
                            onClick={() => onScheduleAppointment(permit)}
                            className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                            title="Schedule Appointment"
                          >
                            <MessageSquare className="w-5 h-5" />
                          </button>
                        )}
                        <button 
                          onClick={() => setConfirmReject({ isOpen: true, permitId: permit.id })}
                          className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                          title="Reject"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => onUpdatePermit(permit.id, 'Accepted')}
                          className="p-2.5 rounded-xl bg-emerald-500 text-background border border-emerald-500/20 hover:bg-emerald-400 transition-colors"
                          title="Accept"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmReject.isOpen}
        onClose={() => setConfirmReject({ isOpen: false, permitId: null })}
        onConfirm={() => {
          if (confirmReject.permitId) {
            onUpdatePermit(confirmReject.permitId, 'cancelled');
          }
        }}
        title={currentUser === 'Admin' ? "Reject Permit" : "Cancel Permit"}
        message={currentUser === 'Admin' 
          ? "Are you sure you want to reject this permit? This action will notify the sender and cannot be undone."
          : "Are you sure you want to cancel your permit request? This action cannot be undone."
        }
        confirmLabel={currentUser === 'Admin' ? "Reject Permit" : "Cancel Permit"}
        variant="danger"
      />
    </div>
  );
};
