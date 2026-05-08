import type { HTMLAttributes, ReactNode } from "react";

type SavoirCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function SavoirCard({ children, className = "", ...props }: SavoirCardProps) {
  return (
    <div
      className={`rounded-lg border border-white/10 bg-white/[0.07] shadow-[0_20px_80px_rgba(0,0,0,0.25)] backdrop-blur ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
