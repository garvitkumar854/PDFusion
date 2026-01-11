
'use client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pencil, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface SubjectCardProps {
  id: string;
  name: string;
  assignmentCount: number;
  onView: () => void;
  onEdit: () => void;
}

const cardVariants = {
  initial: { y: 0 },
  hover: { y: -5, transition: { type: 'spring', stiffness: 300, damping: 15 } }
}

const arrowVariants = {
  initial: { x: -10, opacity: 0 },
  hover: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 12 } }
}

export const SubjectCard = ({
  name,
  assignmentCount,
  onView,
  onEdit,
}: SubjectCardProps) => {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
        className="group relative h-full cursor-pointer" 
        onClick={onView}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary to-blue-400 opacity-0 blur transition-all duration-300 group-hover:opacity-75"></div>
      <motion.div
        variants={cardVariants}
        initial="initial"
        animate={isHovered ? "hover" : "initial"}
        className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-card p-6 shadow-lg transition-all duration-300"
      >
        <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold text-foreground transition-colors duration-300 group-hover:text-primary pr-8">{name}</h2>
            {user && (
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(); }} className="h-8 w-8 shrink-0 -mt-2 -mr-2 z-10">
                <Pencil className="h-4 w-4" />
            </Button>
            )}
        </div>
        <p className="text-sm text-muted-foreground mt-2">
            {assignmentCount} {assignmentCount === 1 ? 'assignment' : 'assignments'}
        </p>

        <div className="mt-auto pt-6 flex justify-end">
            <motion.div variants={arrowVariants} initial="initial" animate={isHovered ? "hover" : "initial"}>
              <ArrowRight className="h-6 w-6 text-primary" />
            </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
