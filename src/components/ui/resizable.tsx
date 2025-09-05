
"use client"

import {
  Splitter as ResizablePrimitive,
  type SplitterProps as ResizablePrimitiveProps,
  type SplitterPanelProps as ResizablePrimitivePanelProps,
  type SplitterResizeHandleProps as ResizablePrimitiveResizeHandleProps,
} from "@ark-ui/react/splitter"

import { cn } from "@/lib/utils"

const ResizablePanelGroup = ({
  className,
  ...props
}: ResizablePrimitiveProps) => (
  <ResizablePrimitive
    className={cn(
      "flex h-full w-full data-[orientation=vertical]:flex-col",
      className
    )}
    {...props}
  />
)

const ResizablePanel = ({
  className,
  ...props
}: ResizablePrimitivePanelProps) => (
  <ResizablePrimitive.Panel
    className={cn("rounded-lg border", className)}
    {...props}
  />
)

const ResizableHandle = ({
  className,
  ...props
}: ResizablePrimitiveResizeHandleProps & { withHandle?: boolean }) => (
  <ResizablePrimitive.ResizeHandle
    className={cn(
      "flex w-px items-center justify-center bg-border",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
      "data-[orientation=vertical]:h-px data-[orientation=vertical]:w-full",
      "[&[data-orientation=horizontal]>div]:h-10 [&[data-orientation=horizontal]>div]:w-1",
      "[&[data-orientation=vertical]>div]:h-1 [&[data-orientation=vertical]>div]:w-10",
      className
    )}
    {...props}
  >
    <div className="z-10 flex h-4 w-1 items-center justify-center rounded-sm border bg-border" />
  </ResizablePrimitive.ResizeHandle>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
