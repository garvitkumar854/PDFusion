
"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { PDFDocument } from 'pdf-lib';
import { Loader2, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface PasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  file: File;
  onUnlock: (unlockedDoc: PDFDocument, unlockedFile: File) => void;
}

export function PasswordDialog({ isOpen, onOpenChange, file, onUnlock }: PasswordDialogProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const pdfBytes = await file.arrayBuffer();
      let pdfDoc;

      try {
        pdfDoc = await PDFDocument.load(pdfBytes, { password });
      } catch (e: any) {
        if (e.name === 'PasswordIsIncorrectError') {
          setError('Incorrect password. Please try again.');
          setIsSubmitting(false);
          return;
        }
        
        // If it's another error, try loading without a password just in case.
        // This handles files incorrectly flagged as encrypted.
        try {
            pdfDoc = await PDFDocument.load(pdfBytes);
            toast({ title: "This PDF was not encrypted.", description: "Proceeding with the original file." });
        } catch (finalError) {
             throw new Error('Could not load the PDF. It may be corrupted or in an unsupported format.');
        }
      }

      // Re-save the document to remove encryption.
      const unlockedPdfBytes = await pdfDoc.save();
      const unlockedFile = new File([unlockedPdfBytes], file.name, { type: 'application/pdf' });

      onUnlock(pdfDoc, unlockedFile);
      onOpenChange(false);
      
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleClose = () => {
    if (isSubmitting) return;
    onOpenChange(false);
    setPassword('');
    setError(null);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Password Required</DialogTitle>
          <DialogDescription>
            The file "{file.name}" is encrypted. Please enter the password to continue.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password-input">Password</Label>
            <div className="relative">
              <Input
                id="password-input"
                value={password}
                onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                }}
                type={showPassword ? 'text' : 'password'}
                className={cn('pr-10', error && 'border-destructive focus-visible:ring-destructive')}
                disabled={isSubmitting}
                placeholder="Enter PDF password"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowPassword((p) => !p)}
                tabIndex={-1}
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            {error && (
              <p className="text-destructive text-sm flex items-center gap-2 pt-1">
                <ShieldAlert className="w-4 h-4" />
                {error}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Unlock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
