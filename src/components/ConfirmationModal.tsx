import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
}) => {
  const variantColors = {
    danger: 'bg-rose-500 hover:bg-rose-600 text-foreground',
    warning: 'bg-amber-500 hover:bg-amber-600 text-background',
    info: 'bg-blue-500 hover:bg-blue-600 text-foreground',
  };

  const iconColors = {
    danger: 'text-rose-500 bg-rose-500/10',
    warning: 'text-amber-500 bg-amber-500/10',
    info: 'text-blue-500 bg-blue-500/10',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
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
            className="relative w-[95%] max-w-sm bg-popover border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-5 sm:p-6 space-y-4 sm:space-y-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className={`p-2 sm:p-3 rounded-xl shrink-0 ${iconColors[variant]}`}>
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-foreground">{title}</h3>
                  <p className="text-xs sm:text-sm text-foreground/40 leading-relaxed">{message}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 sm:gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-foreground hover:bg-foreground/5 transition-colors border border-border flex-1 sm:flex-none"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`px-4 sm:px-6 py-2 rounded-xl text-sm font-bold transition-colors flex-1 sm:flex-none ${variantColors[variant]}`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
