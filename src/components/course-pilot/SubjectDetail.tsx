
'use client';
import { useState } from 'react';
import { ArrowLeft, Edit, Plus, Trash2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '../ui/button';
import { Card, CardDescription, CardTitle } from '../ui/card';
import AnimateOnScroll from '../AnimateOnScroll';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
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

interface Assignment {
  id: string;
  title: string;
  description: string;
  date: string;
}

interface SortableAssignmentItemProps {
  assignment: Assignment;
  canReorder: boolean;
  onEdit: () => void;
  onDelete: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const SortableAssignmentItem = ({
  assignment,
  canReorder,
  onEdit,
  onDelete,
  isFirst,
  isLast
}: SortableAssignmentItemProps) => {
  const { user } = useAuth();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: assignment.id,
    disabled: !canReorder,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formattedDate = format(new Date(assignment.date), "MMM dd, yyyy");

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...(canReorder ? listeners : {})}>
      <Card className={cn(
          "transition-shadow duration-300",
          isFirst && isLast ? "rounded-xl" : "",
          isFirst && !isLast ? "rounded-t-xl rounded-b-none" : "",
          !isFirst && isLast ? "rounded-b-xl rounded-t-none" : "",
          !isFirst && !isLast ? "rounded-none" : "",
          !isFirst && "border-t-0"
      )}>
        <div className="flex justify-between items-start p-3 sm:p-4">
            <div className="flex-1 space-y-1 min-w-0 pr-4">
                <CardTitle className="text-base font-bold text-sm md:text-base break-words">{assignment.title}</CardTitle>
                {assignment.description && <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap break-words">{assignment.description}</p>}
            </div>
            <div className="flex flex-col items-end text-right shrink-0">
                <CardDescription className="text-xs font-semibold whitespace-nowrap mb-1">{formattedDate}</CardDescription>
                {user && (
                    <div className="flex items-center">
                       <Button variant="ghost" size="icon" onClick={onEdit} className="w-8 h-8">
                          <Edit className="w-4 h-4"/>
                       </Button>
                       <AlertDialog>
                         <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                               <Trash2 className="w-4 h-4"/>
                           </Button>
                         </AlertDialogTrigger>
                         <AlertDialogContent>
                           <AlertDialogHeader>
                             <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                             <AlertDialogDescription>
                               This will permanently delete the assignment. This action cannot be undone.
                             </AlertDialogDescription>
                           </AlertDialogHeader>
                           <AlertDialogFooter>
                             <AlertDialogCancel>Cancel</AlertDialogCancel>
                             <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                           </AlertDialogFooter>
                         </AlertDialogContent>
                       </AlertDialog>
                    </div>
                )}
            </div>
        </div>
      </Card>
    </div>
  );
};

interface SubjectDetailProps {
  subjectName: string;
  assignments: Assignment[];
  onBack: () => void;
  onAddAssignment: () => void;
  onEditAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (id: string) => void;
  canReorder: boolean;
  onReorderAssignments: (orderedIds: string[]) => void;
}

export const SubjectDetail = ({
  subjectName,
  assignments,
  onBack,
  onAddAssignment,
  onEditAssignment,
  onDeleteAssignment,
  canReorder,
  onReorderAssignments,
}: SubjectDetailProps) => {
  const { user } = useAuth();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = assignments.findIndex((a) => a.id === active.id);
      const newIndex = assignments.findIndex((a) => a.id === over.id);
      const newOrder = arrayMove(assignments, oldIndex, newIndex);
      onReorderAssignments(newOrder.map((a) => a.id));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <AnimateOnScroll animation="animate-in fade-in-0 slide-in-from-bottom-12" className="duration-500">
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={onBack} className="shrink-0">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div className="min-w-0 flex-1">
                      <h1 className="text-2xl/tight sm:text-3xl/tight md:text-4xl/tight font-bold break-words">{subjectName}</h1>
                      <p className="text-muted-foreground">{assignments.length} assignments</p>
                  </div>
                </div>
                 {user && (
                    <Button className="w-full sm:w-auto" onClick={onAddAssignment}>
                        <Plus className="w-4 h-4 mr-2"/>
                        Add Assignment
                    </Button>
                 )}
            </div>

            {assignments.length > 0 ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={assignments.map((a) => a.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-0">
                    {assignments.map((assignment, index) => (
                        <SortableAssignmentItem
                        key={assignment.id}
                        assignment={assignment}
                        canReorder={canReorder}
                        onEdit={() => onEditAssignment(assignment)}
                        onDelete={() => onDeleteAssignment(assignment.id)}
                        isFirst={index === 0}
                        isLast={index === assignments.length - 1}
                        />
                    ))}
                    </div>
                </SortableContext>
                </DndContext>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No assignments yet</h3>
                    <p className="text-muted-foreground mt-2">Click "Add Assignment" to get started.</p>
                </div>
            )}
        </AnimateOnScroll>
    </div>
  );
};
