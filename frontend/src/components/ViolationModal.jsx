import React, { useEffect } from 'react';
import { X, AlertTriangle, ShieldAlert, Clock } from 'lucide-react';

const ViolationModal = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'warning',
  count = null,
  maxCount = null,
  showTimer = false,
  timerSeconds = 0,
  onAcknowledge,
  isBlocking = false,
  strictMode = false,
  autoCloseSeconds = 0
}) => {
  const preventDefault = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    if (isOpen && onAcknowledge) {
      const handler = (e) => {
        if (strictMode && e.key === 'Escape') {
          return;
        }
        if (e.key === 'Escape' && !isBlocking) {
          onClose();
        }
      };
      document.addEventListener('keydown', handler);
      return () => document.removeEventListener('keydown', handler);
    }
  }, [isOpen, onAcknowledge, isBlocking, strictMode, onClose]);

  useEffect(() => {
    if (isOpen && autoCloseSeconds > 0) {
      const timer = setTimeout(() => {
        onAcknowledge?.();
      }, autoCloseSeconds * 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseSeconds, onAcknowledge]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (strictMode) {
        document.body.style.touchAction = 'none';
        document.addEventListener('mousedown', preventDefault, { passive: false });
        document.addEventListener('keydown', preventDefault, { passive: false });
      }
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.touchAction = 'auto';
      document.removeEventListener('mousedown', preventDefault);
      document.removeEventListener('keydown', preventDefault);
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.touchAction = 'auto';
      document.removeEventListener('mousedown', preventDefault);
      document.removeEventListener('keydown', preventDefault);
    };
  }, [isOpen, strictMode]);

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'violation':
        return {
          borderColor: 'border-destructive',
          bgColor: 'bg-destructive/10',
          iconColor: 'text-destructive',
          iconBg: 'bg-destructive/15',
          buttonColor: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
          titleColor: 'text-destructive',
        };
      case 'critical':
        return {
          borderColor: 'border-red-600',
          bgColor: 'bg-red-500/10',
          iconColor: 'text-red-600',
          iconBg: 'bg-red-500/15',
          buttonColor: 'bg-red-600 hover:bg-red-700 text-white',
          titleColor: 'text-red-600',
        };
      case 'warning':
      default:
        return {
          borderColor: 'border-amber-500',
          bgColor: 'bg-amber-500/10',
          iconColor: 'text-amber-500',
          iconBg: 'bg-amber-500/15',
          buttonColor: 'bg-amber-600 hover:bg-amber-700 text-white',
          titleColor: 'text-amber-500',
        };
    }
  };

  const styles = getTypeStyles();
  const Icon = type === 'violation' || type === 'critical' ? AlertTriangle : ShieldAlert;

  

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => !isBlocking && onClose()}
        aria-hidden="true"
      />
      
      <div className={`relative w-full max-w-md bg-card border-2 ${styles.borderColor} rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200 ${styles.bgColor}`}>
        
        {/* Header */}
        <div className={`p-6 border-b ${styles.borderColor}/30 flex items-start gap-4`}>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${styles.iconBg}`}>
            <Icon size={28} className={styles.iconColor} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-xl font-extrabold ${styles.titleColor}`}>{title}</h3>
            {count !== null && maxCount !== null && (
              <p className="text-sm text-muted-foreground mt-1">
                Warning {count} of {maxCount}
              </p>
            )}
          </div>
          </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="text-base text-foreground leading-relaxed whitespace-pre-line">
            {message}
          </div>

          {showTimer && timerSeconds > 0 && (
            <div className={`p-4 rounded-2xl border ${styles.borderColor}/30 ${styles.bgColor} flex items-center justify-center gap-3`}>
              <Clock size={24} className={styles.iconColor} />
              <span className="text-xl font-bold tabular-nums {styles.titleColor}">
                {timerSeconds}s
              </span>
              <span className="text-sm text-muted-foreground">to return to test</span>
            </div>
          )}

          {count !== null && maxCount !== null && count < maxCount && (
            <div className="p-3 rounded-xl bg-muted/50 border border-border/50 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">What happens next:</p>
              <ul className="space-y-1 text-[13px]">
                <li>• You will be forced back into fullscreen mode</li>
                <li>• Your remaining warnings will decrease</li>
                <li>{maxCount - count} warning{maxCount - count > 1 ? 's' : ''} remaining before test termination</li>
              </ul>
            </div>
          )}

          {count !== null && maxCount !== null && count >= maxCount && (
            <div className="p-4 rounded-2xl border-2 border-destructive/50 bg-destructive/10 text-destructive text-sm font-medium">
              <AlertTriangle size={16} className="inline-block mr-2" />
              <span>Test will be terminated and submitted automatically due to violation limit reached.</span>
            </div>
          )}

          {strictMode && count !== null && maxCount !== null && count >= maxCount && (
            <div className="p-4 rounded-2xl border-2 border-red-600/50 bg-red-600/10 text-red-600 text-sm font-medium">
              <AlertTriangle size={16} className="inline-block mr-2" />
              <span>Violation limit exceeded. Exam will be automatically submitted and closed.</span>
            </div>
          )}
        </div>

{/* Footer */}
        <div className={`p-6 border-t ${styles.borderColor}/30 flex justify-end gap-3`}>
          <button
            onClick={() => {
              onAcknowledge?.();
              if (!isBlocking) onClose();
            }}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${styles.buttonColor}`}
            disabled={isBlocking}
          >
            {isBlocking ? 'Understood - Returning to Test' : 'Return to Test'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViolationModal;