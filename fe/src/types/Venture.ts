export type VentureStage = 'Discovery' | 'Validation' | 'Pilot' | 'Scale' | 'Growth';
export type VentureHealth = 'On Track' | 'At Risk' | 'Critical';
export type Pod = 'Infrastructure' | 'HealthTech' | 'FinTech' | 'CleanTech' | 'PropTech';

export interface PilotCustomer {
  id: string;
  name: string;
  contract_value: number;
  start_date: string;
  status: 'Active' | 'Churned' | 'Pending';
}

export interface Venture {
    id: string;
    name: string;
    pod: Pod;
    stage: VentureStage;
    founder: string;
    health: VentureHealth;
    description: string;
    burn_rate_monthly: number;
    runway_months: number;
    nps_score: number;
    pilot_customers_count: number;
    last_update_text: string;
    pilot_customers: PilotCustomer[];
  }