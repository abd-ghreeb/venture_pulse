import { VentureHealth } from '@/data/enums';
import { cn } from '@/lib/utils';

interface HealthBadgeProps {
  health: VentureHealth;
  className?: string;
}

const HealthBadge = ({ health, className }: HealthBadgeProps) => {
  const badgeClass = cn(
    "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-200",
    health === 'On Track' && "glass-badge-success",
    health === 'At Risk' && "glass-badge-warning",
    health === 'Critical' && "glass-badge-critical",
    className
  );

  return (
    <span className={badgeClass}>
      <span className={cn(
        "w-1.5 h-1.5 rounded-full mr-2",
        health === 'On Track' && "bg-emerald-400",
        health === 'At Risk' && "bg-amber-400",
        health === 'Critical' && "bg-red-400 animate-pulse"
      )} />
      {health}
    </span>
  );
};

export default HealthBadge;
