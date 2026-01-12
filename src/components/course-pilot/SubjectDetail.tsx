
'use client';
import { useState, useEffect } from 'react';
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
import { Reorder, useDragControls, motion } from 'framer-motion';

interface Assignment {
  id: string;
  title: string;
  description: string;
  date: string;
  order: number;
}

interface AssignmentItemProps {
  assignment: Assignment;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
}

const AssignmentItem = ({
  assignment,
  index,
  onEdit,
  onDelete,
  isFirstInGroup,
  isLastInGroup,
}: AssignmentItemProps) => {
  const { user } = useAuth();
  const controls = useDragControls();
  
  return (
      <Card className={cn(
        "transition-shadow duration-300 w-full bg-card/50",
        isFirstInGroup && isLastInGroup ? 'rounded-xl' : '',
        isFirstInGroup && !isLastInGroup ? 'rounded-t-xl rounded-b-none' : '',
        !isFirstInGroup && isLastInGroup ? 'rounded-b-xl rounded-t-none' : '',
        !isFirstInGroup && !isLastInGroup ? 'rounded-none' : ''
      )}>
        <div className="flex items-center p-3 sm:p-4">
            <div className="text-muted-foreground mr-3 sm:mr-4 shrink-0 flex items-center gap-2">
              {user && (
                  <motion.div
                    onPointerDown={(e) => controls.start(e)}
                    className="cursor-grab"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                   >
                     <GripVertical />
                   </motion.div>
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

interface GroupedAssignments {
    [date: string]: Assignment[];
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
  
  useEffect(() => {
    const sortedAssignments = [...assignments].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.order - b.order);
    setOrderedAssignments(sortedAssignments);
  }, [assignments]);
  
  const handleReorder = (newOrder: Assignment[]) => {
    // Find the item that was moved and its new index
    const movedItemIndex = newOrder.findIndex((item, index) => item.id !== orderedAssignments[index]?.id);
    if (movedItemIndex === -1) return; // No change detected
    
    const movedItem = newOrder[movedItemIndex];

    // Determine target date based on surrounding items in the new visual order
    const previousItem = newOrder[movedItemIndex - 1];
    const nextItem = newOrder[movedItemIndex + 1];

    let targetDate = movedItem.date;
    if (previousItem && new Date(previousItem.date).getTime() > new Date(movedItem.date).getTime()) {
      targetDate = previousItem.date;
    } else if (nextItem && new Date(nextItem.date).getTime() < new Date(movedItem.date).getTime()) {
      targetDate = nextItem.date;
    } else if (previousItem && new Date(previousItem.date).getTime() < new Date(movedItem.date).getTime()) {
      // Intentionally do nothing, keep current date
    } else if (previousItem) {
      targetDate = previousItem.date;
    }

    // Create a new array with the updated date for the moved item
    const updatedOrder = newOrder.map(item => 
      item.id === movedItem.id ? { ...item, date: targetDate } : item
    );
      
    // Re-sort the entire list by date first, then apply new visual order as `order` property
    const finalOrderedAssignments = updatedOrder
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((item, index) => ({
        ...item,
        order: index,
      }));
        
    setOrderedAssignments(finalOrderedAssignments);
    setHasReordered(true);
  };


  const handleSaveOrder = () => {
    onReorderAssignments(orderedAssignments);
    setHasReordered(false);
  }

  const groupedAssignments = orderedAssignments.reduce((acc: GroupedAssignments, assignment) => {
    const date = assignment.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(assignment);
    return acc;
  }, {});
  
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
                 <Reorder.Group
                      axis="y"
                      values={orderedAssignments}
                      onReorder={user ? handleReorder : () => {}}
                      className="space-y-6"
                    >
                      {Object.entries(groupedAssignments).map(([date, assignmentsInGroup]) => (
                        <div key={date}>
                           <div className="font-semibold text-base sm:text-lg md:text-xl text-foreground mb-3 pb-2 border-b-2 border-primary/20">
                                {format(parseISO(`${date}T00:00:00.000Z`), 'EEEE, MMM dd, yyyy')}
                            </div>
                           <div className="space-y-px">
                            {assignmentsInGroup.map((assignment, index) => (
                                <Reorder.Item value={assignment} key={assignment.id} dragListener={!user ? false : undefined}>
                                   <AssignmentItem
                                      assignment={assignment}
                                      index={orderedAssignments.findIndex(a => a.id === assignment.id)}
                                      onEdit={() => onEditAssignment(assignment)}
                                      onDelete={() => onDeleteAssignment(assignment.id)}
                                      isFirstInGroup={index === 0}
                                      isLastInGroup={index === assignmentsInGroup.length - 1}
                                    />
                                </Reorder.Item>
                            ))}
                           </div>
                        </div>
                      ))}
                    </Reorder.Group>
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
