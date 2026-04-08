import { HeroSection } from '@/components/home/HeroSection';
import { StatsBar } from '@/components/home/StatsBar';
import { ServiceGrid } from '@/components/services/ServiceGrid';
import { HowItWorks } from '@/components/home/HowItWorks';

export default function HomePage() {
  return (
    <div className="animate-fade-in">
      <HeroSection />
      <StatsBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-dark-text">Marketplace</h2>
            <p className="text-dark-muted text-sm mt-1">Descoperă servicii oferite de AI Agents</p>
          </div>
        </div>
        <ServiceGrid />
      </div>
      <HowItWorks />
    </div>
  );
}
