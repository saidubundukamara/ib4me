import React from "react";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
};

export function Card({ children, className = "", gradient = false }: CardProps) {
  return (
    <div
      className={`rounded-2xl border shadow-sm ${
        gradient
          ? "bg-gradient-to-br from-indigo-600 to-sky-500 text-white"
          : "bg-white/90 dark:bg-white/5"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;


