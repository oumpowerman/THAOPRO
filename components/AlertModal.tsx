
import React from 'react';
import { CheckCircle2, AlertCircle, X, Info, HelpCircle } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  title?: string;
  type?: 'success' | 'error' | 'info' | 'confirm';
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const AlertModal: React.FC<AlertModalProps> = ({ 
  isOpen, 
  onClose, 
  message, 
  title, 
  type = 'info',
  onConfirm,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก'
}) => {
  if (!isOpen) return null;

  let Icon = Info;
  let colorClass = 'text-blue-600 bg-blue-100';
  let btnClass = 'bg-blue-600 hover:bg-blue-700 text-white';

  if (type === 'success') {
    Icon = CheckCircle2;
    colorClass = 'text-emerald-600 bg-emerald-100';
    btnClass = 'bg-emerald-600 hover:bg-emerald-700 text-white';
  } else if (type === 'error') {
    Icon = AlertCircle;
    colorClass = 'text-red-600 bg-red-100';
    btnClass = 'bg-red-600 hover:bg-red-700 text-white';
  } else if (type === 'confirm') {
    Icon = HelpCircle;
    colorClass = 'text-amber-600 bg-amber-100';
    btnClass = 'bg-amber-600 hover:bg-amber-700 text-white';
  }

  // Handle line breaks in message
  const formattedMessage = message.split('\n').map((line, index) => (
    <React.Fragment key={index}>
      {line}
      <br />
    </React.Fragment>
  ));

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200 overflow-hidden text-center">
        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${colorClass}`}>
          <Icon size={32} />
        </div>

        <h3 className="text-xl font-bold text-slate-800 mb-2">
          {title || (type === 'error' ? 'เกิดข้อผิดพลาด' : type === 'success' ? 'สำเร็จ' : type === 'confirm' ? 'ยืนยันการทำรายการ' : 'แจ้งเตือน')}
        </h3>
        
        <div className="text-slate-500 mb-6 text-sm leading-relaxed">
          {formattedMessage}
        </div>

        <div className="flex gap-3">
            {onConfirm && (
                <button 
                  onClick={onClose}
                  className="flex-1 py-3 text-slate-600 bg-slate-100 font-bold rounded-xl hover:bg-slate-200 transition-all"
                >
                  {cancelText}
                </button>
            )}
            
            <button 
              onClick={() => {
                  if (onConfirm) onConfirm();
                  else onClose();
              }}
              className={`flex-1 py-3 font-bold rounded-xl shadow-lg transition-all transform active:scale-95 ${btnClass}`}
            >
              {onConfirm ? confirmText : 'ตกลง'}
            </button>
        </div>
      </div>
    </div>
  );
};
