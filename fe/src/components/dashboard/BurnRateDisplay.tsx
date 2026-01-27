import { cn } from '@/lib/utils';

export type VentureHealth = 'On Track' | 'At Risk' | 'Critical';

interface BurnRateDisplayProps {
  amount: number;
  health: VentureHealth;
  className?: string;
}

const formatUSD = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const BurnRateDisplay = ({ amount, health, className }: BurnRateDisplayProps) => {
  return (
    <span className={cn(
      "font-mono font-medium",
      health === 'On Track' && "text-emerald-400",
      health === 'At Risk' && "text-amber-400",
      health === 'Critical' && "text-red-400",
      className
    )}>
      {formatUSD(amount)}
    </span>
  );
};

export default BurnRateDisplay;
