
import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

type DialogType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

interface DialogConfig {
  title: string;
  message: string;
  type: DialogType;
  confirmText?: string;
  cancelText?: string;
}

interface DialogContextType {
  isOpen: boolean;
  config: DialogConfig;
  alert: (message: string, title?: string, type?: DialogType) => Promise<boolean>;
  confirm: (message: string, title?: string, type?: DialogType, confirmText?: string, cancelText?: string) => Promise<boolean>;
  close: (result: boolean) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<DialogConfig>({
    title: '',
    message: '',
    type: 'info',
  });

  // Store the resolve function of the current promise
  const resolveRef = useRef<(value: boolean) => void>(() => {});

  const openDialog = useCallback((newConfig: DialogConfig): Promise<boolean> => {
    setConfig(newConfig);
    setIsOpen(true);
    
    // Return a promise that resolves when the dialog is closed
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const alert = useCallback((message: string, title: string = 'แจ้งเตือน', type: DialogType = 'info') => {
    return openDialog({ title, message, type });
  }, [openDialog]);

  const confirm = useCallback((message: string, title: string = 'ยืนยันการทำรายการ', type: DialogType = 'confirm', confirmText = 'ยืนยัน', cancelText = 'ยกเลิก') => {
    return openDialog({ title, message, type, confirmText, cancelText });
  }, [openDialog]);

  const close = useCallback((result: boolean) => {
    setIsOpen(false);
    resolveRef.current(result); // Resolve the promise with user's choice
    // Reset config after animation (approximate)
    setTimeout(() => {
        setConfig({ title: '', message: '', type: 'info' });
    }, 300);
  }, []);

  return (
    <DialogContext.Provider value={{ isOpen, config, alert, confirm, close }}>
      {children}
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) throw new Error('useDialog must be used within a DialogProvider');
  return context;
};
