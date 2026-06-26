"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ConfirmState {
  isOpen: boolean;
  message: string;
  resolve: ((value: boolean) => void) | null;
}

interface AlertState {
  isOpen: boolean;
  message: string;
  resolve: (() => void) | null;
}

interface PopupContextType {
  toast: (message: string, type?: "success" | "error" | "info") => void;
  confirm: (message: string) => Promise<boolean>;
  alert: (message: string) => Promise<void>;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

export const usePopup = () => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error("usePopup must be used within a PopupProvider");
  }
  return context;
};

// Global handlers for overriding window.alert and window.confirm
let globalToast: ((msg: string, type?: "success" | "error" | "info") => void) | null = null;
let globalAlert: ((msg: string) => Promise<void>) | null = null;
let globalConfirm: ((msg: string) => Promise<boolean>) | null = null;

if (typeof window !== "undefined") {
  // Override window.alert (toasts are more modern and non-blocking)
  window.alert = (message: any) => {
    if (globalToast) {
      const msgStr = String(message);
      // Determine type based on common error words
      const lower = msgStr.toLowerCase();
      const type = lower.includes("fail") || lower.includes("error") || lower.includes("invalid") ? "error" : "info";
      globalToast(msgStr, type);
    } else {
      console.warn("Default alert fallback:", message);
    }
  };
}

export function PopupProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    message: "",
    resolve: null,
  });
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    message: "",
    resolve: null,
  });

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove toast after 3.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const showConfirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        message,
        resolve,
      });
    });
  }, []);

  const showAlert = useCallback((message: string): Promise<void> => {
    return new Promise((resolve) => {
      setAlertState({
        isOpen: true,
        message,
        resolve,
      });
    });
  }, []);

  // Sync global functions
  useEffect(() => {
    globalToast = showToast;
    globalAlert = showAlert;
    globalConfirm = showConfirm;
    return () => {
      globalToast = null;
      globalAlert = null;
      globalConfirm = null;
    };
  }, [showToast, showAlert, showConfirm]);

  const handleConfirmResponse = (value: boolean) => {
    if (confirmState.resolve) {
      confirmState.resolve(value);
    }
    setConfirmState({ isOpen: false, message: "", resolve: null });
  };

  const handleAlertResponse = () => {
    if (alertState.resolve) {
      alertState.resolve();
    }
    setAlertState({ isOpen: false, message: "", resolve: null });
  };

  return (
    <PopupContext.Provider value={{ toast: showToast, confirm: showConfirm, alert: showAlert }}>
      {children}

      {/* ── TOAST NOTIFICATIONS (Neo-brutalist style) ── */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((t) => {
            const bgClass =
              t.type === "success"
                ? "bg-emerald-50 border-emerald-600 text-emerald-950"
                : t.type === "error"
                ? "bg-accent-red/10 border-accent-red text-accent-red"
                : "bg-accent-yellow text-primary border-primary";
            const icon =
              t.type === "success"
                ? "check_circle"
                : t.type === "error"
                ? "error"
                : "info";

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                className={`pointer-events-auto border-4 ${bgClass} p-sm font-black uppercase text-xs tracking-wider flex items-start gap-2 shadow-[4px_4px_0px_0px_#1a1a1a] select-none`}
              >
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">{icon}</span>
                <span className="flex-1 leading-snug break-words">{t.message}</span>
                <button
                  onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                  className="material-symbols-outlined text-[16px] shrink-0 opacity-60 hover:opacity-100 cursor-pointer ml-1"
                >
                  close
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── CONFIRM DIALOG MODAL (Neo-brutalist style) ── */}
      <AnimatePresence>
        {confirmState.isOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-sm backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white border-8 border-primary max-w-[448px] w-full p-md max-h-[90vh] overflow-y-auto shadow-[12px_12px_0px_0px_#1a1a1a] space-y-md text-left text-primary uppercase font-bold text-xs"
            >
              <div className="flex items-center gap-2 border-b-4 border-primary pb-sm bg-accent-yellow -mx-md -mt-md p-sm select-none">
                <span className="material-symbols-outlined text-lg">help_outline</span>
                <h3 className="font-black text-sm uppercase text-primary">Confirmation Required</h3>
              </div>
              <p className="text-primary font-bold uppercase text-sm leading-relaxed whitespace-pre-line pt-2">
                {confirmState.message}
              </p>
              <div className="grid grid-cols-2 gap-sm select-none pt-2">
                <button
                  onClick={() => handleConfirmResponse(true)}
                  className="p-3 bg-primary text-white border-2 border-primary font-black uppercase text-xs text-center cursor-pointer active:translate-y-0.5 hover:bg-opacity-90"
                >
                  Confirm
                </button>
                <button
                  onClick={() => handleConfirmResponse(false)}
                  className="p-3 bg-white text-primary border-2 border-primary font-black uppercase text-xs text-center cursor-pointer hover:bg-accent-yellow"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── ALERT DIALOG MODAL (Neo-brutalist style) ── */}
      <AnimatePresence>
        {alertState.isOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-sm backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white border-8 border-primary max-w-[448px] w-full p-md max-h-[90vh] overflow-y-auto shadow-[12px_12px_0px_0px_#1a1a1a] space-y-md text-left text-primary uppercase font-bold text-xs"
            >
              <div className="flex items-center gap-2 border-b-4 border-primary pb-sm bg-accent-yellow -mx-md -mt-md p-sm select-none">
                <span className="material-symbols-outlined text-lg">info</span>
                <h3 className="font-black text-sm uppercase text-primary">Attention</h3>
              </div>
              <p className="text-primary font-bold uppercase text-sm leading-relaxed whitespace-pre-line pt-2">
                {alertState.message}
              </p>
              <div className="select-none pt-2">
                <button
                  onClick={handleAlertResponse}
                  className="w-full p-3 bg-primary text-white border-2 border-primary font-black uppercase text-xs text-center cursor-pointer active:translate-y-0.5 hover:bg-opacity-90"
                >
                  Okay
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PopupContext.Provider>
  );
}
