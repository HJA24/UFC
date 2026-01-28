export interface HdiLevel {
  level: number;
  zIndex: number;
}

export const HDI_CONFIG: Record<string, HdiLevel> = {
  '95%': { level: 0.95, zIndex: 1 },
  '90%': { level: 0.90, zIndex: 2 },
  '75%': { level: 0.75, zIndex: 3 },
  '50%': { level: 0.50, zIndex: 4 },
};
