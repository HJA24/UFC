export interface HdiInterval {
  lower: number;
  upper: number;
  color: string;
  zIndex: number;
}

export interface HdiRow {
  label: string;
  hdis: HdiInterval[];
}
