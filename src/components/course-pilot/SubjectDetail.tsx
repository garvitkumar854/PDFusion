
'use client';
import { useState } from 'react';
import { ArrowLeft, Edit, MoreVertical, Plus, Trash2 } from 'lucide-react';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


interface Assignment {
  id: string;
  title: string;
  description: string;
  date: string;
}

interface AssignmentItemProps {
  assignment: Assignment;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const AssignmentItem = ({
  assignment,
  index,
  onEdit,
  onDelete,
  isFirst,
  isLast
}: AssignmentItemProps) => {
  const { user } = useAuth();
  const formattedDate = format(new Date(assignment.date), "MMM dd, yyyy");

  return (
      <Card className={cn(
          "transition-shadow duration-300",
          isFirst && isLast ? "rounded-xl" : "",
          isFirst && !isLast ? "rounded-t-xl rounded-b-none" : "",
          !isFirst && isLast ? "rounded-b-xl rounded-t-none" : "",
          !isFirst && !isLast ? "rounded-none" : "",
          !isFirst && "border-t-0"
      )}>
        <div className="flex items-center p-3 sm:p-4">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0 mr-4">
                {index + 1}
            </div>
            <div className="flex-1 space-y-1 min-w-0">
                <CardTitle className="text-base font-bold text-sm md:text-base break-words">{assignment.title}</CardTitle>
                {assignment.description && <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap break-words">{assignment.description}</p>}
            </div>
            <div className="flex items-center gap-2 text-right shrink-0 ml-4">
                <CardDescription className="text-xs font-semibold whitespace-nowrap">{formattedDate}</CardDescription>
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
  canReorder: boolean; // Kept for prop compatibility, but not used.
  onReorderAssignments: (orderedIds: string[]) => void; // Kept for prop compatibility
}

export const SubjectDetail = ({
  subjectName,
  assignments,
  onBack,
  onAddAssignment,
  onEditAssignment,
  onDeleteAssignment,
}: SubjectDetailProps) => {
  const { user } = useAuth();
  
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
                <div className="space-y-0">
                {assignments.map((assignment, index) => (
                    <AssignmentItem
                    key={assignment.id}
                    assignment={assignment}
                    index={index}
                    onEdit={() => onEditAssignment(assignment)}
                    onDelete={() => onDeleteAssignment(assignment.id)}
                    isFirst={index === 0}
                    isLast={index === assignments.length - 1}
                    />
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
