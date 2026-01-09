
'use client';

import { useState, useEffect } from 'react';
import { LoginDialog } from '@/components/course-pilot/LoginDialog';
import { SubjectCard } from '@/components/course-pilot/SubjectCard';
import { SubjectDetail } from '@/components/course-pilot/SubjectDetail';
import { SubjectDialog } from '@/components/course-pilot/SubjectDialog';
import { AssignmentDialog } from '@/components/course-pilot/AssignmentDialog';
import { useToast } from '@/hooks/use-toast';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import AnimateOnScroll from '@/components/AnimateOnScroll';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Plus } from 'lucide-react';
import { BookCheck } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface Assignment {
  id: string;
  subject_id: string;
  title: string;
  description: string;
  date: string;
  created_at: string;
  updated_at: string;
  order?: number;
}

export default function AssignmentTrackerPage() {
  const { user, loading: authLoading } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubjects();
    fetchAssignments();
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const subjectsQuery = query(
        collection(db, 'subjects'),
        orderBy('created_at', 'desc'),
      );
      const snapshot = await getDocs(subjectsQuery);
      const nextSubjects = snapshot.docs.map((d) => {
        const data = d.data() as Omit<Subject, 'id'>;
        return { id: d.id, ...data };
      });
      setSubjects(nextSubjects);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      toast({ title: 'Failed to load subjects', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const assignmentsQuery = query(
        collection(db, 'assignments'),
        orderBy('date', 'asc'),
      );
      const snapshot = await getDocs(assignmentsQuery);
      const nextAssignments = snapshot.docs.map((d) => {
        const data = d.data() as Omit<Assignment, 'id'>;
        return { id: d.id, ...data };
      });
      setAssignments(nextAssignments);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      toast({ title: 'Failed to load assignments', variant: 'destructive' });
    }
  };

  const getAssignmentCount = (subjectId: string) => {
    return assignments.filter((a) => a.subject_id === subjectId).length;
  };

  const getSubjectAssignments = (subjectId: string) => {
    return assignments
      .filter((a) => a.subject_id === subjectId)
      .slice()
      .sort((a, b) => {
        const aOrder = a.order ?? Number.POSITIVE_INFINITY;
        const bOrder = b.order ?? Number.POSITIVE_INFINITY;
        if (aOrder !== bOrder) return aOrder - bOrder;
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.created_at.localeCompare(b.created_at);
      });
  };

  const handleAddSubject = async (name: string) => {
    const now = new Date().toISOString();
    try {
      await addDoc(collection(db, 'subjects'), {
        name,
        created_at: now,
        updated_at: now,
      });
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to add subject');
    }

    await fetchSubjects();
  };

  const handleUpdateSubject = async (name: string) => {
    if (!editingSubject) return;

    const now = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'subjects', editingSubject.id), {
        name,
        updated_at: now,
      });
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update subject');
    }

    await fetchSubjects();
    if (selectedSubject?.id === editingSubject.id) {
      setSelectedSubject({ ...editingSubject, name });
    }
    setEditingSubject(null);
  };

  const handleDeleteSubject = async () => {
    if (!editingSubject) return;

    try {
      const batch = writeBatch(db);
      const assignmentsQuery = query(
        collection(db, 'assignments'),
        where('subject_id', '==', editingSubject.id),
      );
      const assignmentSnapshot = await getDocs(assignmentsQuery);
      assignmentSnapshot.docs.forEach((d) => batch.delete(d.ref));
      batch.delete(doc(db, 'subjects', editingSubject.id));
      await batch.commit();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete subject');
    }

    await fetchSubjects();
    await fetchAssignments();
    if (selectedSubject?.id === editingSubject.id) {
      setSelectedSubject(null);
    }
    setEditingSubject(null);
  };

  const handleAddAssignment = async (data: {
    title: string;
    description: string;
    date: string;
  }) => {
    if (!selectedSubject) return;

    const subjectAssignments = getSubjectAssignments(selectedSubject.id);
    const maxOrder = Math.max(-1, ...subjectAssignments.map((a) => a.order ?? -1));
    const now = new Date().toISOString();
    try {
      await addDoc(collection(db, 'assignments'), {
        subject_id: selectedSubject.id,
        ...data,
        order: maxOrder + 1,
        created_at: now,
        updated_at: now,
      });
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to add assignment');
    }

    await fetchAssignments();
  };

  const handleUpdateAssignment = async (data: {
    title: string;
    description: string;
    date: string;
  }) => {
    if (!editingAssignment) return;

    const now = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'assignments', editingAssignment.id), {
        ...data,
        updated_at: now,
      });
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update assignment');
    }

    await fetchAssignments();
    setEditingAssignment(null);
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      await deleteDoc(doc(db, 'assignments', id));
      await fetchAssignments();
      toast({ title: 'Assignment deleted', variant: 'success' });
    } catch (err) {
      console.error('Error deleting assignment:', err);
      toast({ title: 'Failed to delete assignment', variant: 'destructive' });
    }
  };

  const handleReorderAssignments = async (subjectId: string, orderedAssignmentIds: string[]) => {
    const idToOrder = new Map<string, number>();
    orderedAssignmentIds.forEach((id, index) => idToOrder.set(id, index));

    const previous = assignments;
    setAssignments((prev) =>
      prev.map((a) => {
        if (a.subject_id !== subjectId) return a;
        const nextOrder = idToOrder.get(a.id);
        if (nextOrder === undefined) return a;
        return { ...a, order: nextOrder };
      }),
    );

    const now = new Date().toISOString();
    try {
      const batch = writeBatch(db);
      orderedAssignmentIds.forEach((id, index) => {
        batch.update(doc(db, 'assignments', id), { order: index, updated_at: now });
      });
      await batch.commit();
      toast({ title: 'Assignments reordered', variant: 'success' });
    } catch {
      setAssignments(previous);
      toast({ title: 'Failed to reorder assignments', variant: 'destructive' });
    }
  };
  
  const handleProtectedAction = (callback: () => void) => {
    if (user) {
      callback();
    } else {
      setIsLoginOpen(true);
    }
  };

  if (selectedSubject) {
    return (
      <>
        <SubjectDetail
          subjectName={selectedSubject.name}
          assignments={getSubjectAssignments(selectedSubject.id)}
          onBack={() => setSelectedSubject(null)}
          onAddAssignment={() => handleProtectedAction(() => {
            setEditingAssignment(null);
            setIsAssignmentDialogOpen(true);
          })}
          onEditAssignment={(assignment) => handleProtectedAction(() => {
            setEditingAssignment(assignment);
            setIsAssignmentDialogOpen(true);
          })}
          canReorder={!!user}
          onReorderAssignments={async (orderedIds) => {
            await handleReorderAssignments(selectedSubject.id, orderedIds);
          }}
          onDeleteAssignment={handleDeleteAssignment}
        />
        <LoginDialog isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        <SubjectDialog
          isOpen={isSubjectDialogOpen}
          onClose={() => {
            setIsSubjectDialogOpen(false);
            setEditingSubject(null);
          }}
          onSave={async (name) => {
            try {
              if (editingSubject) {
                await handleUpdateSubject(name);
                toast({ title: 'Subject updated', variant: 'success' });
              } else {
                await handleAddSubject(name);
                toast({ title: 'Subject added', variant: 'success' });
              }
            } catch (err) {
              toast({ title: err instanceof Error ? err.message : 'Failed to save subject', variant: 'destructive' });
              throw err;
            }
          }}
          onDelete={
            editingSubject
              ? async () => {
                  try {
                    await handleDeleteSubject();
                    toast({ title: 'Subject deleted', variant: 'success' });
                  } catch (err) {
                    toast({
                      title: err instanceof Error ? err.message : 'Failed to delete subject',
                      variant: 'destructive',
                    });
                    throw err;
                  }
                }
              : undefined
          }
          initialName={editingSubject?.name}
          isEdit={!!editingSubject}
        />
        <AssignmentDialog
          isOpen={isAssignmentDialogOpen}
          onClose={() => {
            setIsAssignmentDialogOpen(false);
            setEditingAssignment(null);
          }}
          onSave={async (data) => {
            try {
              if (editingAssignment) {
                await handleUpdateAssignment(data);
                toast({ title: 'Assignment updated', variant: 'success' });
              } else {
                await handleAddAssignment(data);
                toast({ title: 'Assignment added', variant: 'success' });
              }
            } catch (err) {
              toast({ title: err instanceof Error ? err.message : 'Failed to save assignment', variant: 'destructive' });
              throw err;
            }
          }}
          initialData={
            editingAssignment
              ? {
                  title: editingAssignment.title,
                  description: editingAssignment.description,
                  date: editingAssignment.date,
                }
              : undefined
          }
          isEdit={!!editingAssignment}
        />
      </>
    );
  }

  return (
    <>
      <section className="text-center my-12">
        <AnimateOnScroll animation="animate-in fade-in-0 slide-in-from-bottom-12" className="duration-500">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
            Course Pilot
             <br />
              <span className="relative inline-block">
                <span className="text-2xl sm:text-3xl md:text-5xl bg-gradient-to-r from-sky-500 to-blue-500 bg-clip-text text-transparent">
                    Track Your Coursework
                </span>
              </span>
          </h1>
          <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
            A simple and effective way to manage your coursework and deadlines.
          </p>
        </AnimateOnScroll>
      </section>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-3xl font-bold text-foreground">Subjects</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-4 py-2 rounded-full border border-border bg-card text-sm font-semibold text-card-foreground">
            {subjects.length === 1 ? '1 subject' : `${subjects.length} subjects`}
          </div>
          <div className="px-4 py-2 rounded-full border border-border bg-card text-sm font-semibold text-card-foreground">
            {assignments.length === 1 ? '1 assignment' : `${assignments.length} assignments`}
          </div>
        </div>
      </div>
      
      <div className="mb-6 flex justify-end gap-2">
        <Button onClick={() => handleProtectedAction(() => { setEditingSubject(null); setIsSubjectDialogOpen(true); })}>
            <Plus size={16} className="mr-2" />
            Add Subject
        </Button>
         {!authLoading && (
            user ? (
                <Button variant="outline" onClick={() => auth.signOut()}>
                    <LogOut size={16} className="mr-2" />
                    Logout
                </Button>
            ) : (
                <Button variant="outline" onClick={() => setIsLoginOpen(true)}>
                    <LogIn size={16} className="mr-2" />
                    Admin Login
                </Button>
            )
         )}
      </div>

      {loading ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">Loading subjects...</p>
        </div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">No subjects yet</p>
          <p className="text-gray-400 mt-2">
            Click "Add Subject" to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              id={subject.id}
              name={subject.name}
              assignmentCount={getAssignmentCount(subject.id)}
              onView={() => setSelectedSubject(subject)}
              onEdit={() => handleProtectedAction(() => {
                setEditingSubject(subject);
                setIsSubjectDialogOpen(true);
              })}
            />
          ))}
        </div>
      )}

      <LoginDialog isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <SubjectDialog
        isOpen={isSubjectDialogOpen}
        onClose={() => {
          setIsSubjectDialogOpen(false);
          setEditingSubject(null);
        }}
        onSave={async (name) => {
          try {
            if (editingSubject) {
              await handleUpdateSubject(name);
              toast({ title: 'Subject updated', variant: 'success' });
            } else {
              await handleAddSubject(name);
              toast({ title: 'Subject added', variant: 'success' });
            }
          } catch (err) {
            toast({ title: err instanceof Error ? err.message : 'Failed to save subject', variant: 'destructive' });
            throw err;
          }
        }}
        onDelete={
          editingSubject
            ? async () => {
                try {
                  await handleDeleteSubject();
                  toast({ title: 'Subject deleted', variant: 'success' });
                } catch (err) {
                  toast({ title: err instanceof Error ? err.message : 'Failed to delete subject', variant: 'destructive' });
                  throw err;
                }
              }
            : undefined
        }
        initialName={editingSubject?.name}
        isEdit={!!editingSubject}
      />
    </>
  );
}
