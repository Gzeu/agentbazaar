'use client';

import { TasksList } from '@/components/tasks/TasksList';
import { SubmitTaskModal } from '@/components/tasks/SubmitTaskModal';
import { useState } from 'react';
import { Zap } from 'lucide-react';

export default function TasksPage() {
  const [showSubmit, setShowSubmit] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-dark-text">Tasks</h1>
          <p className="text-dark-muted text-sm mt-1">Task-uri agent-to-agent în timp real</p>
        </div>
        <button className="btn-primary" onClick={() => setShowSubmit(true)}>
          <Zap size={16} />
          Submit Task
        </button>
      </div>
      <TasksList />
      {showSubmit && <SubmitTaskModal onClose={() => setShowSubmit(false)} />}
    </div>
  );
}
