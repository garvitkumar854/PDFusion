
'use client';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import AnimateOnScroll from '../AnimateOnScroll';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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
        <CardHeader className="flex flex-row justify-between items-start pb-2">
            <div className="flex-1 space-y-0.5">
                <CardTitle className="text-base font-bold">{assignment.title}</CardTitle>
                <CardDescription className="text-xs">{formattedDate}</CardDescription>
            </div>
            {user && (
                <div className="flex items-center gap-1 -mr-2 -mt-2">
                    <Button variant="ghost" size="icon" onClick={onEdit}>
                        <Edit className="w-4 h-4"/>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4"/>
                    </Button>
                </div>
            )}
        </CardHeader>
        <CardContent className="pt-2">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{assignment.description}</p>
        </CardContent>
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
            <div className="flex items-center gap-4 mb-8">
                <Button variant="outline" size="icon" onClick={onBack}>
                <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold">{subjectName}</h1>
                    <p className="text-muted-foreground">{assignments.length} assignments</p>
                </div>
                 {user && (
                    <Button className="ml-auto" onClick={onAddAssignment}>
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
