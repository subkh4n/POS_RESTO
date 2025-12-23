import React from "react";
import { getIconButtonClasses } from "../../styles/design-system";

type IconButtonVariant = "default" | "primary" | "success" | "danger" | "info";

interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  icon: React.ReactNode;
  label?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  variant = "default",
  icon,
  label,
  className = "",
  ...props
}) => {
  return (
    <button
      className={`${getIconButtonClasses(variant)} ${className}`}
      aria-label={label}
      title={label}
      {...props}
    >
      {icon}
    </button>
  );
};

export default IconButton;
