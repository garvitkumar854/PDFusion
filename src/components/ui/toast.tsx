
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
      "fixed bottom-0 right-0 z-[100] flex w-full flex-col-reverse gap-3 p-4 sm:p-6 md:max-w-md",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center space-x-3 overflow-hidden rounded-xl border p-4 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full",
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
  <div className="flex items-center h-full">
    <ToastPrimitives.Close
      ref={ref}
      className={cn(
        "rounded-md p-1 text-foreground/50 opacity-70 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring group-hover:opacity-100",
        className
      )}
      toast-close=""
      {...props}
    >
      <X className="h-5 w-5" />
    </ToastPrimitives.Close>
  </div>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
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
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName


const ToastIcon = ({ variant }: { variant: VariantProps<typeof toastVariants>["variant"] }) => {
  const iconBaseClasses = "h-5 w-5 shrink-0";
  const containerBaseClasses = "w-7 h-7 flex items-center justify-center rounded-full"
  
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
