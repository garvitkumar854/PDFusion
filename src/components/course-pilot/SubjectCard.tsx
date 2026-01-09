
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Pencil } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

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
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl">{name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground">
          {assignmentCount} {assignmentCount === 1 ? 'assignment' : 'assignments'}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={onView}>View Assignments</Button>
        {user && (
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <Pencil className="w-4 h-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
