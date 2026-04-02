'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, ChevronDown, Edit, GripVertical, MoreVertical, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import AnimateOnScroll from '@/components/AnimateOnScroll';
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
} from '@/components/ui/dropdown-menu';
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
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Assignment {
  id: string;
  subject_id: string;
  title: string;
  description: string;
  date: string;
  created_at: string;
  updated_at: string;
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

type AssignmentGroup = {
  date: string;
  label: string;
  assignments: Assignment[];
};

const SortableAssignmentItem = ({ assignment, index, onEdit, onDelete, isFirstInGroup, isLastInGroup }: SortableAssignmentItemProps) => {
  const { user } = useAuth();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: assignment.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card
        className={cn(
          'w-full border border-slate-400/90 bg-white/95 shadow-sm backdrop-blur-sm transition-all duration-300 dark:border-slate-700/90 dark:bg-card/80',
          isDragging && 'scale-[1.01] opacity-70 shadow-xl',
          isFirstInGroup && isLastInGroup && 'rounded-[28px]',
          isFirstInGroup && !isLastInGroup && 'rounded-t-[28px] rounded-b-none',
          !isFirstInGroup && isLastInGroup && 'rounded-b-[28px] rounded-t-none',
          !isFirstInGroup && !isLastInGroup && 'rounded-none'
        )}
      >
        <div className="flex items-start gap-3 p-4 sm:p-5">
          <div className="flex shrink-0 items-center gap-2 pt-0.5 text-muted-foreground">
            {user && (
              <div {...listeners} className="cursor-grab touch-none rounded-md p-1 transition-colors hover:bg-slate-100/80 dark:hover:bg-slate-700/60">
                <GripVertical />
              </div>
            )}
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {index + 1}
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
            <CardTitle className="break-words text-[15px] font-semibold leading-tight text-foreground md:text-base">
              {assignment.title}
            </CardTitle>
            {assignment.description && (
              <p className="break-words whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground/90">
                {assignment.description}
              </p>
            )}
          </div>

          <div className="ml-2 flex shrink-0 items-center gap-2 text-right">
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full transition-colors hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary dark:hover:text-primary-foreground">
                    <MoreVertical className="h-4 w-4" />
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
                        <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
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
  const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const sortedAssignments = [...assignments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.order - b.order);
    setOrderedAssignments(sortedAssignments);
  }, [assignments]);

  const groupedAssignments = useMemo<AssignmentGroup[]>(() => {
    const groups = new Map<string, Assignment[]>();

    orderedAssignments.forEach((assignment) => {
      const existing = groups.get(assignment.date) ?? [];
      groups.set(assignment.date, [...existing, assignment]);
    });

    return Array.from(groups.entries()).map(([date, groupAssignments]) => ({
      date,
      label: format(parseISO(`${date}T00:00:00.000Z`), 'EEEE, MMM dd, yyyy'),
      assignments: groupAssignments,
    }));
  }, [orderedAssignments]);

  const visibleAssignments = useMemo(
    () => groupedAssignments.flatMap((group) => (collapsedDates[group.date] ? [] : group.assignments)),
    [groupedAssignments, collapsedDates]
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveAssignment(orderedAssignments.find((a) => a.id === active.id) || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveAssignment(null);

    if (over && active.id !== over.id) {
      const oldIndex = orderedAssignments.findIndex((item) => item.id === active.id);
      const newIndex = orderedAssignments.findIndex((item) => item.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const items = arrayMove(orderedAssignments, oldIndex, newIndex);
      const newDate = orderedAssignments[newIndex].date;

      const finalAssignments = items.map((item, index) => ({
        ...item,
        date: item.id === active.id ? newDate : item.date,
        order: index,
      }));

      const sorted = finalAssignments.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.order - b.order
      );

      setOrderedAssignments(sorted);
      setHasReordered(true);
    }
  };

  const handleSaveOrder = () => {
    onReorderAssignments(orderedAssignments);
    setHasReordered(false);
  };

  const toggleDateCollapse = (date: string) => {
    setCollapsedDates((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <AnimateOnScroll animation="animate-in fade-in-0 slide-in-from-bottom-12" className="duration-500">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={onBack} className="shrink-0 rounded-full border-slate-200 bg-white shadow-sm transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground dark:border-slate-800 dark:bg-card dark:hover:border-primary dark:hover:bg-primary dark:hover:text-primary-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="break-words text-2xl/tight font-bold sm:text-3xl/tight md:text-4xl/tight">{subjectName}</h1>
              <p className="text-muted-foreground">{assignments.length} assignments</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasReordered && user && (
              <Button variant="secondary" onClick={handleSaveOrder} className="rounded-full shadow-sm">
                <Check className="mr-2 h-4 w-4" />
                Save Order
              </Button>
            )}
            {user && (
              <Button onClick={onAddAssignment} className="rounded-full shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Assignment
              </Button>
            )}
          </div>
        </div>

        {assignments.length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <SortableContext items={orderedAssignments.map((a) => a.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {groupedAssignments.map((group) => {
                  const isCollapsed = !!collapsedDates[group.date];
                  const groupItems = group.assignments;

                  return (
                    <div key={group.date} className="space-y-2">
                      <div className="flex items-center justify-between gap-4 px-1 sm:px-2">
                        <h3 className="truncate text-lg font-semibold text-foreground">{group.label}</h3>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleDateCollapse(group.date)}
                          className="h-9 w-9 shrink-0 rounded-full border border-slate-300/80 bg-white shadow-sm transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground dark:border-slate-700 dark:bg-card dark:hover:border-primary dark:hover:bg-primary dark:hover:text-primary-foreground"
                          aria-label={isCollapsed ? 'Expand assignments' : 'Collapse assignments'}
                        >
                          <ChevronDown className={cn('h-5 w-5 transition-transform duration-300', isCollapsed && '-rotate-90')} />
                        </Button>
                      </div>

                      {!isCollapsed && (
                        <div className="space-y-[2px]">
                          {groupItems.map((assignment) => {
                            const isFirstInGroup = groupItems[0]?.id === assignment.id;
                            const isLastInGroup = groupItems[groupItems.length - 1]?.id === assignment.id;

                            return (
                              <SortableAssignmentItem
                                key={assignment.id}
                                assignment={assignment}
                                index={orderedAssignments.findIndex((item) => item.id === assignment.id)}
                                onEdit={() => onEditAssignment(assignment)}
                                onDelete={() => onDeleteAssignment(assignment.id)}
                                isFirstInGroup={isFirstInGroup}
                                isLastInGroup={isLastInGroup}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeAssignment ? (
                <SortableAssignmentItem
                  assignment={activeAssignment}
                  index={orderedAssignments.findIndex((a) => a.id === activeAssignment.id)}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  isFirstInGroup={true}
                  isLastInGroup={true}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 py-16 text-center shadow-sm dark:border-slate-700 dark:bg-card/60">
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">No assignments yet</h3>
            <p className="mt-2 text-muted-foreground">Click "Add Assignment" to get started.</p>
          </div>
        )}
      </AnimateOnScroll>
    </div>
  );
};
