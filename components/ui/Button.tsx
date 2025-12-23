import React from "react";
import { Loader2 } from "lucide-react";
import { getButtonClasses } from "../../styles/design-system";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  icon,
  children,
  disabled,
  className = "",
  ...props
}) => {
  return (
    <button
      className={`${getButtonClasses(variant, size, fullWidth)} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {children}
    </button>
  );
};

export default Button;
