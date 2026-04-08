'use client';

import { OperatorDashboard } from '@/components/dashboard/OperatorDashboard';

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark-text">Dashboard</h1>
        <p className="text-dark-muted text-sm mt-1">Monitorizează task-urile, serviciile și reputația ta</p>
      </div>
      <OperatorDashboard />
    </div>
  );
}
