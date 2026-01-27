import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpdateCountdownProps {
  ventureId: string;
  className?: string;
}

// Simulate next update times based on venture ID (in real app, this would come from backend)
const getNextUpdateTime = (ventureId: string): Date => {
  const baseOffset = parseInt(ventureId) * 7; // Different offset for each venture
  const now = new Date();
  const nextUpdate = new Date(now);
  
  // Set to a random time within the next 1-7 days based on venture ID
  nextUpdate.setHours(nextUpdate.getHours() + baseOffset + Math.floor(Math.random() * 24));
  
  return nextUpdate;
};

// Cache for consistent countdown values per venture
const updateTimeCache = new Map<string, Date>();

const getOrCreateUpdateTime = (ventureId: string): Date => {
  if (!updateTimeCache.has(ventureId)) {
    updateTimeCache.set(ventureId, getNextUpdateTime(ventureId));
  }
  return updateTimeCache.get(ventureId)!;
};

const formatCountdown = (ms: number): { value: string; isUrgent: boolean } => {
  if (ms <= 0) {
    return { value: 'Update due', isUrgent: true };
  }

  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return { value: `${days}d ${hours % 24}h`, isUrgent: false };
  }
  
  if (hours > 0) {
    return { value: `${hours}h ${minutes}m`, isUrgent: hours < 6 };
  }
  
  return { value: `${minutes}m`, isUrgent: true };
};

const UpdateCountdown = ({ ventureId, className }: UpdateCountdownProps) => {
  const [countdown, setCountdown] = useState<{ value: string; isUrgent: boolean }>({ value: '', isUrgent: false });

  useEffect(() => {
    const targetTime = getOrCreateUpdateTime(ventureId);
    
    const updateCountdown = () => {
      const now = new Date();
      const diff = targetTime.getTime() - now.getTime();
      setCountdown(formatCountdown(diff));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [ventureId]);

  return (
    <div className={cn(
      "flex items-center gap-1.5 text-xs",
      countdown.isUrgent ? "text-warning" : "text-muted-foreground",
      className
    )}>
      <Clock className={cn(
        "w-3 h-3",
        countdown.isUrgent && "animate-pulse"
      )} />
      <span className="font-medium">{countdown.value}</span>
    </div>
  );
};

export default UpdateCountdown;
