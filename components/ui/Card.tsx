import React from "react";
import { getCardClasses } from "../../styles/design-system";

type CardVariant = "default" | "bordered" | "elevated";
type CardPadding = "sm" | "md" | "lg";

interface CardProps {
  variant?: CardVariant;
  padding?: CardPadding;
  className?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = "default",
  padding = "md",
  className = "",
  children,
}) => {
  return (
    <div className={`${getCardClasses(variant, padding)} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
