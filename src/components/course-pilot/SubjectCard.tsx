
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Pencil } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';
import AnimatedArrow from '../AnimatedArrow';

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
    <Card className="flex flex-col group">
      <CardHeader className="flex-grow">
        <CardTitle className="text-xl group-hover:text-primary transition-colors">{name}</CardTitle>
      </CardHeader>
      <CardFooter className="flex items-center justify-between">
         <p className="text-sm text-muted-foreground">
          {assignmentCount} {assignmentCount === 1 ? 'assignment' : 'assignments'}
        </p>
        <div className="flex items-center gap-1">
            <Button 
                variant="ghost" 
                onClick={onView}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="font-semibold"
            >
                View
                <AnimatedArrow isHovered={isHovered} />
            </Button>
            {user && (
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(); }} className="w-8 h-8">
                <Pencil className="w-4 h-4" />
            </Button>
            )}
        </div>
      </CardFooter>
    </Card>
  );
};
