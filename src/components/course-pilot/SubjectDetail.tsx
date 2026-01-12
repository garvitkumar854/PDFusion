
'use client';
import { useState, useEffect } from 'react';
import { ArrowLeft, Edit, MoreVertical, Plus, Trash2, GripVertical, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardDescription, CardTitle } from '../ui/card';
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
import { Reorder } from 'framer-motion';

interface Assignment {
  id: string;
  title: string;
  description: string;
  date: string;
  order?: number;
}

interface AssignmentItemProps {
  assignment: Assignment;
  onEdit: () => void;
  onDelete: () => void;
}

const AssignmentItem = ({
  assignment,
  onEdit,
  onDelete,
}: AssignmentItemProps) => {
  const { user } = useAuth();
  
  return (
      <Card className="transition-shadow duration-300 rounded-xl w-full">
        <div className="flex items-center p-3 sm:p-4">
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
                <GripVertical className="cursor-grab text-muted-foreground" />
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

const groupAssignmentsByDate = (assignments: Assignment[]) => {
  if (!assignments) return {};
  return assignments.reduce((acc, assignment) => {
    const date = assignment.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(assignment);
    return acc;
  }, {} as Record<string, Assignment[]>);
};

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
    setOrderedAssignments(assignments);
  }, [assignments]);
  
  const groupedAssignments = groupAssignmentsByDate(orderedAssignments);
  const sortedDates = Object.keys(groupedAssignments).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const handleReorderGroup = (date: string, newOrder: Assignment[]) => {
    const newOrderedAssignments = [...orderedAssignments];
    const groupIds = new Set(newOrder.map(a => a.id));
    
    // Filter out the old items from the group
    const withoutGroup = newOrderedAssignments.filter(a => !groupIds.has(a.id));
    
    // Find the insertion index
    const firstItemIdInGroup = newOrder[0]?.id;
    let insertionIndex = newOrderedAssignments.findIndex(a => a.id === firstItemIdInGroup);
    if(insertionIndex === -1) {
       // if for some reason we can't find it, append at the end of the date group
       const lastItemOfPreviousDate = [...newOrderedAssignments].reverse().find(a => new Date(a.date) < new Date(date));
       if (lastItemOfPreviousDate) {
         insertionIndex = newOrderedAssignments.findIndex(a => a.id === lastItemOfPreviousDate.id) + 1;
       } else {
         insertionIndex = 0;
       }
    }
    
    // Re-insert the reordered group
    const finalOrderedList = [
      ...withoutGroup.slice(0, insertionIndex),
      ...newOrder,
      ...withoutGroup.slice(insertionIndex)
    ];

    setOrderedAssignments(finalOrderedList);
    setHasReordered(true);
  };
  
  const handleSaveOrder = () => {
    onReorderAssignments(orderedAssignments);
    setHasReordered(false);
  }

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
                <div className="space-y-6">
                {sortedDates.map((date) => (
                  <div key={date}>
                     <div className="font-semibold text-lg text-foreground mb-3 pb-2 border-b-2 border-primary/20">
                      {format(parseISO(`${date}T00:00:00.000Z`), 'EEEE, MMM dd, yyyy')}
                    </div>
                    <Reorder.Group
                      axis="y"
                      values={groupedAssignments[date]}
                      onReorder={(newOrder) => handleReorderGroup(date, newOrder)}
                      className="space-y-2"
                    >
                      {groupedAssignments[date].map((assignment, index) => (
                        <Reorder.Item key={assignment.id} value={assignment}>
                           <AssignmentItem
                              assignment={assignment}
                              onEdit={() => onEditAssignment(assignment)}
                              onDelete={() => onDeleteAssignment(assignment.id)}
                            />
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  </div>
                ))}
                </div>
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
