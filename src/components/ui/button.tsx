import * as React from "react";
import { cn } from "@/lib/utils";

const variantClasses = {
  default:
    "bg-brand-500 text-white hover:bg-brand-600 focus-visible:ring-brand-500",
  destructive:
    "bg-error-500 text-white hover:bg-error-600 focus-visible:ring-error-500",
  outline:
    "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-brand-500",
  secondary:
    "bg-gray-100 text-gray-700 hover:bg-gray-200 focus-visible:ring-gray-300",
  ghost:
    "bg-transparent text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-300",
  link: "bg-transparent text-brand-600 hover:text-brand-700 underline-offset-4 hover:underline",
} as const;

const sizeClasses = {
  default: "h-10 px-4 py-2",
  sm: "h-8 px-3 text-xs",
  lg: "h-11 px-6 text-sm",
  icon: "h-10 w-10",
} as const;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-50 disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button };
