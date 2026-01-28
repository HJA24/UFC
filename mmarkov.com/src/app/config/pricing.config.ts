export enum BillingPeriod {
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  ANNUAL = "annually",
}

export interface TierPricing {
    monthly: number;
    quarterly: number;
    annually: number;
}

export const PRICING_CONFIG: Record<string, TierPricing> = {
  strawweight: {
      monthly: 0,
      quarterly: 0,
      annually: 0
  },
  lightweight: {
      monthly: 500,
      quarterly: 450,
      annually: 375
  },
  middleweight: {
      monthly: 750,
      quarterly: 675,
      annually: 562
  },
  heavyweight: {
      monthly: 1000,
      quarterly: 900,
      annually: 750
  },
};
