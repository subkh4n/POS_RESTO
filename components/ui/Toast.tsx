import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

type ToastType = "success" | "error";

interface ToastProps {
  show: boolean;
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  show,
  message,
  type = "success",
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  const baseClasses =
    "fixed top-8 right-8 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-top-10 duration-300";
  const typeClasses =
    type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white";

  return (
    <div className={`${baseClasses} ${typeClasses}`}>
      {type === "success" ? (
        <CheckCircle2 size={24} />
      ) : (
        <AlertCircle size={24} />
      )}
      <div className="flex-1">
        <span className="font-bold text-sm block">
          {type === "success" ? "Berhasil" : "Kesalahan"}
        </span>
        <span className="text-xs opacity-90">{message}</span>
      </div>
      <button
        onClick={onClose}
        className="p-1 hover:bg-white/10 rounded-full transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

// Hook for managing toast state
export const useToast = () => {
  const [toast, setToast] = React.useState<{
    show: boolean;
    message: string;
    type: ToastType;
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, show: false }));
  };

  return { toast, showToast, hideToast };
};

export default Toast;
