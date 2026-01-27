import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: number[];
  icon: React.ReactNode;
  suffix?: string;
  delay?: number;
}

const KPICard = ({ title, value, change, trend, icon, suffix = '', delay = 0 }: KPICardProps) => {
  const trendData = trend?.map((val, i) => ({ value: val, index: i })) || [];
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass rounded-xl p-5 relative overflow-hidden group hover:border-primary/30 transition-colors duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-muted-foreground text-sm font-medium">{title}</span>
          <div className="p-2 rounded-lg bg-secondary/50 text-primary">
            {icon}
          </div>
        </div>
        
        <div className="flex items-end justify-between">
          <div>
            <div className="text-3xl font-semibold tracking-tight text-foreground">
              {value}{suffix}
            </div>
            {change !== undefined && (
              <div className={`flex items-center gap-1 mt-1 text-sm ${
                isPositive ? 'text-success' : isNegative ? 'text-destructive' : 'text-muted-foreground'
              }`}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : 
                 isNegative ? <TrendingDown className="w-3 h-3" /> : 
                 <Minus className="w-3 h-3" />}
                <span>{Math.abs(change)}% from last month</span>
              </div>
            )}
          </div>
          
          {trend && trend.length > 0 && (
            <div className="w-20 h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={1.5}
                    fill={`url(#gradient-${title})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default KPICard;
