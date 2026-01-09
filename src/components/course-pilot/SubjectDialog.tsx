
'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface SubjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  initialName?: string;
  isEdit?: boolean;
}

export const SubjectDialog = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialName,
  isEdit,
}: SubjectDialogProps) => {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(initialName || '');
      setError('');
      setIsSaving(false);
      setIsDeleting(false);
    }
  }, [isOpen, initialName]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Subject name cannot be empty.');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      await onSave(name);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
      if (onDelete) {
          setIsDeleting(true);
          try {
              await onDelete();
              onClose();
          } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to delete subject');
          } finally {
              setIsDeleting(false);
          }
      }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Subject' : 'Add Subject'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Subject Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter>
            <div className="flex justify-end gap-2">
              {isEdit && onDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={isSaving || isDeleting}>
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the subject and all of its associated assignments.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
              )}
              <Button onClick={handleSave} disabled={isSaving || isDeleting}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
