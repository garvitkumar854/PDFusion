
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
import { Reorder, useDragControls } from 'framer-motion';

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
}

const AssignmentItem = ({
  assignment,
  index,
  onEdit,
  onDelete,
}: AssignmentItemProps) => {
  const { user } = useAuth();
  const controls = useDragControls();
  
  return (
      <Card className="transition-shadow duration-300 rounded-xl w-full bg-card/50">
        <div className="flex items-center p-3 sm:p-4">
            <div 
              className="text-muted-foreground mr-3 sm:mr-4 shrink-0 flex items-center gap-2"
              onPointerDown={(e) => controls.start(e)}
            >
              <GripVertical className="cursor-grab"/>
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
    let reorderedList = [...newOrder];

    // When an item is moved, find its new date group and update its date
    const movedItem = reorderedList.find(item => assignments.find(a => a.id === item.id)?.order !== item.order);
    if(movedItem) {
        const movedIndex = reorderedList.findIndex(item => item.id === movedItem.id);
        const prevItem = reorderedList[movedIndex - 1];
        if (prevItem && prevItem.date !== movedItem.date) {
            movedItem.date = prevItem.date;
        }
    }
    
    // After potential date changes, re-sort the entire list by date first
    reorderedList.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Then, assign new order values based on the final position
    const finalOrderedAssignments = reorderedList.map((item, index) => ({
      ...item,
      order: index,
    }));
    
    setOrderedAssignments(finalOrderedAssignments);
    setHasReordered(true);
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
                 <Reorder.Group
                      axis="y"
                      values={orderedAssignments}
                      onReorder={handleReorder}
                      className="space-y-2"
                    >
                      {orderedAssignments.map((assignment, index) => {
                        const showDateHeader = assignment.date !== lastDate;
                        lastDate = assignment.date;
                        return (
                          <div key={assignment.id}>
                            {showDateHeader && (
                              <div className="font-semibold text-lg md:text-xl text-foreground my-3 pb-2 border-b-2 border-primary/20">
                                {format(parseISO(`${assignment.date}T00:00:00.000Z`), 'EEEE, MMM dd, yyyy')}
                              </div>
                            )}
                            <Reorder.Item value={assignment}>
                               <AssignmentItem
                                  assignment={assignment}
                                  index={index}
                                  onEdit={() => onEditAssignment(assignment)}
                                  onDelete={() => onDeleteAssignment(assignment.id)}
                                />
                            </Reorder.Item>
                          </div>
                        )
                      })}
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
