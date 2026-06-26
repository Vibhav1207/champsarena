"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

type PendingAction = {
  action: () => Promise<void>;
};

type PendingActionContextType = {
  pendingAction: PendingAction | null;
  setPendingAction: (action: PendingAction) => void;
  clearPendingAction: () => void;
};

const PendingActionContext = createContext<PendingActionContextType | undefined>(undefined);

export const PendingActionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const clearPendingAction = () => {
    setPendingAction(null);
  };

  return (
    <PendingActionContext.Provider value={{ pendingAction, setPendingAction, clearPendingAction }}>
      {children}
    </PendingActionContext.Provider>
  );
};

export const usePendingAction = () => {
  const context = useContext(PendingActionContext);
  if (!context) {
    throw new Error('usePendingAction must be used within a PendingActionProvider');
  }
  return context;
};