
"use client"

import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  ToastIcon,
  ToastProgressBar,
} from "@/components/ui/toast"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts } = useToast()
  const isMobile = useIsMobile();

  const renderedToasts = isMobile ? (toasts.length > 0 ? [toasts[toasts.length - 1]] : []) : toasts;

  return (
    <ToastProvider>
      {renderedToasts.map(function ({ id, title, description, action, variant, duration, ...props }) {
        return (
          <Toast 
            key={id} 
            variant={variant} 
            className={cn(
              "w-full sm:w-auto",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80",
              "data-[state=open]:slide-in-from-top-full data-[state=closed]:slide-out-to-right-full",
              "sm:data-[state=open]:slide-in-from-bottom-full"
            )}
            {...props}
          >
            <div className="flex items-start gap-3 w-full">
              <ToastIcon variant={variant} />
              <div className="grid gap-1 flex-1">
                {title && <ToastTitle className="text-sm">{title}</ToastTitle>}
                {description && (
                  <ToastDescription className="text-xs sm:text-sm">{description}</ToastDescription>
                )}
              </div>
              {action}
              <ToastClose />
            </div>
            <ToastProgressBar variant={variant} duration={duration || (isMobile ? 3000 : 5000)} />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
