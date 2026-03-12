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
                <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Start Date</label>
                <input
                  required
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-rose-500/50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">End Date</label>
                <input
                  required
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-rose-500/50 transition-colors"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Reason for Leave</label>
              <textarea
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
              <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Location / Room</label>
              <input
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
                <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Access Date</label>
                <input
                  required
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Duration (Hours)</label>
                <input
                  required
                  type="number"
                  placeholder="2"
                  className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Purpose of Access</label>
              <textarea
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
                <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Amount ($)</label>
                <input
                  required
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="500.00"
                  className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Project Name</label>
                <input
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
              <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Justification</label>
              <textarea
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">New Permit Request</h2>
          <button onClick={onClose} className="p-2 hover:bg-foreground/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-foreground/40" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Select Permit Type</label>
            <div className="grid grid-cols-3 gap-3">
              {types.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setType(t.id);
                    resetForm();
                  }}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                    type === t.id 
                      ? t.color + " ring-2 ring-white/10" 
                      : "bg-foreground/5 border-border text-foreground/40 hover:bg-foreground/10"
                  )}
                >
                  {t.icon}
                  <span className="text-[10px] font-bold uppercase">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-foreground/5" />

          {renderFormFields()}

          <div className="flex items-center justify-between pt-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Sent To:</label>
              <select
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-indigo-500/50 transition-colors"
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
              className="flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-xl text-sm font-bold hover:bg-foreground/90 transition-colors"
            >
              <Send className="w-4 h-4" />
              Send Permit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
