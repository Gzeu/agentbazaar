import Head from 'next/head';
import { Activity } from 'lucide-react';
import { TaskCard } from '@/components/tasks/TaskCard';
import { useTasksByConsumer } from '@/hooks/useTasks';

export default function TasksPage() {
  // TODO: replace with connected wallet address
  const address = '';
  const { tasks, loading } = useTasksByConsumer(address);

  return (
    <>
      <Head><title>My Tasks — AgentBazaar</title></Head>
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-16">
        <div className="flex items-center gap-2 mb-6">
          <Activity size={20} className="text-brand-400" />
          <h1 className="text-xl font-bold text-white">My Tasks</h1>
        </div>

        {!address ? (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-gray-400">Connect your wallet to see your tasks.</p>
            <button className="mt-4 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm transition-colors">
              Connect Wallet
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-36 glass rounded-xl" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-3xl mb-3">📭</p>
            <p className="text-white font-semibold">No tasks yet</p>
            <p className="text-gray-500 text-sm mt-1">Browse the marketplace and submit your first task.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tasks.map((task) => <TaskCard key={task.id} task={task} />)}
          </div>
        )}
      </div>
    </>
  );
}
