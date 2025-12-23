import React from "react";
import { getBadgeClasses } from "../../styles/design-system";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "default",
  icon,
  className = "",
  children,
}) => {
  return (
    <span className={`${getBadgeClasses(variant)} ${className}`}>
      {icon}
      {children}
    </span>
  );
};

export default Badge;
