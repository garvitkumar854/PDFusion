
"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px] gap-3",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center space-x-3 overflow-hidden rounded-xl border p-3 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-left-full data-[state=closed]:slide-out-to-right-full sm:p-4 sm:data-[state=open]:slide-in-from-bottom-full sm:data-[state=open]:slide-in-from-right-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive: "destructive group border-red-500/50 bg-background text-foreground",
        success: "success group border-green-500/50 bg-background text-foreground",
        warning: "warning group border-yellow-500/50 bg-background text-foreground",
        info: "info group border-blue-500/50 bg-background text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const ToastProgressBar = ({ variant, duration }: { variant: VariantProps<typeof toastVariants>["variant"], duration: number }) => {
  const colorClass = 
    variant === 'success' ? 'bg-green-500' :
    variant === 'destructive' ? 'bg-red-500' :
    variant === 'warning' ? 'bg-orange-500' :
    variant === 'info' ? 'bg-blue-500' :
    'bg-primary';

  return (
    <div className="absolute bottom-0 left-0 h-1 w-full overflow-hidden rounded-b-xl">
        <div 
          className={cn("h-full origin-left", colorClass)}
          style={{ animation: `toast-progress ${duration / 1000}s linear forwards` }}
        ></div>
    </div>
  );
};


const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName


const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      "group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      "group-[.success]:border-muted/40 group-[.success]:hover:border-green-500/30 group-[.success]:hover:bg-green-500 group-[.success]:hover:text-white group-[.success]:focus:ring-green-500",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-foreground/50 opacity-100 transition-opacity focus:outline-none disabled:pointer-events-none",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName


const ToastIcon = ({ variant }: { variant: VariantProps<typeof toastVariants>["variant"] }) => {
  const iconBaseClasses = "h-4 w-4 shrink-0";
  const containerBaseClasses = "w-6 h-6 flex items-center justify-center rounded-full"
  
  switch (variant) {
    case "success":
      return <div className={cn(containerBaseClasses, "bg-green-100 dark:bg-green-900/30")}><CheckCircle className={cn(iconBaseClasses, "text-green-500 dark:text-green-400")} /></div>;
    case "destructive":
      return <div className={cn(containerBaseClasses, "bg-red-100 dark:bg-red-900/30")}><AlertCircle className={cn(iconBaseClasses, "text-red-500 dark:text-red-400")} /></div>;
    case "warning":
      return <div className={cn(containerBaseClasses, "bg-orange-100 dark:bg-orange-900/30")}><AlertTriangle className={cn(iconBaseClasses, "text-orange-500 dark:text-orange-400")} /></div>;
    case "info":
       return <div className={cn(containerBaseClasses, "bg-blue-100 dark:bg-blue-900/30")}><Info className={cn(iconBaseClasses, "text-blue-500 dark:text-blue-400")} /></div>;
    default:
      return null;
  }
};


type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  ToastIcon,
  ToastProgressBar,
}
