
'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  GoogleAuthProvider,
  signInWithPopup,
  GithubAuthProvider,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Chrome } from 'lucide-react';

export const LoginDialog = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const handleLogin = async (provider: GoogleAuthProvider | GithubAuthProvider) => {
    try {
      await signInWithPopup(auth, provider);
      onClose();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Admin Login</DialogTitle>
          <DialogDescription>
            Please log in to add, edit, or delete content.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button onClick={() => handleLogin(new GoogleAuthProvider())} className="w-full">
            <Chrome className="w-4 h-4 mr-2" />
            Sign in with Google
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
