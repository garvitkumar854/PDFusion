
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
            className={cn("w-full sm:w-auto")}
            {...props}
          >
            <div className="flex items-start gap-2 sm:gap-3 w-full">
              <ToastIcon variant={variant} />
              <div className="grid gap-1 flex-1">
                {title && <ToastTitle className="text-xs sm:text-sm">{title}</ToastTitle>}
                {description && (
                  <ToastDescription className="text-xs">{description}</ToastDescription>
                )}
              </div>
              {action}
              <ToastClose />
            </div>
            <ToastProgressBar variant={variant} duration={duration || (isMobile ? 2000 : 4000)} />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
