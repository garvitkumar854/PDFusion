import React from 'react';
import { cn } from '@/lib/utils';

interface CheckIconProps extends React.SVGProps<SVGSVGElement> {}

const CheckIcon: React.FC<CheckIconProps> = ({ className, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("w-5 h-5", className)}
      {...props}
    >
      <circle cx="12" cy="12" r="10" fill="hsl(var(--primary-foreground))" stroke="hsl(var(--primary) / 0.2)" />
      <path d="m9 12 2 2 4-4" stroke="hsl(var(--primary))" strokeWidth="2.5" />
    </svg>
  );
};

export default CheckIcon;
