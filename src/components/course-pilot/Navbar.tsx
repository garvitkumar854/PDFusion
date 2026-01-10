
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '../ui/button';
import { LogIn, LogOut, Plus } from 'lucide-react';
import { getFirebaseInstances } from '@/lib/firebase';

export const Navbar = ({
  onLoginClick,
  onAddSubjectClick,
}: {
  onLoginClick: () => void;
  onAddSubjectClick: () => void;
}) => {
  const { user, loading } = useAuth();
  const { auth } = getFirebaseInstances();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <span className="font-bold text-xl text-blue-600">CoursePilot</span>
          </div>
          <div className="flex items-center gap-2">
            {!loading && user && (
              <Button size="sm" onClick={onAddSubjectClick}>
                <Plus size={16} className="mr-2" />
                Add Subject
              </Button>
            )}
            {!loading && auth &&
              (user ? (
                <Button size="sm" variant="ghost" onClick={() => auth.signOut()}>
                  <LogOut size={16} className="mr-2" />
                  Logout
                </Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={onLoginClick}>
                  <LogIn size={16} className="mr-2" />
                  Admin Login
                </Button>
              ))}
          </div>
        </div>
      </div>
    </nav>
  );
};
