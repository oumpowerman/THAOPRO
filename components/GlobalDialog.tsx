
import React from 'react';
import { useDialog } from '../context/DialogContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, HelpCircle, X } from 'lucide-react';

export const GlobalDialog: React.FC = () => {
  const { isOpen, config, close } = useDialog();

  if (!isOpen) return null;

  // Visual Logic
  let Icon = Info;
  let colorClass = 'text-blue-600 bg-blue-50';
  let btnConfirmClass = 'bg-blue-600 hover:bg-blue-700 text-white';
  
  switch (config.type) {
    case 'success':
      Icon = CheckCircle2;
      colorClass = 'text-emerald-600 bg-emerald-50';
      btnConfirmClass = 'bg-emerald-600 hover:bg-emerald-700 text-white';
      break;
    case 'error':
      Icon = AlertCircle;
      colorClass = 'text-red-600 bg-red-50';
      btnConfirmClass = 'bg-red-600 hover:bg-red-700 text-white';
      break;
    case 'warning':
      Icon = AlertTriangle;
      colorClass = 'text-amber-500 bg-amber-50';
      btnConfirmClass = 'bg-amber-500 hover:bg-amber-600 text-white';
      break;
    case 'confirm':
      Icon = HelpCircle;
      colorClass = 'text-indigo-600 bg-indigo-50';
      btnConfirmClass = 'bg-indigo-600 hover:bg-indigo-700 text-white';
      break;
  }

  // Handle Backdrop Click
  const handleBackdropClick = () => {
      // If it's just an alert (not a confirm), allow closing by clicking background
      if (config.type !== 'confirm') {
          close(false);
      }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={handleBackdropClick}
      />
      
      {/* Dialog Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200 overflow-hidden text-center border border-white/20">
        
        {/* Decorative background glow */}
        <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20 ${colorClass.split(' ')[0]}`}></div>

        {/* Icon */}
        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${colorClass} shadow-inner`}>
          <Icon size={32} strokeWidth={2.5} />
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold text-slate-800 mb-2">
          {config.title}
        </h3>
        
        <div className="text-slate-500 mb-8 text-sm leading-relaxed whitespace-pre-wrap">
          {config.message}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
            {/* Show Cancel button ONLY for 'confirm' type */}
            {config.type === 'confirm' && (
                <button 
                  onClick={() => close(false)}
                  className="flex-1 py-3 text-slate-600 bg-slate-100 font-bold rounded-xl hover:bg-slate-200 transition-all active:scale-95"
                >
                  {config.cancelText || 'ยกเลิก'}
                </button>
            )}
            
            <button 
              onClick={() => close(true)}
              className={`flex-1 py-3 font-bold rounded-xl shadow-lg shadow-current/20 transition-all transform active:scale-95 ${btnConfirmClass}`}
            >
              {config.confirmText || 'ตกลง'}
            </button>
        </div>
      </div>
    </div>
  );
};
