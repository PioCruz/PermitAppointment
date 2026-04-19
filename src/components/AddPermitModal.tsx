import React, { useState } from 'react';
import { X, Send, Shield, CreditCard, LogOut } from 'lucide-react';
import { Permit, PermitType, UserRole, MemberProfile } from '../types';
import { isBefore } from 'date-fns';
import { cn } from '../lib/utils';

import { toast } from 'sonner';

interface AddPermitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (permit: Permit) => void;
  currentUserName: string;
  activeGroupId: string | null;
  members: MemberProfile[];
}

export const AddPermitModal: React.FC<AddPermitModalProps> = ({ isOpen, onClose, onAdd, currentUserName, activeGroupId, members }) => {
  const [type, setType] = useState<PermitType>('Leave');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [receiver, setReceiver] = useState('');
  
  // Specific form states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [amount, setAmount] = useState('');
  const [project, setProject] = useState('');

  const admins = members.filter(m => m.role === 'Admin');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroupId) return;

    if (startDate && isBefore(new Date(startDate), new Date())) {
      toast.error("Cannot schedule a permit in the past.");
      return;
    }

    if (startDate && endDate && isBefore(new Date(endDate), new Date(startDate))) {
      toast.error("End time cannot be before start time.");
      return;
    }

    const newPermit: Permit = {
      id: Math.random().toString(36).substr(2, 9),
      groupId: activeGroupId,
      type,
      title: title || `${type} Request`,
      description,
      sender: currentUserName,
      receiver: receiver || (admins.length > 0 ? admins[0].name : 'Admin'),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        startDate,
        endDate,
        location,
        amount,
        project,
      }
    };
    onAdd(newPermit);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setLocation('');
    setAmount('');
    setProject('');
  };

  const renderFormFields = () => {
    switch (type) {
      case 'Leave':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="leave-start-date" className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Start Date</label>
                <input
                  id="leave-start-date"
                  name="leave-start-date"
                  required
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-rose-500/50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="leave-end-date" className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">End Date</label>
                <input
                  id="leave-end-date"
                  name="leave-end-date"
                  required
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-rose-500/50 transition-colors"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="leave-reason" className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Reason for Leave</label>
              <textarea
                id="leave-reason"
                name="leave-reason"
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly explain your leave request..."
                className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-rose-500/50 transition-colors resize-none"
              />
            </div>
          </div>
        );
      case 'Access':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
              <label htmlFor="access-location" className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Location / Room</label>
              <input
                id="access-location"
                name="access-location"
                required
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Server Room, Lab 402"
                className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="access-date" className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Access Date</label>
                <input
                  id="access-date"
                  name="access-date"
                  required
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="access-duration" className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Duration (Hours)</label>
                <input
                  id="access-duration"
                  name="access-duration"
                  required
                  type="number"
                  placeholder="2"
                  className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="access-purpose" className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Purpose of Access</label>
              <textarea
                id="access-purpose"
                name="access-purpose"
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Why do you need access?"
                className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
              />
            </div>
          </div>
        );
      case 'Budget':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="budget-amount" className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Amount ($)</label>
                <input
                  id="budget-amount"
                  name="budget-amount"
                  required
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="500.00"
                  className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="budget-project" className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Project Name</label>
                <input
                  id="budget-project"
                  name="budget-project"
                  required
                  type="text"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="Marketing Q3"
                  className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="budget-justification" className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Justification</label>
              <textarea
                id="budget-justification"
                name="budget-justification"
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain why this budget is needed..."
                className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
              />
            </div>
          </div>
        );
    }
  };

  const types: { id: PermitType; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'Leave', label: 'Leave', icon: <LogOut className="w-4 h-4" />, color: 'text-rose-400 bg-rose-400/10 border-rose-400/20' },
    { id: 'Access', label: 'Access', icon: <Shield className="w-4 h-4" />, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
    { id: 'Budget', label: 'Budget', icon: <CreditCard className="w-4 h-4" />, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
      <div className="w-[95%] max-w-lg bg-card border border-border rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-foreground leading-none">New Permit Request</h2>
          <button onClick={onClose} className="p-2 hover:bg-foreground/5 rounded-full transition-colors shrink-0">
            <X className="w-5 h-5 text-foreground/40" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto scrollbar-hide">
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Select Permit Type</span>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {types.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setType(t.id);
                    resetForm();
                  }}
                  className={cn(
                    "flex flex-col items-center gap-2 p-2 sm:p-4 rounded-xl sm:rounded-2xl border transition-all",
                    type === t.id 
                      ? t.color + " ring-2 ring-white/10" 
                      : "bg-foreground/5 border-border text-foreground/40 hover:bg-foreground/10"
                  )}
                >
                  <span className="shrink-0">{t.icon}</span>
                  <span className="text-[8px] sm:text-[10px] font-bold uppercase">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-foreground/5 shrink-0" />

          {renderFormFields()}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="space-y-1.5 sm:space-y-2 flex-1">
              <label htmlFor="permit-receiver" className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest leading-none">Sent To:</label>
              <select
                id="permit-receiver"
                name="permit-receiver"
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-foreground focus:outline-none focus:border-indigo-500/50 transition-colors"
              >
                {admins.length > 0 ? (
                  admins.map(admin => (
                    <option key={admin.id} value={admin.name}>{admin.name}</option>
                  ))
                ) : (
                  <option value="Admin">Admin</option>
                )}
              </select>
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-background rounded-xl text-sm font-bold hover:bg-foreground/90 transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>Send Permit Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
