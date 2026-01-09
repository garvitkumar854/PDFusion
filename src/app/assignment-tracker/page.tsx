'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/course-pilot/Navbar';
import { LoginDialog } from '@/components/course-pilot/LoginDialog';
import { SubjectCard } from '@/components/course-pilot/SubjectCard';
import { SubjectDetail } from '@/components/course-pilot/SubjectDetail';
import { SubjectDialog } from '@/components/course-pilot/SubjectDialog';
import { AssignmentDialog } from '@/components/course-pilot/AssignmentDialog';
import { Toast, ToastProvider, ToastViewport, ToastTitle, ToastDescription, ToastClose } from '@/components/ui/toast';
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
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import AnimateOnScroll from '@/components/AnimateOnScroll';

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

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  title: string;
  kind: ToastKind;
  leaving: boolean;
}

export default function AssignmentTrackerPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  };

  const showToast = (title: string, kind: ToastKind) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, title, kind, leaving: false }]);
    setTimeout(() => dismissToast(id), 3500);
  };

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
      showToast('Failed to load subjects', 'error');
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
      showToast('Failed to load assignments', 'error');
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
      showToast('Assignment deleted', 'success');
    } catch (err) {
      console.error('Error deleting assignment:', err);
      showToast('Failed to delete assignment', 'error');
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
      showToast('Assignments reordered', 'success');
    } catch {
      setAssignments(previous);
      showToast('Failed to reorder assignments', 'error');
    }
  };

  const ToastViewportComponent = () => {
    if (toasts.length === 0) return null;

    return (
        <ToastProvider>
            {toasts.map((t) => {
                const variant = t.kind === 'success' ? 'success' : t.kind === 'error' ? 'destructive' : 'info';
                return (
                    <Toast key={t.id} open={!t.leaving} onOpenChange={() => dismissToast(t.id)} variant={variant}>
                        <ToastTitle>{t.title}</ToastTitle>
                        <ToastClose />
                    </Toast>
                );
            })}
            <ToastViewport />
        </ToastProvider>
    );
  };
  
  if (selectedSubject) {
    return (
      <>
        <ToastViewportComponent />
        <SubjectDetail
          subjectName={selectedSubject.name}
          assignments={getSubjectAssignments(selectedSubject.id)}
          onBack={() => setSelectedSubject(null)}
          onAddAssignment={() => {
            setEditingAssignment(null);
            setIsAssignmentDialogOpen(true);
          }}
          onEditAssignment={(assignment) => {
            setEditingAssignment(assignment);
            setIsAssignmentDialogOpen(true);
          }}
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
                showToast('Subject updated', 'success');
              } else {
                await handleAddSubject(name);
                showToast('Subject added', 'success');
              }
            } catch (err) {
              showToast(err instanceof Error ? err.message : 'Failed to save subject', 'error');
              throw err;
            }
          }}
          onDelete={
            editingSubject
              ? async () => {
                  try {
                    await handleDeleteSubject();
                    showToast('Subject deleted', 'success');
                  } catch (err) {
                    showToast(
                      err instanceof Error ? err.message : 'Failed to delete subject',
                      'error',
                    );
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
                showToast('Assignment updated', 'success');
              } else {
                await handleAddAssignment(data);
                showToast('Assignment added', 'success');
              }
            } catch (err) {
              showToast(err instanceof Error ? err.message : 'Failed to save assignment', 'error');
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
      <ToastViewportComponent />
        <section className="text-center mb-12">
            <AnimateOnScroll animation="animate-in fade-in-0 slide-in-from-bottom-12" className="duration-500">
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
                Course Pilot
                <br />
                <span className="relative inline-block">
                    <span className="relative bg-gradient-to-r from-sky-500 to-blue-500 bg-clip-text text-transparent">Assignment Tracker</span>
                </span>
                </h1>
                <p className="max-w-2xl mx-auto text-muted-foreground text-base md:text-lg">
                Browse and manage all your course assignments.
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

          {loading ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">Loading subjects...</p>
            </div>
          ) : subjects.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No subjects yet</p>
              {user && (
                <p className="text-gray-400 mt-2">
                  Click "Add Subject" to get started
                </p>
              )}
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
                  onEdit={() => {
                    setEditingSubject(subject);
                    setIsSubjectDialogOpen(true);
                  }}
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
              showToast('Subject updated', 'success');
            } else {
              await handleAddSubject(name);
              showToast('Subject added', 'success');
            }
          } catch (err) {
            showToast(err instanceof Error ? err.message : 'Failed to save subject', 'error');
            throw err;
          }
        }}
        onDelete={
          editingSubject
            ? async () => {
                try {
                  await handleDeleteSubject();
                  showToast('Subject deleted', 'success');
                } catch (err) {
                  showToast(err instanceof Error ? err.message : 'Failed to delete subject', 'error');
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
