
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Pencil } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';
import AnimatedArrow from '../AnimatedArrow';
import { cn } from '@/lib/utils';

interface SubjectCardProps {
  id: string;
  name: string;
  assignmentCount: number;
  onView: () => void;
  onEdit: () => void;
}

export const SubjectCard = ({
  name,
  assignmentCount,
  onView,
  onEdit,
}: SubjectCardProps) => {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="group relative h-full">
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary to-blue-400 opacity-0 blur transition-all duration-300 group-hover:opacity-75"></div>
      <Card className="relative flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-300 group-hover:shadow-lg">
        <CardHeader className="flex-grow pb-4">
          <CardTitle className="text-xl font-bold text-foreground transition-colors duration-300 group-hover:text-primary">{name}</CardTitle>
        </CardHeader>
        <CardFooter className="flex items-center justify-between border-t bg-background/50 px-6 py-4">
          <p className="text-sm text-muted-foreground">
            {assignmentCount} {assignmentCount === 1 ? 'assignment' : 'assignments'}
          </p>
          <div className="flex items-center gap-1">
              <Button 
                  variant="secondary"
                  onClick={onView}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  className="font-semibold"
              >
                  View
                  <AnimatedArrow isHovered={isHovered} />
              </Button>
              {user && (
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(); }} className="h-9 w-9">
                  <Pencil className="h-4 w-4" />
              </Button>
              )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
