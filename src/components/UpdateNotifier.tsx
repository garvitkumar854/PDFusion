
"use client";

import React from "react";
import { usePWAUpdater } from "@/hooks/use-pwa-updater";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { ArrowDownToLine } from "lucide-react";

export default function UpdateNotifier() {
  const { isUpdateAvailable, updateApp } = usePWAUpdater();
  const { toast } = useToast();

  React.useEffect(() => {
    if (isUpdateAvailable) {
      toast({
        variant: "info",
        title: "Update Available",
        description: "A new version of PDFusion is ready. Click to update.",
        duration: Infinity, // Keep the toast until user interaction
        action: (
          <Button onClick={updateApp} size="sm">
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            Update
          </Button>
        ),
      });
    }
  }, [isUpdateAvailable, updateApp, toast]);

  return null; // The component itself doesn't render anything
}
