
import type { Metadata } from 'next';
import AssignmentTrackerLoader from '@/components/course-pilot/AssignmentTrackerLoader';

export const metadata: Metadata = {
  title: 'Course Pilot - Assignment Tracker | PDFusion',
  description: 'Intelligently track and manage all your course assignments and deadlines. Course Pilot is a smart, simple, and effective way to stay organized.',
  keywords: ['assignment tracker', 'coursework manager', 'deadline tracker', 'student organizer', 'course pilot'],
};

export default function AssignmentTrackerPage() {
  return <AssignmentTrackerLoader />;
}
