import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { formatDisplayDate } from "@/lib/utils";
import { Venture } from "@/types/Venture";
import { cn } from '@/lib/utils';
import { Clock, Users, DollarSign, Star } from 'lucide-react';
import HealthBadge from './HealthBadge';
import BurnRateDisplay from './BurnRateDisplay';
import UpdateCountdown from './UpdateCountdown';

interface VentureSheetProps {
  venture: Venture | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VentureSheet = ({ venture, open, onOpenChange }: VentureSheetProps) => {
  if (!venture) return null;



  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-card border-border overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-semibold text-foreground">{venture.name}</SheetTitle>
            <HealthBadge health={venture.health} />
          </div>
          <p className="text-muted-foreground">{venture.description}</p>
          <div className="mt-2">
            <UpdateCountdown ventureId={venture.id} className="text-sm" />
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Monthly Burn</span>
              </div>
              <BurnRateDisplay 
                amount={venture.burn_rate_monthly} 
                health={venture.health} 
                className="text-2xl"
              />
            </div>
            <div className="glass rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Runway</span>
              </div>
              <div className={cn(
                "text-2xl font-semibold",
                venture.runway_months <= 6 ? "text-red-400" :
                venture.runway_months <= 12 ? "text-amber-400" : "text-emerald-400"
              )}>
                {venture.runway_months} months
              </div>
            </div>
            <div className="glass rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Star className="w-4 h-4" />
                <span className="text-sm">NPS Score</span>
              </div>
              <div className={cn(
                "text-2xl font-semibold",
                venture.nps_score >= 70 ? "text-emerald-400" :
                venture.nps_score >= 50 ? "text-foreground" : "text-amber-400"
              )}>
                {venture.nps_score || 'N/A'}
              </div>
            </div>
            <div className="glass rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Users className="w-4 h-4" />
                <span className="text-sm">Pilot Customers</span>
              </div>
              <div className="text-2xl font-semibold text-foreground">
                {venture.pilot_customers?.length}
              </div>
            </div>
          </div>

          
          {/* Pilot Customers */}
          <div className="glass rounded-lg p-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-4">Pilot Customers</h4>
            {venture.pilot_customers?.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No pilot customers yet</p>
            ) : (
              <div className="space-y-3">
                {venture.pilot_customers.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div>
                      <div className="font-medium text-foreground">{customer.name}</div>
                      <div className="text-xs text-muted-foreground">Started {formatDisplayDate(customer.start_date)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-foreground">${(customer.contract_value / 1000).toFixed(0)}K</div>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          customer.status === 'Active' && "border-emerald-500/30 text-emerald-400",
                          customer.status === 'Pending' && "border-amber-500/30 text-amber-400",
                          customer.status === 'Churned' && "border-red-500/30 text-red-400"
                        )}
                      >
                        {customer.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Last Update */}
          <div className="glass rounded-lg p-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Latest Update</h4>
            <p className="text-foreground">{venture.last_update_text}</p>
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <span>Founder:</span>
              <span className="text-foreground font-medium">{venture.founder}</span>
              <span>•</span>
              <span>{venture.pod}</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default VentureSheet;
