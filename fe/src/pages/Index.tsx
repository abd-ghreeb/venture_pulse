import { useEffect, useState } from 'react';
import { DollarSign, Clock, TrendingUp, Users, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/dashboard/Sidebar';
import KPICard from '@/components/dashboard/KPICard';
import VentureChart from '@/components/dashboard/VentureChart';
import VentureTable from '@/components/dashboard/VentureTable';
import VentureSheet from '@/components/dashboard/VentureSheet';
import { useVentureData } from '@/hooks/useVentureData';
import { Venture } from "@/types/Venture";
import { DashboardStats } from '@/types/DashboardStats';

const Index = () => {
  // 1. Fetch data and state management functions from our hook
  const {
    ventures,
    metrics,
    burnTrend,
    isLoading,
    error,
    refetch,
    setVentures,
    setMetrics
  } = useVentureData();

  const [displayVentures, setDisplayVentures] = useState<Venture[]>([]);
  const [displayStats, setDisplayStats] = useState<DashboardStats | null>(null);
  
  const [selectedVenture, setSelectedVenture] = useState<Venture | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  // 2. Click Handler for the Table
  const handleVentureClick = (venture: Venture) => {
    setSelectedVenture(venture);
    setSheetOpen(true);
  };

  // 2. Initial Sync: When data finishes loading for the first time, 
  // populate displayVentures with the full list.
  useEffect(() => {
    if (ventures.length > 0 && displayVentures.length === 0) {
      setDisplayVentures(ventures);
    }
  }, [ventures]);

  // 3. AI Callback: Filters the view to ONLY what the AI Agent found
  const handleAIResults = (aiFoundVentures: Venture[], summary: string) => {
    // Only update state if the list is not empty
    if (aiFoundVentures && aiFoundVentures.length > 0) {
      setDisplayVentures(aiFoundVentures);
    }
  };

  // 4. Reset: Switches back to the master list
  const handleAIClear = () => {
    setDisplayVentures(ventures);
    setDisplayStats(null);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto h-full pt-16 lg:pt-0"> {/* Added padding-top for mobile toggle */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full"> {/* Responsive padding and max-width */}
          
          {/* Header - Stacked on mobile */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-1">Portfolio Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {ventures.length} ventures • {new Set(ventures.map(v => v.pod)).size} pods
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              disabled={isLoading}
              className="gap-2 w-full sm:w-auto justify-center"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>

          {/* KPI Cards - Grid automatically handles mobile (1 col) via your existing classes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KPICard title="Total Burn" value={`$${(metrics?.totalBurn / 1000).toFixed(0)}K`} change={8.2} trend={burnTrend.map(v => v / 1000)} icon={<DollarSign className="w-5 h-5" />} delay={0} />
            <KPICard title="Avg. Runway" value={metrics?.avgRunway} suffix=" mo" change={-2.5} icon={<Clock className="w-5 h-5" />} delay={0.1} />
            <KPICard title="Aggregate NPS" value={metrics?.avgNps} change={5.1} icon={<TrendingUp className="w-5 h-5" />} delay={0.2} />
            <KPICard title="Pilot Customers" value={metrics?.totalPilotCustomers} change={12.3} icon={<Users className="w-5 h-5" />} delay={0.3} />
          </div>

          {/* Chart - Ensure VentureChart is responsive inside its container */}
          <div className="mb-8 overflow-hidden rounded-xl border border-border bg-card">
            <div className="p-1 sm:p-0"> {/* Slight padding to prevent chart touching edges on tiny screens */}
              <VentureChart />
            </div>
          </div>

          {/* Venture Table & AI Search Command */}
          <div className="mb-8">
            <VentureTable
              ventures={displayVentures} 
              onAIResults={handleAIResults}
              onAIClear={handleAIClear}
              onVentureClick={handleVentureClick}
              isLoading={isLoading}
              highlightedVentures={[]} 
            />
          </div>
        </div>
      </main>

      <VentureSheet venture={selectedVenture} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
};

export default Index;
