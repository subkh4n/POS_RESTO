import React from "react";
import { getInputClasses } from "../../styles/design-system";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  error = false,
  icon,
  disabled = false,
  className = "",
  ...props
}) => {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </div>
      )}
      <input
        className={`${getInputClasses(error, disabled)} ${
          icon ? "pl-12" : ""
        } ${className}`}
        disabled={disabled}
        {...props}
      />
    </div>
  );
};

// Select component with same styling
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  error = false,
  disabled = false,
  className = "",
  children,
  ...props
}) => {
  return (
    <select
      className={`${getInputClasses(error, disabled)} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </select>
  );
};

export default Input;
