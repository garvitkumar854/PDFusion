
'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';

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
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(initialName || '');
      setError('');
      setIsSaving(false);
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
      if (onDelete && confirm('Are you sure you want to delete this subject? All associated assignments will also be deleted.')) {
          try {
              await onDelete();
              onClose();
          } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to delete subject');
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
        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between w-full">
            <div>
            {isEdit && onDelete && (
                <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>Delete</Button>
            )}
            </div>
            <div className="flex justify-end gap-2">
                 <DialogClose asChild>
                   <Button variant="outline">Cancel</Button>
                 </DialogClose>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save'}
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
