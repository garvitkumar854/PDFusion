
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
import { unlockPdf } from "@/ai/flows/unlock-pdf-flow";


interface PasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pdfFile: File | null;
  onSuccess: (url: string, wasEncrypted: boolean) => void;
}

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export function PasswordDialog({ isOpen, onClose, pdfFile, onSuccess }: PasswordDialogProps) {
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [passwordValue, setPasswordValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        passwordInputRef.current?.focus();
        setPasswordValue("");
        setError(null);
        setShowPassword(false);
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValue || !pdfFile || isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
        const pdfDataUri = await fileToDataUri(pdfFile);
        const response = await unlockPdf({ pdfDataUri, password: passwordValue });

        const blob = await fetch(response.unlockedPdfDataUri).then(res => res.blob());
        const url = URL.createObjectURL(blob);
        
        onSuccess(url, response.wasEncrypted);

    } catch (e: any) {
        setError(e.message || "An unexpected error occurred.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="max-w-[90vw] sm:max-w-md rounded-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Unlock PDF</DialogTitle>
            <DialogDescription>
              Enter the password for <span className="font-semibold text-foreground truncate">{pdfFile?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          
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
                        disabled={isSubmitting}
                    />
                    <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPassword(p => !p)}
                    tabIndex={-1}
                    disabled={isSubmitting}
                    >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                </div>
                </div>
                {error && <p className="text-destructive text-sm text-center col-span-4 -mt-2">{error}</p>}
            </div>

            <DialogFooter>
                <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !passwordValue}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Unlock
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
