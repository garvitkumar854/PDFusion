
"use client";

import { usePWAUpdater } from "@/hooks/use-pwa-updater";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "./ui/button";
import { ArrowDownToLine } from "lucide-react";

export default function UpdateNotifier() {
  const { isUpdateAvailable, updateApp } = usePWAUpdater();

  return (
    <AlertDialog open={isUpdateAvailable}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ArrowDownToLine className="w-5 h-5" />
            Update Available
          </AlertDialogTitle>
          <AlertDialogDescription>
            A new version of PDFusion is available. Refresh to get the latest features and improvements.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction asChild>
            <Button onClick={updateApp}>
              Refresh Now
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
