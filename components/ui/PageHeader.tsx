import React from "react";
import { typography } from "../../styles/design-system";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  action,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 ${className}`}
    >
      <div>
        <h1 className={`${typography.h1} text-slate-900`}>{title}</h1>
        {subtitle && <p className={`${typography.caption} mt-1`}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export default PageHeader;
