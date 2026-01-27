import { motion } from 'framer-motion';
import { Venture, VentureStage, Pod } from '@/types/Venture';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import AISearchHub from '@/components/dashboard/AISearchHub';
import UpdateCountdown from '@/components/dashboard/UpdateCountdown';
import HealthBadge from '@/components/dashboard/HealthBadge';
import BurnRateDisplay from '@/components/dashboard/BurnRateDisplay';

interface VentureTableProps {
  ventures: Venture[];
  // Updated to match the new AISearchHub signature
  onAIResults: (ventures: Venture[], summary: string) => void;
  onAIClear: () => void;
  onVentureClick: (venture: Venture) => void;
  highlightedVentures?: string[];
  isLoading?: boolean;
}

const getStageColor = (stage: VentureStage) => {
  const styles: Record<VentureStage, string> = {
    'Discovery': 'bg-muted text-muted-foreground',
    'Validation': 'bg-secondary text-secondary-foreground',
    'Pilot': 'bg-primary/20 text-primary border-primary/30',
    'Scale': 'bg-accent/30 text-accent-foreground',
    'Growth': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  };
  return styles[stage] || 'bg-muted';
};

const getPodColor = (pod: Pod) => {
  const colors: Record<Pod, string> = {
    'Infrastructure': 'text-blue-400',
    'HealthTech': 'text-pink-400',
    'FinTech': 'text-green-400',
    'CleanTech': 'text-emerald-400',
    'PropTech': 'text-orange-400',
  };
  return colors[pod] || 'text-foreground';
};

const TableSkeleton = () => (
  <div className="space-y-4 p-6 bg-card/30">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex items-center gap-6 animate-pulse border-b border-border/50 pb-4">
        <div className="w-1/4 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted/40 rounded w-1/2" />
        </div>
        <div className="flex-1 h-4 bg-muted/30 rounded" />
        <div className="flex-1 h-4 bg-muted/30 rounded" />
        <div className="w-24 h-8 bg-muted/20 rounded-full" />
      </div>
    ))}
  </div>
);

const VentureTable = ({
  ventures,
  onAIResults,
  onAIClear,
  onVentureClick,
  highlightedVentures = [],
  isLoading
}: VentureTableProps) => {


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-full bg-muted/20 rounded-lg animate-pulse" /> {/* AI Bar Skeleton */}
        <div className="glass rounded-xl overflow-hidden border border-border">
          <div className="p-6 border-b border-border">
            <div className="h-6 bg-muted rounded w-40" />
            <div className="h-4 bg-muted/50 rounded w-64 mt-2" />
          </div>
          <TableSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Sticky AI Command Hub */}
      <div className="bg-background pb-4 pt-2">
        <AISearchHub
          onResults={onAIResults}
          onClear={onAIClear}
        />
      </div>

      {/* 2. Main Table Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass rounded-xl overflow-hidden border border-border"
      >
        {/* Table Header Section */}
        <div className="p-6 border-b border-border bg-card/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-medium text-foreground tracking-tight">Venture Portfolio</h3>
              <p className="text-sm text-muted-foreground">Monitor performance and pilot velocity across the studio.</p>
            </div>
            <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider px-2 py-0 h-fit">
              Live Data
            </Badge>
          </div>
        </div>

        {/* 3. The Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left py-4 px-6 text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Venture</th>
                <th className="text-left py-4 px-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Pod</th>
                <th className="text-left py-4 px-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Stage</th>
                <th className="text-left py-4 px-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Founder</th>
                <th className="text-left py-4 px-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Burn/mo</th>
                <th className="text-left py-4 px-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Runway</th>
                <th className="text-left py-4 px-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Next Update</th>
                <th className="text-left py-4 px-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {ventures.map((venture, index) => {
                const isHighlighted = highlightedVentures.includes(venture.id);
                return (
                  <motion.tr
                    key={venture.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      backgroundColor: isHighlighted ? 'hsl(var(--primary) / 0.05)' : 'transparent'
                    }}
                    transition={{ duration: 0.3, delay: index * 0.02 }}
                    onClick={() => onVentureClick(venture)}
                    className={cn(
                      "group cursor-pointer transition-colors duration-200",
                      "hover:bg-primary/[0.02]",
                      isHighlighted && "ring-1 ring-inset ring-primary/30"
                    )}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          venture.health === 'On Track' && "bg-emerald-500",
                          venture.health === 'At Risk' && "bg-amber-500",
                          venture.health === 'Critical' && "bg-red-500 animate-pulse"
                        )} />
                        <div>
                          <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                            {venture.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                            {venture.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={cn("text-xs font-semibold", getPodColor(venture.pod))}>
                        {venture.pod}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className={cn("text-[10px] h-5 font-bold uppercase", getStageColor(venture.stage))}>
                        {venture.stage}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-sm text-foreground/80">{venture.founder}</td>
                    <td className="py-4 px-4">
                      <BurnRateDisplay amount={venture.burn_rate_monthly} health={venture.health} />
                    </td>
                    <td className="py-4 px-4">
                      <span className={cn(
                        "font-mono text-xs font-bold",
                        venture.runway_months <= 6 ? "text-red-500" :
                          venture.runway_months <= 12 ? "text-amber-500" : "text-emerald-500"
                      )}>
                        {venture.runway_months} mo
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <UpdateCountdown ventureId={venture.id} />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <HealthBadge health={venture.health} />
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default VentureTable;