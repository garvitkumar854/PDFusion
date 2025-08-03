
"use client"

import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"
import { useIsMobile } from "./use-mobile"

const TOAST_LIMIT = 4;
const TOAST_REMOVE_DELAY_DESKTOP = 5000;
const TOAST_REMOVE_DELAY_MOBILE = 3000;


type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  duration?: number
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
      isMobile: boolean
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string, duration?: number) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, duration)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      const { isMobile, toast } = action;
      if (isMobile) {
        // On mobile, replace all existing toasts with the new one
        state.toasts.forEach(t => {
            if (toastTimeouts.has(t.id)) {
                clearTimeout(toastTimeouts.get(t.id));
                toastTimeouts.delete(t.id);
            }
        });
        return {
            ...state,
            toasts: [toast],
        }
      }
      // On desktop, add to the list and limit
      const toasts = [toast, ...state.toasts].slice(0, TOAST_LIMIT);
      return {
        ...state,
        toasts,
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      const toastToRemove = state.toasts.find(t => t.id === toastId)
      
      const removeDelay = typeof window !== 'undefined' && window.innerWidth < 640 ? TOAST_REMOVE_DELAY_MOBILE : TOAST_REMOVE_DELAY_DESKTOP;

      if (toastId) {
        addToRemoveQueue(toastId, toastToRemove?.duration || removeDelay)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id, toast.duration || removeDelay)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const removeDelay = props.duration || (isMobile ? TOAST_REMOVE_DELAY_MOBILE : TOAST_REMOVE_DELAY_DESKTOP);


  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
      duration: removeDelay
    },
    isMobile,
  })
  
  setTimeout(() => {
    dismiss();
  }, removeDelay);


  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
