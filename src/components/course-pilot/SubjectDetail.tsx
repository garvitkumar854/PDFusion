
'use client';
import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Edit, MoreVertical, Plus, Trash2, GripVertical, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardTitle } from '../ui/card';
import AnimateOnScroll from '../AnimateOnScroll';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Assignment {
  id: string;
  title: string;
  description: string;
  date: string;
  order: number;
}

interface SortableAssignmentItemProps {
  assignment: Assignment;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
}

const SortableAssignmentItem = ({ assignment, index, onEdit, onDelete, isFirstInGroup, isLastInGroup }: SortableAssignmentItemProps) => {
  const { user } = useAuth();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: assignment.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
  };
  
  const cardElement = (
      <Card className={cn(
        "transition-shadow duration-300 w-full bg-card/50",
        isFirstInGroup && isLastInGroup ? 'rounded-xl' : '',
        isFirstInGroup && !isLastInGroup ? 'rounded-t-xl rounded-b-none border-b-0' : '',
        !isFirstInGroup && isLastInGroup ? 'rounded-b-xl rounded-t-none' : '',
        !isFirstInGroup && !isLastInGroup ? 'rounded-none border-t-0 border-b-0' : '',
        isDragging && "shadow-2xl opacity-50"
      )}>
        <div className="flex items-center p-3 sm:p-4">
            <div className="text-muted-foreground mr-3 sm:mr-4 shrink-0 flex items-center gap-2">
              {user && (
                  <div {...listeners} className="cursor-grab touch-none p-1">
                     <GripVertical />
                   </div>
              )}
              <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                {index + 1}
              </div>
            </div>
            <div className="flex-1 space-y-1 min-w-0">
                <CardTitle className="text-base font-bold text-sm md:text-base break-words">{assignment.title}</CardTitle>
                {assignment.description && <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap break-words">{assignment.description}</p>}
            </div>
            <div className="flex items-center gap-2 text-right shrink-0 ml-4">
                {user && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-8 h-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                       <DropdownMenuItem onClick={onEdit}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500 focus:bg-red-500/10 focus:text-red-500">
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
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
                              <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
            </div>
        </div>
      </Card>
  )

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
        {cardElement}
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
  onReorderAssignments: (orderedAssignments: Assignment[]) => void;
}

export const SubjectDetail = ({
  subjectName,
  assignments,
  onBack,
  onAddAssignment,
  onEditAssignment,
  onDeleteAssignment,
  onReorderAssignments,
}: SubjectDetailProps) => {
  const { user } = useAuth();
  const [orderedAssignments, setOrderedAssignments] = useState(assignments);
  const [hasReordered, setHasReordered] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  
  useEffect(() => {
    const sortedAssignments = [...assignments].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.order - b.order);
    setOrderedAssignments(sortedAssignments);
  }, [assignments]);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveAssignment(orderedAssignments.find(a => a.id === active.id) || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveAssignment(null);
    if (over && active.id !== over.id) {
      const oldIndex = orderedAssignments.findIndex((item) => item.id === active.id);
      const newIndex = orderedAssignments.findIndex((item) => item.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;
      
      const activeItem = orderedAssignments[oldIndex];
      const overItem = orderedAssignments[newIndex];
      
      const items = arrayMove(orderedAssignments, oldIndex, newIndex);

      // Determine the new date for the dragged item
      const newDate = overItem.date;
      
      const finalAssignments = items.map((item, index) => ({
        ...item,
        date: item.id === active.id ? newDate : item.date, // Apply new date to dragged item
        order: index,
      }));
      
      const sorted = finalAssignments.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.order - b.order);
      
      setOrderedAssignments(sorted);
      setHasReordered(true);
    }
  }

  const handleSaveOrder = () => {
    onReorderAssignments(orderedAssignments);
    setHasReordered(false);
  }

  let lastDate: string | null = null;

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
                <div className="flex gap-2 items-center">
                  {hasReordered && user && (
                    <Button variant="secondary" onClick={handleSaveOrder}>
                      <Check className="w-4 h-4 mr-2" />
                      Save Order
                    </Button>
                  )}
                  {user && (
                      <Button className="w-full sm:w-auto" onClick={onAddAssignment}>
                          <Plus className="w-4 h-4 mr-2"/>
                          Add Assignment
                      </Button>
                  )}
                </div>
            </div>

            {assignments.length > 0 ? (
                 <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <SortableContext items={orderedAssignments.map(a => a.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-px">
                        {orderedAssignments.map((assignment, index) => {
                          const showDateHeading = assignment.date !== lastDate;
                          lastDate = assignment.date;

                          // Find all items in the current group to determine the last one
                          const groupItems = orderedAssignments.filter(a => a.date === assignment.date);
                          const isLastInGroup = groupItems[groupItems.length - 1].id === assignment.id;
                          const isFirstInGroup = groupItems[0].id === assignment.id;
                          
                          return (
                            <div key={assignment.id}>
                              {showDateHeading && (
                                <div className="font-semibold text-base sm:text-lg md:text-xl text-foreground mt-6 mb-3 pb-2 border-b-2 border-primary/20">
                                  {format(parseISO(`${assignment.date}T00:00:00.000Z`), 'EEEE, MMM dd, yyyy')}
                                </div>
                              )}
                              <SortableAssignmentItem
                                assignment={assignment}
                                index={index}
                                onEdit={() => onEditAssignment(assignment)}
                                onDelete={() => onDeleteAssignment(assignment.id)}
                                isFirstInGroup={isFirstInGroup}
                                isLastInGroup={isLastInGroup}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </SortableContext>
                     <DragOverlay>
                        {activeAssignment ? (
                          <SortableAssignmentItem
                            assignment={activeAssignment}
                            index={orderedAssignments.findIndex(a => a.id === activeAssignment.id)}
                            onEdit={() => {}}
                            onDelete={() => {}}
                            isFirstInGroup={true}
                            isLastInGroup={true}
                          />
                        ) : null}
                    </DragOverlay>
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
