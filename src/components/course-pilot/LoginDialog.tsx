
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';

import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

export const LoginDialog = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<boolean | 'google' | 'email'>(false);

  const { signIn } = useAuth();
  const { toast } = useToast();

  // 🔐 Email/Password Login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('email');

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Please check your email and password.',
      });
      setLoading(false);
      return;
    }

    toast({
      variant: 'success',
      title: 'Login Successful',
      description: "You're now logged in.",
    });

    setEmail('');
    setPassword('');
    setLoading(false);
    onClose();
  };

  // 🔵 Google Login
  const handleGoogleLogin = async () => {
    setLoading('google');
    try {
      await signInWithPopup(auth, googleProvider);

      toast({
        variant: 'success',
        title: 'Login Successful',
        description: "You're now logged in with Google.",
      });

      onClose();
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Google Login Failed',
        description: 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Admin Login</DialogTitle>
          <DialogDescription>
            Log in to add, edit, or delete content.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
             {/* Google Login */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={!!loading}
            >
              {loading === 'google' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Image src="/google.svg" alt="Google" width={16} height={16} className="mr-2"/>
              )}
              Continue with Google
            </Button>
            
            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={!!loading}
                />
                </div>

                {/* Password */}
                <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative flex items-center">
                    <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={!!loading}
                    className="pr-10"
                    />
                    <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-1 h-8 w-8 text-muted-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={!!loading}
                    >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </Button>
                </div>
                </div>

                <DialogFooter>
                    <Button type="submit" disabled={!!loading} className="w-full">
                    {loading === 'email' && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {loading === 'email' ? 'Logging in...' : 'Login with Email'}
                    </Button>
                </DialogFooter>
            </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
