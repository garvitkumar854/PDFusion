
"use client"

import { useToast } from "@/hooks/use-toast"
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

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, duration, ...props }) {
        return (
          <Toast key={id} variant={variant} className="p-3 sm:p-4" {...props}>
            <ToastIcon variant={variant} />
            <div className="grid gap-1 flex-1">
              {title && <ToastTitle className="text-sm font-semibold">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-xs sm:text-sm">{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
            <ToastProgressBar variant={variant} duration={duration || 5000} />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
