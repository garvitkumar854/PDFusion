
"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  isSubmitting: boolean;
  error: string | null;
  fileName: string | null;
  children?: React.ReactNode;
}

export function PasswordDialog({ isOpen, onClose, onSubmit, isSubmitting, error, fileName, children }: PasswordDialogProps) {
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        passwordInputRef.current?.focus();
        // Reset state only when dialog opens, not on re-renders
        if (!isSubmitting) {
           setPasswordValue("");
        }
        setShowPassword(false);
      }, 100);
    }
  }, [isOpen, isSubmitting]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordValue && !isSubmitting) {
      onSubmit(passwordValue);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[90vw] sm:max-w-md rounded-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Password Required</DialogTitle>
            <DialogDescription>
              The file <span className="font-semibold text-foreground truncate">{fileName}</span> is password protected.
            </DialogDescription>
          </DialogHeader>
          
          {children ? (
            <div className="py-4">{children}</div>
          ) : (
            <div className="grid gap-4 py-4">
                <div className={cn("grid grid-cols-4 items-center gap-4", isSubmitting && "opacity-50 pointer-events-none")}>
                <Label htmlFor="password-input" className="text-right">
                    Password
                </Label>
                <div className="col-span-3 relative">
                    <Input
                        id="password-input"
                        ref={passwordInputRef}
                        value={passwordValue}
                        onChange={(e) => setPasswordValue(e.target.value)}
                        type={showPassword ? "text" : "password"}
                        className="pr-10"
                    />
                    <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPassword(p => !p)}
                    tabIndex={-1}
                    >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                </div>
                </div>
                {error && <p className="text-destructive text-sm text-center col-span-4 -mt-2">{error}</p>}
            </div>
          )}

          {!children && (
            <DialogFooter>
                <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !passwordValue}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Unlock
                </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
