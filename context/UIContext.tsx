
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AlertModal } from '../components/AlertModal';

interface UIContextType {
  showAlert: (message: string, title?: string, type?: 'success' | 'error' | 'info') => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    message: string;
    title?: string;
    type?: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    message: '',
    title: '',
    type: 'info'
  });

  const showAlert = (message: string, title?: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertState({ isOpen: true, message, title, type });
  };

  const closeAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <UIContext.Provider value={{ showAlert }}>
      {children}
      <AlertModal 
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        message={alertState.message}
        title={alertState.title}
        type={alertState.type}
      />
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) throw new Error('useUI must be used within a UIProvider');
  return context;
};
