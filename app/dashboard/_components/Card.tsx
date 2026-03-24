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
          ? "bg-gradient-to-br from-fun-green to-fun-green/80 text-white"
          : "bg-white"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;


