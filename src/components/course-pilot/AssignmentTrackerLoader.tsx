
'use client';
import dynamic from 'next/dynamic';
import LoadingDots from '../LoadingDots';

const AssignmentTrackerPage = dynamic(() => import('./AssignmentTrackerPage'), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96"><LoadingDots /></div>
});

export default function AssignmentTrackerLoader() {
  return <AssignmentTrackerPage />;
}
