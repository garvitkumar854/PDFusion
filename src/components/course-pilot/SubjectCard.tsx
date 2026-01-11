
'use client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pencil, ArrowRight, Copy, Check } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import type { Assignment } from '@/app/assignment-tracker/page';
import { useToast } from '@/hooks/use-toast';


interface SubjectCardProps {
  id: string;
  name: string;
  assignments: Assignment[];
  updatedAt: string;
  onView: () => void;
  onEdit: () => void;
}

const cardVariants = {
  initial: { y: 0 },
  hover: { y: -5 }
}

const arrowVariants = {
  initial: { x: -10, opacity: 0 },
  hover: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 12 } }
}

export const SubjectCard = ({
  name,
  assignments,
  updatedAt,
  onView,
  onEdit,
}: SubjectCardProps) => {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  const lastUpdated = formatDistanceToNow(new Date(updatedAt), { addSuffix: true });
  const assignmentCount = assignments.length;
  
  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const indexText = assignments
      .map((assignment, index) => {
        const description = assignment.description ? ` - ${assignment.description}` : '';
        return `[${index + 1}] ${assignment.title}${description}`;
      })
      .join('\n');

    navigator.clipboard.writeText(indexText).then(() => {
      toast({
        variant: 'success',
        title: 'Index Copied!',
        description: `Copied ${assignments.length} assignments for "${name}".`,
      });
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(() => {
        toast({
            variant: 'destructive',
            title: 'Copy Failed',
            description: 'Could not copy the index to clipboard.',
        });
    });
  }, [assignments, name, toast]);

  return (
    <div 
        className="group relative h-full" 
    >
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary to-blue-400 opacity-0 blur transition-all duration-300 group-hover:opacity-75"></div>
      <motion.div
        variants={cardVariants}
        initial="initial"
        whileHover="hover"
        className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-card p-6 shadow-lg"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex justify-between items-start gap-4">
            <h2 onClick={onView} className="text-xl font-bold text-foreground transition-colors duration-300 group-hover:text-primary pr-8 cursor-pointer">{name}</h2>
            {user && (
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(); }} className="h-8 w-8 shrink-0 -mt-2 -mr-2 z-10">
                <Pencil className="h-4 w-4" />
            </Button>
            )}
        </div>
        <p className="text-sm text-muted-foreground mt-2">
            {assignmentCount} {assignmentCount === 1 ? 'assignment' : 'assignments'}
        </p>
         <p className="text-xs text-muted-foreground mt-1">
            Last updated: {lastUpdated}
        </p>

        <div className="mt-auto pt-6 flex justify-between items-center">
            <Button variant="ghost" size="icon" onClick={handleCopy} className="h-9 w-9 text-muted-foreground hover:bg-primary/10 hover:text-primary z-10">
                {isCopied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5"/>}
            </Button>
            <div onClick={onView} className="flex items-center gap-2 text-primary font-semibold text-sm cursor-pointer">
                <span>View</span>
                <motion.div variants={arrowVariants} initial="initial" animate={isHovered ? "hover" : "initial"}>
                    <ArrowRight className="h-5 w-5 text-primary" />
                </motion.div>
            </div>
        </div>
      </motion.div>
    </div>
  );
};
