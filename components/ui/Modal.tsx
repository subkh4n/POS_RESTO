import React from "react";
import { X } from "lucide-react";
import { modalStyles, animations } from "../../styles/design-system";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg";
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidth = "sm",
}) => {
  if (!isOpen) return null;

  return (
    <div className={`${modalStyles.overlay} ${animations.fadeIn}`}>
      <div
        className={`${modalStyles.container} ${maxWidthClasses[maxWidth]} ${animations.zoomIn}`}
      >
        {/* Header */}
        {(title || icon) && (
          <div className={modalStyles.header}>
            <div className="flex items-center gap-3">
              {icon && <div className="p-2 rounded-xl bg-gray-50">{icon}</div>}
              <div>
                {title && (
                  <h2 className="text-lg font-bold text-gray-800">{title}</h2>
                )}
                {subtitle && (
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-all"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className={modalStyles.body}>{children}</div>

        {/* Footer */}
        {footer && <div className={modalStyles.footer}>{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
