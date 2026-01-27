export interface DashboardStats {
    totalBurn: number;
    avgRunway: number;
    avgNps: number;
    totalPilotCustomers: number;
    burnChange: number;
    runwayChange: number;
    npsChange: number;
    pilotsChange: number;
    burnTrend: number[];
    chartData: Array<{
      name: string;
      burn: number;
      runway: number;
      health: string;
    }>;
  }