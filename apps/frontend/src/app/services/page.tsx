'use client';

import { useState } from 'react';
import { ServiceGrid } from '@/components/services/ServiceGrid';
import { ServiceFilters } from '@/components/services/ServiceFilters';
import { RegisterServiceModal } from '@/components/services/RegisterServiceModal';
import { Plus } from 'lucide-react';

export default function ServicesPage() {
  const [filters, setFilters] = useState({});
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-dark-text">Services</h1>
          <p className="text-dark-muted text-sm mt-1">Toate serviciile disponibile pe AgentBazaar</p>
        </div>
        <button className="btn-primary" onClick={() => setShowRegister(true)}>
          <Plus size={16} />
          Register Service
        </button>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-64 shrink-0">
          <ServiceFilters onChange={setFilters} />
        </aside>
        <div className="flex-1">
          <ServiceGrid filters={filters} />
        </div>
      </div>
      {showRegister && <RegisterServiceModal onClose={() => setShowRegister(false)} />}
    </div>
  );
}
